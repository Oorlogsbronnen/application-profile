#!/usr/bin/env bash
# Bouwt de site vanaf een schone, actuele main en zet website/build/ op de
# Webslice-server van de gekozen omgeving. Zie specs/2026-11-11-deploy-webslice.md.
#
# Gebruik: pnpm deploy:acc [--dry-run]  ·  pnpm deploy:prod [--dry-run]
set -euo pipefail

environment="${1:-}"
dry_run=false
if [[ "${2:-}" == "--dry-run" ]]; then
  dry_run=true
fi

# De doelmappen staan bewust vast: rsync --delete mag nooit buiten deze
# mappen iets verwijderen. Paden zijn relatief aan de home-map op de server.
case "$environment" in
  acc)
    label="acceptatie"
    server="obnldt@obnl-acc-ws1.cust.webslice.eu"
    target="html/acc-data.oorlogsbronnen.nl/current/public"
    ;;
  prod)
    label="productie"
    server="obnldt@obnl-prd-ws1.cust.webslice.eu"
    target="html/data.oorlogsbronnen.nl/current/public"
    ;;
  *)
    echo "Onbekende omgeving '${environment}'. Gebruik: pnpm deploy:acc of pnpm deploy:prod (optioneel met --dry-run)." >&2
    exit 1
    ;;
esac
revision_file="$(dirname "$target")/REVISION"

fail() {
  echo "Deploy naar ${label} gestopt: $1" >&2
  exit 1
}

cd "$(git rev-parse --show-toplevel)"

# 1. Alleen een schone, actuele main gaat online.
[[ "$(git branch --show-current)" == "main" ]] ||
  fail "je zit niet op main. Deployen kan alleen vanaf main."
git fetch --quiet origin main
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] ||
  fail "je lokale main is niet gelijk aan origin/main. Haal eerst de laatste versie op met 'git pull --ff-only'."
[[ -z "$(git status --porcelain --untracked-files=no)" ]] ||
  fail "er zijn lokale wijzigingen in getrackte bestanden. Commit of verwijder ze eerst."
untracked="$(git ls-files --others --exclude-standard -- website packages ontology context)"
[[ -z "$untracked" ]] ||
  fail "er staan ongetrackte bestanden in mappen die de build inleest:
${untracked}"

commit="$(git rev-parse --short HEAD)"

# 2. Toegang tot de server en de doelmap controleren, vóór het bouwen.
ssh_options=(-o BatchMode=yes -o ConnectTimeout=10)
ssh "${ssh_options[@]}" "$server" true ||
  fail "geen SSH-toegang tot ${server}. Vraag de beheerder om je publieke sleutel toe te voegen."
ssh "${ssh_options[@]}" "$server" "test -d '${target}'" ||
  fail "de doelmap ~/${target} bestaat niet op ${server}."

# 3. Productie vraagt om een expliciete bevestiging.
if [[ "$environment" == "prod" && "$dry_run" == false ]]; then
  echo "Je gaat commit ${commit} deployen naar PRODUCTIE (${server}:~/${target})."
  read -r -p "Typ 'productie' om door te gaan: " answer
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
changes="$(rsync "${rsync_options[@]}" -e "ssh ${ssh_options[*]}" website/build/ "${server}:${target}/")"

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
printf 'commit: %s\ndatum: %s\ndoor: %s\n' \
  "$(git rev-parse HEAD)" "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$(git config user.name)" |
  ssh "${ssh_options[@]}" "$server" "cat > '${revision_file}'"

echo
echo "Gedeployd naar ${label}: commit ${commit} (${added} nieuw, ${updated} gewijzigd, ${deleted} verwijderd)."
ssh "${ssh_options[@]}" "$server" "cat '${revision_file}'"
