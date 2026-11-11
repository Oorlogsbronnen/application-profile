#!/usr/bin/env bash
# Bouwt de site en zet website/build/ op de Webslice-server van de gekozen
# omgeving. Draait lokaal (pnpm deploy:acc / deploy:prod) en in GitHub Actions
# (.github/workflows/deploy.yml). Zie specs/2026-11-11-deploy-webslice.md en
# specs/2026-11-11-deploy-github-actions.md.
#
# Gebruik: pnpm deploy:acc [--dry-run]  ·  pnpm deploy:prod [--dry-run]
set -euo pipefail

environment="${1:-}"
dry_run=false
if [[ "${2:-}" == "--dry-run" ]]; then
  dry_run=true
fi
in_ci=false
if [[ "${CI:-}" == "true" ]]; then
  in_ci=true
fi

# De doelmappen staan bewust vast: rsync --delete mag nooit buiten deze
# mappen iets verwijderen. Paden zijn relatief aan de home-map op de server.
case "$environment" in
  acc)
    label="acceptatie"
    server="obnldt@obnl-acc-ws1.cust.webslice.eu"
    root="html/acc-data.oorlogsbronnen.nl/current"
    ;;
  prod)
    label="productie"
    server="obnldt@obnl-prd-ws1.cust.webslice.eu"
    root="html/data.oorlogsbronnen.nl/current"
    ;;
  *)
    echo "Onbekende omgeving '${environment}'. Gebruik: pnpm deploy:acc of pnpm deploy:prod (optioneel met --dry-run)." >&2
    exit 1
    ;;
esac
# De deploy-sleutel van GitHub Actions is op de server met rrsync beperkt tot
# precies deze map; paden zijn dan relatief aan die map.
if [[ "${DEPLOY_RRSYNC:-}" == "1" ]]; then
  root="."
fi

fail() {
  echo "Deploy naar ${label} gestopt: $1" >&2
  exit 1
}

cd "$(git rev-parse --show-toplevel)"

# 1. Alleen schone, gereviewde code gaat online: een commit die op main staat.
#    Acceptatie lokaal: precies de laatste main. Productie: een release-tag.
git fetch --quiet --tags origin main
[[ -z "$(git status --porcelain --untracked-files=no)" ]] ||
  fail "er zijn lokale wijzigingen in getrackte bestanden. Commit of verwijder ze eerst."
untracked="$(git ls-files --others --exclude-standard -- website packages ontology context)"
[[ -z "$untracked" ]] ||
  fail "er staan ongetrackte bestanden in mappen die de build inleest:
${untracked}"
git merge-base --is-ancestor HEAD origin/main ||
  fail "deze commit staat niet op main. Deployen kan alleen vanaf main."

tag=""
if [[ "$environment" == "acc" && "$in_ci" == false ]]; then
  [[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] ||
    fail "je versie is niet gelijk aan origin/main. Haal eerst de laatste versie op met 'git switch main && git pull --ff-only'."
fi
if [[ "$environment" == "prod" ]]; then
  tag="$(git tag --points-at HEAD | grep -E -- '-release$' | sort -V | tail -1 || true)"
  [[ -n "$tag" ]] ||
    fail "deze commit heeft geen release-tag (*-release). Maak een release met 'git tag 1.2.0-release && git push origin 1.2.0-release'; GitHub deployt die dan naar productie."
fi

commit="$(git rev-parse --short HEAD)"
version="commit ${commit}${tag:+ (${tag})}"

# 2. Toegang tot de server en de doelmap controleren, vóór het bouwen. Alles
#    loopt via rsync: de deploy-sleutel van GitHub Actions mag niets anders.
rsync_ssh="ssh -o BatchMode=yes -o ConnectTimeout=10"
rsync -e "$rsync_ssh" --list-only "${server}:${root}/" >/dev/null ||
  fail "geen toegang tot ${server}. Vraag de beheerder om je publieke sleutel toe te voegen."
rsync -e "$rsync_ssh" --list-only "${server}:${root}/public/" >/dev/null ||
  fail "de doelmap ${root}/public bestaat niet op ${server}."

# 3. Lokaal vraagt productie om een expliciete bevestiging. In GitHub Actions
#    is de gepushte release-tag die bevestiging.
if [[ "$environment" == "prod" && "$dry_run" == false && "$in_ci" == false ]]; then
  echo "Je gaat ${version} deployen naar PRODUCTIE (${server}:~/${root}/public)."
  read -r -p "Typ 'productie' om door te gaan: " answer || answer=""
  [[ "$answer" == "productie" ]] || fail "niet bevestigd."
fi

# 4. Bouwen. Mislukt de build (of de bronbestandencontrole), dan stopt set -e
#    hier en wordt er niets geüpload.
pnpm build

# 5. Synchroniseren. --delay-updates en --delete-after zorgen dat de oude
#    site bruikbaar blijft tot alle nieuwe bestanden zijn overgezet.
rsync_options=(
  --recursive --links --times --checksum --compress
  --delete --delete-after --delay-updates --itemize-changes
)
if [[ "$dry_run" == true ]]; then
  rsync_options+=(--dry-run)
fi
changes="$(rsync "${rsync_options[@]}" -e "$rsync_ssh" website/build/ "${server}:${root}/public/")"

added="$(grep -c '^[<>]f+++' <<<"$changes" || true)"
deleted="$(grep -c '^\*deleting' <<<"$changes" || true)"
updated="$(grep -c '^[<>]f' <<<"$changes" || true)"
updated=$((updated - added))

if [[ "$dry_run" == true ]]; then
  grep -E '^([<>]f|\*deleting)' <<<"$changes" || true
  echo
  echo "Proefrun ${label}: ${added} nieuw, ${updated} gewijzigd, ${deleted} verwijderd. Er is niets op de server veranderd."
  exit 0
fi

# 6. Vastleggen welke versie er draait, buiten de publieke map.
revision="$(mktemp)"
trap 'rm -f "$revision"' EXIT
{
  echo "commit: $(git rev-parse HEAD)"
  if [[ -n "$tag" ]]; then
    echo "tag: ${tag}"
  fi
  echo "datum: $(date '+%Y-%m-%dT%H:%M:%S%z')"
  echo "door: ${GITHUB_ACTOR:-$(git config user.name)}"
  if [[ "$in_ci" == true ]]; then
    echo "run: ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
  fi
} >"$revision"
rsync -e "$rsync_ssh" "$revision" "${server}:${root}/REVISION"

echo
echo "Gedeployd naar ${label}: ${version} (${added} nieuw, ${updated} gewijzigd, ${deleted} verwijderd)."
cat "$revision"
