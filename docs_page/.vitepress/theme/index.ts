// Docs framework: https://vitepress.dev/reference/site-config

import DefaultTheme from 'vitepress/theme'
import type { Theme, EnhanceAppContext } from 'vitepress'
import { enlargeMermaidDiagrams } from './mermaid'
import { initSearchTracking } from './search-tracking'
import { initHomeBackground } from './hero-dither'
import '../../../pill_style.css'
import './styles.css'

// Scroll progress bar showing how deep the user has scrolled on the page.
// Mounts once and returns an update callback used after route changes.
function mountScrollProgress(): { update: () => void } {
  if (document.getElementById('scroll-progress')) {
    // Hot reload can re-run enhanceApp; keep the existing bar.
    return { update: () => {} };
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

// Floating "work in progress" warning banner, styled like the landing page
// navbar (dark glass) with a yellow warning accent. Mounted once and shown
// on every docs page.
function mountWorkInProgressBanner(): void {
  if (document.getElementById('work-in-progress-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'work-in-progress-banner';
  banner.className = 'work-in-progress-banner';
  banner.setAttribute('role', 'status');

  const label = document.createElement('span');
  label.className = 'work-in-progress-label';
  label.textContent =
    'Documentation is heavily work in progress! Don\'t use it just yet!';

  banner.appendChild(label);
  document.body.appendChild(banner);
}

// ── Brand identity color-swatch copy-to-clipboard ──
// Swatches on the brand identity page copy their hex on click/Enter/Space and
// briefly show a "Copied" toast. Uses document-level delegation so it works
// on any route (and after SPA navigation) without re-binding.
let brandCopyBound = false;
let copiedToastTimer: ReturnType<typeof setTimeout> | null = null;
let copiedToastElement: HTMLElement | null = null;

function showCopiedToast(): void {
  if (!copiedToastElement) {
    copiedToastElement = document.createElement('div');
    copiedToastElement.className = 'brand-copied-toast';
    copiedToastElement.textContent = 'HEX copied to clipboard';
    document.body.appendChild(copiedToastElement);
  }
  copiedToastElement.classList.add('brand-copied-toast-visible');
  if (copiedToastTimer) clearTimeout(copiedToastTimer);
  copiedToastTimer = setTimeout(() => {
    copiedToastElement?.classList.remove('brand-copied-toast-visible');
  }, 1000);
}

function copySwatchHex(hex: string): void {
  if (!hex) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(hex).catch(() => {});
  }
  showCopiedToast();
}

function handleBrandSwatchClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const swatch = target.closest<HTMLElement>('.color-swatch');
  if (!swatch) return;
  copySwatchHex(swatch.getAttribute('data-color') || '');
  // Touch devices keep the tapped element focused (:focus-visible), which
  // would leave the copy hint visible after the tap - blur it so it fades.
  swatch.blur();
}

function handleBrandSwatchKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target as HTMLElement;
  if (!target.classList.contains('color-swatch')) return;
  event.preventDefault();
  copySwatchHex(target.getAttribute('data-color') || '');
}

function initBrandIdentityCopy(): void {
  if (brandCopyBound) return;
  brandCopyBound = true;
  document.addEventListener('click', handleBrandSwatchClick);
  document.addEventListener('keydown', handleBrandSwatchKeydown);
}

export default {
  extends: DefaultTheme,
  enhanceApp(ctx: EnhanceAppContext) {
    // Client-only setup: the SSR build has no window or document.
    if (typeof window === 'undefined') return;

    // Mount the landing-style animated background on the home page only.
    initHomeBackground();

    // Show the floating "work in progress" warning on every docs page.
    mountWorkInProgressBanner();

    // Copy-to-clipboard for the brand identity color swatches.
    initBrandIdentityCopy();

    // Report docs search queries and result clicks to Umami.
    initSearchTracking();

    const progress = mountScrollProgress();

    // Single route-change hook: reset scroll, refresh the progress bar,
    // and re-attach the lightbox to newly rendered diagrams.
    ctx.router.onAfterRouteChange = (to: string) => {
      if (!to.includes('#')) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      window.setTimeout(progress.update, 40);
      window.setTimeout(enlargeMermaidDiagrams, 200);
    };

    // Initial page load.
    progress.update();
    enlargeMermaidDiagrams();
  }
} satisfies Theme