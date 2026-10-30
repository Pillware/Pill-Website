// REQUIREMENTS: none - browser only, called from the theme's enhanceApp.
// DESCRIPTION: Marks sidebar subtrees that finished collapsing with
//   [data-collapsed-settled], so styles.css can switch them to
//   content-visibility: hidden and keep thousands of rows out of layout and
//   paint.
//   The marker must never be present while a section animates, otherwise its
//   children vanish in a single frame instead of sliding with the parent.
//   Therefore:
//   - it is removed on the click that starts a toggle (capture phase, before
//     Vue flips the class), so expanding finds a fully rendered subtree;
//   - it is added on the height transitionend, i.e. once the collapse is over.
//   Both listeners live on the document, because VitePress re-creates the
//   sidebar markup on navigation and element-bound listeners would go stale.
// USAGE: initSidebarCollapseAnimation() from enhanceApp and
//   refreshSidebarCollapseSettling() after a route change.
// --- MODULE ---

const SETTLED_ATTRIBUTE = 'data-collapsed-settled';

function itemsOf(sidebarItem: Element): HTMLElement | null {
    return sidebarItem.querySelector<HTMLElement>(':scope > .items');
}

// Marks every collapsed section below the given root. Safe at any time: only
// sections that are already closed are touched, so nothing mid-animation can
// be hidden by it.
export function refreshSidebarCollapseSettling(): void {
    document
        .querySelectorAll<HTMLElement>('.VPSidebar .VPSidebarItem.collapsible.collapsed > .items')
        .forEach((items) => items.setAttribute(SETTLED_ATTRIBUTE, ''));
}

// Clears the marker on the section a click is about to toggle. Runs in the
// capture phase, before VitePress changes the collapsed class.
function prepareSectionForToggle(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const row = target.closest('.caret')?.parentElement ?? target.closest('.item');
    const sidebarItem = row?.closest<HTMLElement>('.VPSidebarItem.collapsible');
    if (!sidebarItem) return;

    itemsOf(sidebarItem)?.removeAttribute(SETTLED_ATTRIBUTE);
}

// Marks a section once its collapse finished. transitionend bubbles, so one
// listener covers every section and every re-render.
function settleAfterCollapse(event: TransitionEvent): void {
    const items = event.target;
    if (!(items instanceof HTMLElement) || !items.classList.contains('items')) return;
    if (event.propertyName !== 'height') return;

    if (items.parentElement?.classList.contains('collapsed')) {
        items.setAttribute(SETTLED_ATTRIBUTE, '');
    }
}

let animationInitialised = false;

export function initSidebarCollapseAnimation(): void {
    if (animationInitialised) return;
    animationInitialised = true;

    document.addEventListener('click', prepareSectionForToggle, { capture: true });
    document.addEventListener('transitionend', settleAfterCollapse, { capture: true });

    // Dev mode renders the app client-side, so the sidebar does not exist yet
    // when enhanceApp runs; settle it as soon as it appears.
    const settleWhenReady = (attemptsLeft: number): void => {
        if (!document.querySelector('.VPSidebar')) {
            if (attemptsLeft > 0) window.setTimeout(() => settleWhenReady(attemptsLeft - 1), 100);
            return;
        }
        refreshSidebarCollapseSettling();
    };
    settleWhenReady(50);
}
