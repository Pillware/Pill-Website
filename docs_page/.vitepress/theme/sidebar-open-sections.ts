// REQUIREMENTS: none - browser only, set up from the theme's enhanceApp and
//   applied once the app is mounted (see index.ts).
// DESCRIPTION: Keeps reference sidebar sections open across navigation.
//   For page size, every crate page is built with only its own crate's tree
//   (flatten-reference-sidebar.ts), so opening another crate used to close
//   the previous one. The client already holds every crate's tree in the site
//   data, so after mount this module rebuilds the reference sidebars in the
//   browser: every crate the reader opened keeps its tree, and every section
//   keeps the open or closed state the reader left it in.
//   - The state is read from the sidebar markup after each navigation and
//     after each toggle, keyed by section link, and kept in sessionStorage so
//     it also survives a reload in the same tab.
//   - Visiting a crate opens it; collapsing a crate closes it, and once the
//     reader is elsewhere it shrinks back to a plain link.
//   - The rebuilt sidebar is applied before VitePress renders the next page,
//     so open crates never flash closed.
// USAGE: initSidebarOpenSections(context) from enhanceApp, then
//   applySidebarOpenSections() once the layout is mounted.
// --- MODULE ---

import type { DefaultTheme, EnhanceAppContext, SiteData } from 'vitepress'

type SidebarItem = DefaultTheme.SidebarItem
type SidebarMap = Record<string, SidebarItem[]>

const STORAGE_KEY = 'pill-docs-sidebar-open-sections'
const REFERENCE_ROOT = '/reference/'

// Original configuration captured at start-up: crate links in sidebar order and
// each crate's full tree, as built for that crate's own pages.
let siteDataReference: EnhanceAppContext['siteData'] | null = null
let crateLinks: string[] = []
const crateTreeByLink = new Map<string, SidebarItem>()

// Section link -> open (true) or closed (false), as the reader left it.
const sectionOpenByLink = new Map<string, boolean>()

// Crate of the page the sidebar was last built for. Arriving in a different
// crate opens it; moving around inside the same crate respects a collapse.
let lastCrateLink: string | null = null
let lastAppliedSignature = ''

// Turns a config link or an href into one comparable form: path only, no
// ".html" suffix, so "/a/b.html", "/a/b" and "https://host/a/b" all match.
function normalizeLink(link: string): string {
    const path = new URL(link, window.location.origin).pathname
    return path.replace(/\.html$/, '').replace(/\/index$/, '/')
}

// The crate a path belongs to, or null outside the reference crates.
function crateOfPath(path: string): string | null {
    const normalizedPath = normalizeLink(path)
    return crateLinks.find((crateLink) => normalizedPath.startsWith(crateLink)) ?? null
}

// Restores the remembered state from this tab's previous pages. Storage can be
// unavailable (private mode, blocked site data); the feature then just starts
// empty.
function loadState(): void {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (!stored) return
        for (const [link, isOpen] of JSON.parse(stored) as [string, boolean][]) {
            sectionOpenByLink.set(link, isOpen)
        }
    } catch {
        // Ignore unreadable or blocked storage.
    }
}

function saveState(): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...sectionOpenByLink]))
    } catch {
        // Ignore full or blocked storage.
    }
}

// Records the open or closed state of every collapsible section currently in
// the sidebar markup, including sections VitePress opened on its own because
// they lead to the current page.
function recordSidebarState(): void {
    const sections = document.querySelectorAll<HTMLElement>('.VPSidebar .VPSidebarItem.collapsible')
    if (!sections.length) return
    sections.forEach((section) => {
        const href = section.querySelector(':scope > .item > a')?.getAttribute('href')
        if (!href) return
        sectionOpenByLink.set(normalizeLink(href), !section.classList.contains('collapsed'))
    })
    saveState()
}

// Copies a section tree with each section's remembered state applied. Sections
// the reader never touched keep their configured state.
function withRememberedState(sidebarItem: SidebarItem): SidebarItem {
    const rememberedOpen = sidebarItem.link ? sectionOpenByLink.get(normalizeLink(sidebarItem.link)) : undefined
    return {
        ...sidebarItem,
        ...(rememberedOpen === undefined || sidebarItem.collapsed === undefined ? {} : { collapsed: !rememberedOpen }),
        ...(sidebarItem.items ? { items: sidebarItem.items.map(withRememberedState) } : {})
    }
}

// A closed crate is a plain link; the empty `items` keeps it a top-level entry
// (see flatten-reference-sidebar.ts).
function crateLinkEntry(crateLink: string): SidebarItem {
    const crateTree = crateTreeByLink.get(crateLink)!
    return { text: crateTree.text, link: crateTree.link, items: [] }
}

// Builds the sidebar of every reference key: the key's own crate and every
// crate the reader has open carry their trees, the rest are plain links.
function buildReferenceSidebars(): SidebarMap {
    const entryByCrate = new Map<string, SidebarItem>()
    const openTreeByCrate = new Map<string, SidebarItem>()
    for (const crateLink of crateLinks) {
        const crateTree = withRememberedState(crateTreeByLink.get(crateLink)!)
        openTreeByCrate.set(crateLink, crateTree)
        entryByCrate.set(crateLink, sectionOpenByLink.get(crateLink) ? crateTree : crateLinkEntry(crateLink))
    }

    const sidebars: SidebarMap = {
        [REFERENCE_ROOT]: crateLinks.map((crateLink) => entryByCrate.get(crateLink)!)
    }
    for (const keyCrateLink of crateLinks) {
        sidebars[keyCrateLink] = crateLinks.map((crateLink) =>
            crateLink === keyCrateLink ? openTreeByCrate.get(crateLink)! : entryByCrate.get(crateLink)!
        )
    }
    return sidebars
}

// Rebuilds the reference sidebars for a navigation to the given path and hands
// them to VitePress. Nothing is replaced when the result would be identical,
// so moving between pages of one crate does not re-create the sidebar.
function applyForPath(path: string): void {
    if (!siteDataReference || !crateLinks.length) return

    const crateLink = crateOfPath(path)
    if (crateLink && crateLink !== lastCrateLink) {
        sectionOpenByLink.set(crateLink, true)
        saveState()
    }
    lastCrateLink = crateLink

    const referenceSidebars = buildReferenceSidebars()
    const signature = JSON.stringify(referenceSidebars)
    if (signature === lastAppliedSignature) return
    lastAppliedSignature = signature

    const currentSiteData: SiteData = siteDataReference.value
    const currentSidebar = currentSiteData.themeConfig.sidebar as SidebarMap
    siteDataReference.value = {
        ...currentSiteData,
        themeConfig: {
            ...currentSiteData.themeConfig,
            sidebar: { ...currentSidebar, ...referenceSidebars }
        }
    }
}

// Records toggles shortly after they happen, once Vue has updated the class.
// Click covers the caret, the row and the programmatic clicks of
// sidebar-collapse.ts; keydown covers Enter and Space on a focused caret.
function handleSidebarInteraction(event: Event): void {
    const target = event.target as HTMLElement | null
    if (!target?.closest('.VPSidebar')) return
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
    window.setTimeout(recordSidebarState, 50)
}

let initialised = false

// Captures the configured reference sidebars and hooks into navigation. Runs
// in enhanceApp, before the first render, so it changes nothing yet: the
// first page must hydrate against exactly the server-rendered sidebar.
export function initSidebarOpenSections(context: EnhanceAppContext): void {
    if (initialised) return
    initialised = true
    siteDataReference = context.siteData

    const sidebar = context.siteData.value.themeConfig.sidebar as SidebarMap | undefined
    crateLinks = (sidebar?.[REFERENCE_ROOT] ?? [])
        .map((crateItem) => crateItem.link)
        .filter((link): link is string => !!link)
        .map(normalizeLink)
    for (const crateLink of crateLinks) {
        const crateTree = sidebar?.[crateLink]?.find((crateItem) => crateItem.link && normalizeLink(crateItem.link) === crateLink)
        if (crateTree) crateTreeByLink.set(crateLink, crateTree)
    }
    crateLinks = crateLinks.filter((crateLink) => crateTreeByLink.has(crateLink))
    if (!crateLinks.length) return

    loadState()

    // Router navigation: record the page being left, then rebuild before the
    // next page renders. Chained so an existing hook keeps working.
    const previousBeforeRouteChange = context.router.onBeforeRouteChange
    context.router.onBeforeRouteChange = async (href: string) => {
        const previousResult = await previousBeforeRouteChange?.(href)
        if (previousResult === false) return false
        recordSidebarState()
        applyForPath(href)
    }

    // Back and forward bypass onBeforeRouteChange; this listener runs before
    // the router has loaded the page (the markup is still the old page's), so
    // the record and the rebuild still land first.
    window.addEventListener('popstate', () => {
        recordSidebarState()
        applyForPath(window.location.pathname)
    })

    document.addEventListener('click', handleSidebarInteraction)
    document.addEventListener('keydown', handleSidebarInteraction)
}

// First application, once the app is mounted (after hydration in production),
// then a record of what VitePress opened for the current page.
export function applySidebarOpenSections(): void {
    applyForPath(window.location.pathname)
    window.setTimeout(recordSidebarState, 100)
}

// Records the sections VitePress opened for a page just navigated to. Called
// from the theme's route-change hook.
export function recordSidebarOpenSections(): void {
    recordSidebarState()
}
