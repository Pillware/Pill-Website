// REQUIREMENTS: none - runs in the browser, called once from the theme's
//   enhanceApp (which already skips SSR).
// DESCRIPTION: Toggles a sidebar section when its own row is clicked while
//   that section is the current page: open collapses, closed expands.
//   VitePress treats the row as a link to the page that is already open, so
//   the click would otherwise do nothing. The caret keeps VitePress's own
//   toggle behaviour.
// USAGE: initSidebarActiveSectionCollapse() from enhanceApp.
// --- MODULE ---

// An expandable section that VitePress marked as the current page.
const ACTIVE_SECTION_SELECTOR = '.VPSidebar .VPSidebarItem.collapsible.is-active';

// Toggles the active section the click landed on. Clicks on the caret, on
// child rows and on any other sidebar entry keep their normal behaviour.
function handleSidebarSectionClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // The caret already toggles the section through VitePress itself.
    if (target.closest('.caret')) return;

    const section = target.closest<HTMLElement>(ACTIVE_SECTION_SELECTOR);
    if (!section) return;

    // Only the section's own row counts - a click inside its children must
    // still navigate to that child page.
    const row = target.closest('.item');
    if (!row || row.parentElement !== section) return;

    event.preventDefault();
    event.stopPropagation();
    section.querySelector<HTMLElement>(':scope > .item > .caret')?.click();
}

let listenerBound = false;

// Binds the delegated click listener once; hot reload can call enhanceApp
// again, and a second binding would toggle twice.
export function initSidebarActiveSectionCollapse(): void {
    if (listenerBound) return;
    listenerBound = true;

    // Capture phase: this runs before the router's link handler, so the
    // navigation to the already open page never starts.
    document.addEventListener('click', handleSidebarSectionClick, { capture: true });
}
