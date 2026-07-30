import { themes as prismThemes } from "prism-react-renderer";
import type { PrismTheme } from "prism-react-renderer";

/*
 * Licht codethema: Prism's github-thema met donkerdere tokenkleuren waar het
 * origineel WCAG AA (4,5:1) niet haalt op de codeblok-achtergrond #f6f8fa
 * (audit 2026-07-29, zie specs/2026-07-29-wcag-fixes-audit.md):
 *
 *   #999988 (comment)          2,71:1  →  #57606a  6,0:1
 *   #e3116c (string)           4,32:1  →  #c2255c  5,3:1
 *   #36acaa (property/number)  2,58:1  →  #0b7285  5,25:1
 *   #00a4db (atrule/attr-name) 2,69:1  →  #0550ae  7,1:1
 *   #d73a49 (function/deleted) 4,30:1  →  #b31d28  6,3:1
 *
 * Latere entries in `styles` winnen; keyword/selector/tag eindigen in het
 * github-thema al op #00009f (13,2:1) en blijven ongemoeid.
 */
export const prismLightTheme: PrismTheme = {
  ...prismThemes.github,
  styles: [
    ...prismThemes.github.styles,
    {
      types: ["comment", "prolog", "cdata"],
      style: { color: "#57606a", fontStyle: "italic" },
    },
    {
      types: ["string", "attr-value"],
      style: { color: "#c2255c" },
    },
    {
      types: [
        "entity",
        "url",
        "symbol",
        "number",
        "boolean",
        "variable",
        "constant",
        "property",
        "regex",
        "inserted",
      ],
      style: { color: "#0b7285" },
    },
    {
      types: ["atrule", "attr-name"],
      style: { color: "#0550ae" },
    },
    {
      types: ["function", "deleted"],
      style: { color: "#b31d28" },
    },
  ],
};
