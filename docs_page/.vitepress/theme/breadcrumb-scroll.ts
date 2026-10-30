// REQUIREMENTS: none - browser only.
// DESCRIPTION: Remembers the sidebar path that was clicked in the page
//   breadcrumb and, once the new page has rendered, scrolls the sidebar so
//   that row sits at the top of the sidebar (just below the navbar).
//   The state lives at module scope because the breadcrumb component is
//   re-created on every navigation.
// USAGE: rememberSidebarScrollTarget(href) right before navigating, then
//   scrollSidebarToRememberedTarget() after the route finished changing.
// --- MODULE ---

// Space kept between the navbar and the row that is scrolled to.
const NAVBAR_GAP = 8;

const DEFAULT_NAV_HEIGHT = 64;

let pendingHref: string | null = null;

// Stores the sidebar link the user picked in the breadcrumb.
export function rememberSidebarScrollTarget(href: string): void {
    pendingHref = href;
}

// Scrolls the sidebar's own scroll area; the row is matched by its link so
// rows with the same label in different crates cannot be confused.
export function scrollSidebarToRememberedTarget(): void {
    const href = pendingHref;
    pendingHref = null;
    if (!href) return;

    const sidebar = document.querySelector<HTMLElement>('.VPSidebar');
    if (!sidebar) return;

    const anchor = Array.from(sidebar.querySelectorAll<HTMLAnchorElement>('a.VPLink')).find(
        (element) => element.getAttribute('href') === href
    );
    const row = anchor?.closest<HTMLElement>('.VPSidebarItem');
    if (!row) return;

    const navHeight =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) ||
        DEFAULT_NAV_HEIGHT;
    const rowOffset = row.getBoundingClientRect().top - sidebar.getBoundingClientRect().top;
    const targetTop = Math.max(0, sidebar.scrollTop + rowOffset - navHeight - NAVBAR_GAP);

    // Smooth in a visible tab, instant when the page is in the background: the
    // smooth animation is driven by animation frames and never finishes there.
    sidebar.scrollTo({
        top: targetTop,
        behavior: document.visibilityState === 'visible' ? 'smooth' : 'instant'
    });
}
