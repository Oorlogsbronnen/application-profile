import type { ClientModule } from "@docusaurus/types";

/**
 * De zoekplugin hardcodeert aria-label="Search", terwijl de zichtbare
 * placeholder via i18n "Zoeken" is — een Label-in-Name-mismatch
 * (WCAG 2.5.3). Tot dit upstream is opgelost trekken we het attribuut hier
 * gelijk met de placeholder (theme.SearchBar.label uit i18n/nl/code.json).
 */
const searchAriaLabel: ClientModule = {
  onRouteDidUpdate() {
    for (const input of document.querySelectorAll<HTMLInputElement>(
      "input.navbar__search-input",
    )) {
      input.setAttribute("aria-label", input.placeholder);
    }
  },
};

export default searchAriaLabel;
