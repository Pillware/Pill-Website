import type { DefaultTheme } from 'vitepress'

// Shape of one generated entry. `.vitepress/reference-sidebar.ts` is produced by
// the Pill-Docs generator and is never edited here.
type SidebarItem = DefaultTheme.SidebarItem

// Badge shown in front of an entry, keyed by the generated category heading it
// came from. The headings themselves are not rendered.
const CATEGORY_BADGES: Record<string, string> = {
    Structs: 'st',
    Enums: 'enum',
    Functions: 'fn',
    Constants: 'const',
    Traits: 'trait',
    'Type aliases': 'alias',
    'Type definitions': 'type',
    Unions: 'union',
    Statics: 'static',
    Macros: 'macro',
    'Procedural macros': 'macro'
}

// A category group is a generated heading such as "Structs" or "Functions": no
// link of its own, and every child is a plain link.
function isCategoryGroup(sidebarItem: SidebarItem): boolean {
    return (
        !sidebarItem.link &&
        Array.isArray(sidebarItem.items) &&
        sidebarItem.items.length > 0 &&
        sidebarItem.items.every((childItem) => !!childItem.link && !childItem.items?.length)
    )
}

// The "Modules" heading only groups module entries, which are pages of their
// own. It is dropped so the modules sit directly below the crate.
function isModulesGroup(sidebarItem: SidebarItem): boolean {
    return !sidebarItem.link && sidebarItem.text === 'Modules'
}

// Escapes the small amount of HTML carried in the sidebar text. Names come from
// Rust identifiers, but the value is injected with v-html so it stays safe.
function escapeHtml(text: string): string {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
}

// Renders one entry as "kind badge + name". With the category headings gone the
// badge is the only thing that tells an entry's kind.
function withKindBadge(sidebarItem: SidebarItem, categoryText: string): SidebarItem {
    const badge = CATEGORY_BADGES[categoryText]
    if (!badge) return sidebarItem
    return {
        ...sidebarItem,
        text: `<span class="ref-kind">${badge}</span>${escapeHtml(sidebarItem.text)}`
    }
}

// Rewrites one sibling list:
// - a category group becomes its entries, each carrying a kind badge;
// - the "Modules" heading is removed, so its modules keep their collapsible
//   place one level below the crate;
// - any other group is kept and its children are rewritten the same way.
function expandCategoryGroups(sidebarItems: SidebarItem[]): SidebarItem[] {
    return sidebarItems.flatMap((sidebarItem) => {
        if (isCategoryGroup(sidebarItem)) {
            return (sidebarItem.items ?? []).map((childItem) => withKindBadge(childItem, sidebarItem.text))
        }

        if (isModulesGroup(sidebarItem)) {
            return (sidebarItem.items ?? []).map((moduleItem) => ({
                ...moduleItem,
                items: expandCategoryGroups(moduleItem.items ?? [])
            }))
        }

        if (!sidebarItem.items?.length) return [sidebarItem]
        return [{ ...sidebarItem, items: expandCategoryGroups(sidebarItem.items) }]
    })
}

// Entry point used by the site config: modules stay collapsible, categories are
// flattened into badged entries. Crate titles carry a marker span so the tree
// guide line can be scoped to the reference sidebar in CSS.
export function flattenReferenceCategories(sidebarItems: SidebarItem[]): SidebarItem[] {
    return expandCategoryGroups(sidebarItems).map((crateItem) =>
        crateItem.link && crateItem.items?.length
            ? { ...crateItem, text: `<span class="ref-root">${escapeHtml(crateItem.text)}</span>` }
            : crateItem
    )
}

// True when the entry is a crate page carrying its own module tree.
function isCrateItem(sidebarItem: SidebarItem): boolean {
    return typeof sidebarItem.link === 'string' && !!sidebarItem.items?.length
}

// Builds the multi-sidebar map for the reference section. VitePress resolves a
// page against the longest matching key, so a page under /reference/<crate>/
// renders that crate's tree instead of all ~3,400 reference entries. A single
// shared key used to put the whole tree into the markup of every page, which
// cost about 2 MB of HTML per page and most of the build time.
// Every crate stays reachable: the other crates are listed as plain links.
export function buildReferenceSidebarMap(sidebarItems: SidebarItem[]): Record<string, SidebarItem[]> {
    const crateItems = flattenReferenceCategories(sidebarItems).filter(isCrateItem)

    // A crate as a plain link, used for the landing page and for the crates
    // that are not the current one. The empty `items` matters: VitePress
    // gathers consecutive entries without `items` into one anonymous group,
    // which renders them one level deeper (smaller text, tree guide line)
    // than the expanded crate. With it, each crate is its own level-0 title.
    const toCrateLink = (crateItem: SidebarItem): SidebarItem => ({
        text: crateItem.text,
        link: crateItem.link,
        items: []
    })
    const crateLinks: SidebarItem[] = crateItems.map(toCrateLink)

    const sidebarByPath: Record<string, SidebarItem[]> = {
        // Reference landing page and any page outside a crate.
        '/reference/': crateLinks
    }

    for (const activeCrateItem of crateItems) {
        sidebarByPath[activeCrateItem.link as string] = crateItems.map((crateItem) =>
            crateItem === activeCrateItem ? crateItem : toCrateLink(crateItem)
        )
    }

    return sidebarByPath
}
