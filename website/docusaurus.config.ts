import { themes as prismThemes } from "prism-react-renderer";
import type { Config, Plugin } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Lokale tegenhanger van de Netlify-proxy in static/_redirects: de dev-server
 * stuurt /spinque-api/* server-side door naar de Spinque API, zodat de live
 * API-voorbeelden ook met `pnpm start` te testen zijn. `docusaurus serve`
 * heeft geen proxy; daar (en op Netlify vóór de allowlist-wijziging) vallen
 * de voorbeelden terug op de vastgelegde responses.
 */
function spinqueDevProxy(): Plugin {
  return {
    name: "spinque-dev-proxy",
    configureWebpack: () =>
      // webpack's Configuration-type kent `devServer` alleen wanneer de
      // typedefinities van webpack-dev-server geladen zijn; dat pakket is
      // hier alleen transitief aanwezig, vandaar de cast.
      ({
        devServer: {
          proxy: [
            {
              context: ["/spinque-api"],
              target: "https://rest.spinque.com",
              changeOrigin: true,
              pathRewrite: { "^/spinque-api": "/4/oorlogsbronnen/api/in10" },
            },
          ],
        },
      }) as ReturnType<NonNullable<Plugin["configureWebpack"]>>,
  };
}

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

  markdown: {
    mermaid: true,
    // De gegenereerde /schema-pagina gebruikt expliciete heading-ankers
    // ({#LocalName}); die syntax staat achter deze compat-vlag.
    mdx1Compat: {
      headingIds: true,
    },
  },
  themes: ["@docusaurus/theme-mermaid"],

  plugins: [
    spinqueDevProxy,
    [
      "docusaurus-plugin-llms",
      {
        title: "data.oorlogsbronnen",
        description:
          "Documentatie van het Oorlogsbronnen dataplatform: linked data en API's over personen, gebeurtenissen en bronnen uit de Tweede Wereldoorlog in Nederland.",
        generateMarkdownFiles: true,
        excludeImports: true,
        // Volgorde gelijk aan de sidebar
        includeOrder: [
          "index.md",
          "datasets/**",
          "services/**",
          "datamodel/**",
          "cookbook/**",
          "iiif.md",
          "rechten-en-gebruik.md",
          "meedoen.md",
          "contact.md",
        ],
        // Directe toegang tot de data, bovenin llms.txt — één fetch is genoeg
        rootContent: [
          "## Directe toegang tot de data",
          "",
          "- SPARQL-endpoint: https://platform.ldmax.nl/organisaties/wo2net/query",
          "- Machine-leesbaar datamodel (SHACL/Turtle): https://data.oorlogsbronnen.nl/schema.ttl — leesbare versie op https://data.oorlogsbronnen.nl/schema",
          "- REST API (Spinque): https://docs.spinque.com/3.0/using-apis/basic.html — JavaScript/TypeScript-client: `@spinque/query-api` (npm)",
          "- Datasets op LDmax (https://platform.ldmax.nl/organisaties/wo2net): WO2 Personen en WO2 Collecties (licentie CC-BY-NC-SA 4.0, niet-commercieel), WO2 Thesaurus (CC0 1.0)",
          "",
          "Vermeld bij hergebruik de bron en respecteer de licenties: de personen- en collectiedata is niet-commercieel gelicenseerd.",
        ].join("\n"),
      },
    ],
  ],

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
    mermaid: {
      // 'strict' schakelt klik-interacties uit; de klasseboxen in de
      // /schema-diagrammen linken naar hun sectie. 'antiscript' houdt
      // HTML-encoding aan maar staat href-links toe.
      options: {
        securityLevel: "antiscript",
      },
    },
    navbar: {
      title: "data.oorlogsbronnen",
      logo: {
        alt: "Oorlogsbronnen",
        src: "img/logo.svg",
        srcDark: "img/logo-dark.svg",
      },
      items: [
        {
          href: "https://github.com/Oorlogsbronnen",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Services",
          items: [
            {
              label: "LDmax",
              href: "https://platform.ldmax.nl/organisaties/wo2net",
            },
            {
              label: "Spinque API-documentatie",
              href: "https://docs.spinque.com/3.0/using-apis/basic.html",
            },
          ],
        },
        {
          title: "Meer",
          items: [
            {
              label: "Oorlogsbronnen.nl",
              href: "https://www.oorlogsbronnen.nl",
            },
            {
              label: "GitHub",
              href: "https://github.com/Oorlogsbronnen",
            },
          ],
        },
        {
          title: "Contact",
          items: [
            {
              label: "Contact",
              to: "/contact",
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["turtle", "sparql", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
