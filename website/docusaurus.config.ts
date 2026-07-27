import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "data.oorlogsbronnen",
  tagline: "Documentatie van het Oorlogsbronnen dataplatform",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://data.oorlogsbronnen.nl",
  baseUrl: "/",

  organizationName: "Oorlogsbronnen",
  projectName: "application-profile",

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "nl",
    locales: ["nl"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/Oorlogsbronnen/application-profile/tree/data/website/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "data.oorlogsbronnen",
      items: [
        {
          href: "https://github.com/Oorlogsbronnen/application-profile",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Linked Data",
          items: [
            {
              label: "LDmax (Stichting WO2Net)",
              href: "https://platform.ldmax.nl/organisaties/wo2net",
            },
          ],
        },
        {
          title: "REST API",
          items: [
            {
              label: "Spinque API-documentatie",
              href: "https://docs.spinque.com/3.0/using-apis/basic.html",
            },
            {
              label: "@spinque/query-api",
              href: "https://www.npmjs.com/package/@spinque/query-api",
            },
          ],
        },
        {
          title: "Meer",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/Oorlogsbronnen/application-profile",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Oorlogsbronnen`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["turtle", "sparql", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
