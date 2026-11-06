// Docs framework: https://vitepress.dev/reference/site-config

import DefaultTheme from 'vitepress/theme'
import type { Theme, EnhanceAppContext } from 'vitepress'
import { defineComponent, h, onMounted } from 'vue'
import { enlargeMermaidDiagrams } from './mermaid'
import { initSearchTracking } from './search-tracking'
import { initHomeBackground } from './hero-dither'
import { initSidebarActiveSectionCollapse } from './sidebar-collapse'
import { initSidebarCollapseAnimation, refreshSidebarCollapseSettling } from './sidebar-collapse-animation'
import { applySidebarOpenSections, initSidebarOpenSections, recordSidebarOpenSections } from './sidebar-open-sections'
import TreeBreadcrumb from './TreeBreadcrumb.vue'
import ContentVersion from './ContentVersion.vue'
import PreviewDocsLinks from './PreviewDocsLinks.vue'
import '../../../pill_style.css'
import './styles.css'

// Scroll progress bar showing how deep the user has scrolled on the page.
// Mounts once and returns an update callback used after route changes.
function mountScrollProgress(): { update: () => void } {
  if (document.getElementById('scroll-progress')) {
    // Hot reload can re-run enhanceApp; keep the existing bar.
    return { update: () => { } };
  }

  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.appendChild(bar);

  const update = () => {
    const documentElement = document.documentElement;
    const scrollTop = window.scrollY || documentElement.scrollTop || 0;
    const scrollHeight = documentElement.scrollHeight - documentElement.clientHeight;
    const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = percentage + '%';
  };

  // Throttle via requestAnimationFrame so the bar stays smooth.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  return { update };
}

// ── Brand identity copy-to-clipboard ──
// Color swatches copy their hex (data-color) and other `.brand-copyable`
// elements copy their data-copy value, on click/Enter/Space, then briefly show
// a "Copied" toast (data-copy-label overrides its text). Uses document-level
// delegation so it works on any route (and after SPA navigation) without
// re-binding.
const COPYABLE_SELECTOR = '.color-swatch, .brand-copyable';
let brandCopyBound = false;
let copiedToastTimer: ReturnType<typeof setTimeout> | null = null;
let copiedToastElement: HTMLElement | null = null;

function showCopiedToast(message: string): void {
  if (!copiedToastElement) {
    copiedToastElement = document.createElement('div');
    copiedToastElement.className = 'brand-copied-toast';
    document.body.appendChild(copiedToastElement);
  }
  copiedToastElement.textContent = message;
  copiedToastElement.classList.add('brand-copied-toast-visible');
  if (copiedToastTimer) clearTimeout(copiedToastTimer);
  copiedToastTimer = setTimeout(() => {
    copiedToastElement?.classList.remove('brand-copied-toast-visible');
  }, 1000);
}

// Copies the value an element carries (data-copy, or a swatch's data-color)
// and shows the toast with its label.
function copyElementValue(copyableElement: HTMLElement): void {
  const value = copyableElement.getAttribute('data-copy') || copyableElement.getAttribute('data-color') || '';
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).catch(() => { });
  }
  showCopiedToast(copyableElement.getAttribute('data-copy-label') || 'HEX copied to clipboard');
}

function handleBrandSwatchClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const copyableElement = target.closest<HTMLElement>(COPYABLE_SELECTOR);
  if (!copyableElement) return;
  copyElementValue(copyableElement);
  // Touch devices keep the tapped element focused (:focus-visible), which
  // would leave the copy hint visible after the tap - blur it so it fades.
  copyableElement.blur();
}

function handleBrandSwatchKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target as HTMLElement;
  if (!target.matches(COPYABLE_SELECTOR)) return;
  event.preventDefault();
  copyElementValue(target);
}

function initBrandIdentityCopy(): void {
  if (brandCopyBound) return;
  brandCopyBound = true;
  document.addEventListener('click', handleBrandSwatchClick);
  document.addEventListener('keydown', handleBrandSwatchKeydown);
}

// Renders nothing; once the layout is mounted (after hydration in production)
// it restores the reader's open reference sidebar sections. Doing it any
// earlier would make the first render differ from the server-rendered page.
const SidebarOpenSectionsRestorer = defineComponent({
  setup() {
    onMounted(() => {
      applySidebarOpenSections();
      window.setTimeout(refreshSidebarCollapseSettling, 80);
    });
    return () => null;
  }
});

export default {
  extends: DefaultTheme,

  // Adds the sticky page path above the article, inside the content column,
  // the content commit line at the bottom of docs pages and the home page, and
  // the preview-guide row directly below the home hero actions.
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-before': () => h(TreeBreadcrumb),
      'doc-after': () => h(ContentVersion),
      'home-features-after': () => h(ContentVersion),
      'home-hero-actions-after': () => h(PreviewDocsLinks),
      'layout-bottom': () => h(SidebarOpenSectionsRestorer)
    }),

  enhanceApp(ctx: EnhanceAppContext) {
    // Client-only setup: the SSR build has no window or document.
    if (typeof window === 'undefined') return;

    // Mount the landing-style animated background on the home page only.
    initHomeBackground();

    // Copy-to-clipboard for the brand identity color swatches.
    initBrandIdentityCopy();

    // Report docs search queries and result clicks to Umami.
    initSearchTracking();

    // Clicking the open section of the current page collapses it.
    initSidebarActiveSectionCollapse();

    // Keep collapsed subtrees out of layout once they finished collapsing.
    initSidebarCollapseAnimation();

    // Keep opened reference crates and sections open across navigation.
    initSidebarOpenSections(ctx);

    const progress = mountScrollProgress();

    // Single route-change hook: reset scroll, refresh the progress bar,
    // and re-attach the lightbox to newly rendered diagrams.
    ctx.router.onAfterRouteChange = (to: string) => {
      if (!to.includes('#')) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      window.setTimeout(progress.update, 40);
      window.setTimeout(enlargeMermaidDiagrams, 200);
      // The sidebar markup is re-created per page; re-mark its closed sections.
      window.setTimeout(refreshSidebarCollapseSettling, 80);
      // Remember the sections VitePress opened for this page.
      window.setTimeout(recordSidebarOpenSections, 120);
    };

    // Initial page load.
    progress.update();
    enlargeMermaidDiagrams();
  }
} satisfies Theme