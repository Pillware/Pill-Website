import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { buildReferenceSidebarMap } from './flatten-reference-sidebar'
import { truncateHugeCodeBlocks } from './truncate-huge-code-blocks'

// Content commit written by scripts/mirror-pill-docs-content.mjs. Missing until the first
// sync; the footer then reports the version as unknown.
const contentVersionPath = fileURLToPath(new URL('./content-version.json', import.meta.url))
const contentVersion = existsSync(contentVersionPath)
  ? JSON.parse(readFileSync(contentVersionPath, 'utf8'))
  : null

// API reference sidebar written by `npm run docs:update-reference`. It is read
// at runtime instead of imported, so dev and build still work in a checkout
// that has never synced the reference: the site then simply has no Reference
// section. The generated file is a typed export of a plain JSON array.
function readReferenceSidebarItems(): DefaultTheme.SidebarItem[] {
  const sidebarPath = fileURLToPath(new URL('./reference-sidebar.ts', import.meta.url))
  if (!existsSync(sidebarPath)) {
    return []
  }
  const sidebarSource = readFileSync(sidebarPath, 'utf8')
  // Skip past the `=` so the `[]` of the type annotation is not mistaken for the array.
  const assignmentIndex = sidebarSource.indexOf('=', sidebarSource.indexOf('codeReferenceSidebarItems'))
  const arrayStart = sidebarSource.indexOf('[', assignmentIndex)
  try {
    return JSON.parse(sidebarSource.slice(arrayStart))
  } catch (parseError) {
    throw new Error(`Could not read ${sidebarPath}; run "npm run docs:update-reference" again. ${parseError}`)
  }
}

const codeReferenceSidebarItems = readReferenceSidebarItems()
const hasReference = codeReferenceSidebarItems.length > 0

// Shared guide navigation. The same tree serves the experimental snapshot at
// /guide/ and the current guide at /guide_current/. Roots are collapsible and
// start expanded so the whole guide stays visible.
function createGuideSidebar(prefix: string): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Welcome', link: `${prefix}/` },
        { text: 'What is Pill?', link: `${prefix}/what-is-pill` }
      ],
    },
    {
      text: 'Getting Started',
      collapsed: false,
      items: [
        { text: 'Setup', link: `${prefix}/getting-started/setup` },
        { text: 'Pill Launcher', link: `${prefix}/getting-started/pill-launcher` },
        { text: 'ECS (Entity Component System)', link: `${prefix}/getting-started/ecs` },
        { text: 'Resources', link: `${prefix}/getting-started/resources` }
      ]
    },
    {
      text: 'Next Steps',
      collapsed: false,
      items: [
        { text: 'Next Steps', link: `${prefix}/next-steps` }
      ]
    },
    {
      text: 'Help',
      collapsed: false,
      items: [
        { text: 'Troubleshooting', link: `${prefix}/troubleshooting` }
      ]
    },
    {
      text: 'Advanced',
      collapsed: false,
      items: [
        { text: 'Pill Launcher', link: `${prefix}/advanced/pill-launcher` },
      ]
    },
    {
      text: 'Engine Development',
      collapsed: false,
      items: [
        {
          text: 'Contributing',
          link: `${prefix}/contributing/contributing`,
          collapsed: false,
          items: [
            { text: 'Coding Standards', link: `${prefix}/contributing/coding-standards` },
            { text: 'Code of Conduct', link: `${prefix}/contributing/code-of-conduct` },
          ]
        },
        { text: 'CI Pipeline', link: `${prefix}/advanced/ci-pipeline` }
      ]
    },
    {
      text: 'Other',
      collapsed: false,
      items: [
        { text: 'Brand Identity', link: `${prefix}/other/brand-identity` },
      ]
    }
  ];
}

// `vitepress dev` renders every page for the local search index before it
// starts listening. Rendering the ~3,450 reference pages delays every dev
// start, so the dev server indexes the guide only; production builds still
// index everything.
const isDevServer = process.argv.includes('dev')

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    base: '/',
    srcDir: 'pages',
    // The generated reference can contain rustdoc intra-doc links that the
    // generator could not resolve; they arrive verbatim as "./crate::Item" or
    // "./mod@name" and point at no page. Ignore only that shape so genuine
    // dead links still fail the build.
    ignoreDeadLinks: [/^\.\/(?:::)?[A-Za-z_]\w*::/, /^\.\/mod@/],

    // The dev server's watcher opens one handle per file on Windows, about
    // 3,800 with the generated reference pages. They only change through
    // `npm run docs:update-reference`, so restart the dev server after an
    // update instead of watching them. Together with the dev search index
    // above this cuts dev startup from ~13 s to ~2 s.
    vite: {
      server: {
        watch: {
          ignored: ['**/pages/reference/**', '**/.content/**']
        }
      }
    },

    title: "Pill Docs",
    description: "Guide and API reference for Pill - a modern, free and blazingly fast game engine",
    head: [
      // Google Fonts
      ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
      ['link', { href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
      // Favicons (the PNG pair follows the browser theme wherever the SVG
      // favicon is not rasterized, e.g. older Android Chrome)
      ['link', { rel: 'icon', type: 'image/png', href: '/favicons/favicon-96x96.png', sizes: '96x96', media: '(prefers-color-scheme: light)' }],
      ['link', { rel: 'icon', type: 'image/png', href: '/favicons/favicon-96x96-dark.png', sizes: '96x96', media: '(prefers-color-scheme: dark)' }],
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' }],
      ['link', { rel: 'shortcut icon', href: '/favicons/favicon.ico' }],
      ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicons/apple-touch-icon.png' }],
      ['link', { rel: 'manifest', href: '/favicons/site.webmanifest' }],
      // Social meta
      ['meta', { property: 'og:title', content: 'Pill Docs' }],
      ['meta', { property: 'og:description', content: 'Guide and API reference for Pill Engine' }],
      ['meta', { property: 'og:image', content: '/favicons/web-app-manifest-512x512.png' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      // Analytics (Umami). data-domains keeps the tracker off localhost and
      // preview deployments; both production domain families are listed.
      ['script', { defer: '', src: 'https://umami.pillengine.org/script.js', 'data-website-id': 'be02f2ef-9344-46d7-bc07-c9c56af6531e', 'data-domains': 'pillengine.org,www.pillengine.org,docs.pillengine.org,pill.rocks,www.pill.rocks,docs.pill.rocks' }],
      // Report 404s with the attempted path so broken inbound links show up
      // in the dashboard. The 404 view is client rendered, so the check runs
      // on load and then polls briefly (the static page title is an early
      // signal; .NotFound is the rendered view once the app hydrates).
      ['script', {}, `
        (() => {
          let reported = false;
          const reportMissingPage = () => {
            if (reported) return;
            if (document.querySelector('.NotFound') || document.title.startsWith('404')) {
              reported = true;
              window.umami?.track('page-404', { path: window.location.pathname });
            }
          };
          window.addEventListener('load', reportMissingPage);
          let attempts = 0;
          const poller = setInterval(() => {
            reportMissingPage();
            if (reported || ++attempts >= 12) clearInterval(poller);
          }, 250);
        })();
      `],
      // AI / LLM discovery: curated index generated by scripts/generate-llm-documentation-artifacts.mjs
      ['link', { rel: 'alternate', type: 'text/plain', href: '/llms.txt', title: 'LLM-friendly docs' }]
    ],

    // Points every page at its clean Markdown mirror (written after
    // `vitepress build` by scripts/generate-llm-documentation-artifacts.mjs) so AI agents and tools
    // can request plain Markdown instead of rendered HTML.
    transformHead({ pageData }) {
      return [
        ['link', { rel: 'alternate', type: 'text/markdown', href: `/markdown/${pageData.relativePath}` }],
      ]
    },

    // Publishes which content commit this build holds. The deploy workflow
    // reads it back from the live site to skip rebuilds when nothing changed.
    buildEnd(siteConfig) {
      const buildInfo = {
        content: contentVersion,
        siteCommit: process.env.GITHUB_SHA || null,
        builtAt: new Date().toISOString(),
      }
      writeFileSync(join(siteConfig.outDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2) + '\n')
    },

    markdown: {
      html: true,
      // rustdoc constants that embed fonts/images as multi-megabyte byte
      // strings otherwise cost the most time in the whole build (three
      // highlighter passes and a search-index entry each) for a value nobody
      // can read.
      config: truncateHugeCodeBlocks,
      // rustdoc marks doc-test examples with attributes in place of a language
      // (```no_run, ```ignore, ...). They are Rust code, so highlight them as
      // Rust instead of warning and falling back to plain text.
      languageAlias: {
        no_run: 'rust',
        ignore: 'rust',
        compile_fail: 'rust',
        should_panic: 'rust',
        edition2018: 'rust',
        edition2021: 'rust',
        edition2024: 'rust'
      }
    },

    mermaid: {
      flowchart: {
        curve: 'step'
      }
    },

    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      siteTitle: 'pill docs',

      // Rendered by theme/ContentVersion.vue at the bottom of every page.
      contentVersion,

      nav: [
        {
          // The current guide lives at /guide_current/; the older snapshot and
          // the API reference are linked as experimental from the home page.
          text: 'Guide',
          link: '/guide_current/',
          activeMatch: '^/guide'
        },
        // Only linked when the reference has been synced into this checkout.
        ...(hasReference
          ? [{
            text: 'Reference',
            link: '/reference/',
            activeMatch: '^/reference/'
          }]
          : [])
      ],

      outline: {
        level: [2, 3],
        label: 'On this page'
      },

      search: {
        provider: 'local',
        options: {
          // Skips reference pages from the index on the dev server only (see
          // isDevServer); everything else renders as VitePress would by default.
          _render(source, environment, markdownRenderer) {
            if (isDevServer && environment.relativePath.startsWith('reference/')) {
              return ''
            }
            return markdownRenderer.render(source, environment)
          }
        }
      },

      sidebar: {
        '/guide/': createGuideSidebar('/guide'),
        '/guide_current/': createGuideSidebar('/guide_current'),
        // One sidebar per crate: a page only renders its own crate tree, while
        // the other crates stay reachable as plain links.
        ...buildReferenceSidebarMap(codeReferenceSidebarItems)
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/Pillware/Pill' }
      ]
    }
  })
)