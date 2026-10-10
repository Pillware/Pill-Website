// Docs search analytics: report what visitors search for so the team sees
// the demand behind the docs (and which queries come up empty).
//
// VitePress renders its local search as a modal that mounts and unmounts, so
// the listeners live on document and survive every open/close and every SPA
// route change without re-binding. Queries are captured when the visitor acts
// on them (Enter or clicking a result) rather than on every keystroke, so the
// dashboard shows intended searches instead of typing noise.

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

let searchTrackingBound = false;
let lastReportedQuery = '';

/** Report one search query, ignoring empty values and exact repeats. */
function reportSearchQuery(value: string | null | undefined): void {
  const query = (value || '').trim().slice(0, 200);
  if (!query || query === lastReportedQuery) return;
  lastReportedQuery = query;
  window.umami?.track('docs-search', { query });
}

/** Enter inside the search box = the visitor is submitting this query. */
function handleSearchKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLInputElement | null;
  if (event.key !== 'Enter' || target?.id !== 'localsearch-input') return;
  reportSearchQuery(target.value);
}

/** Clicking a result = the visitor found what they were typing for. */
function handleSearchResultClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('#localsearch-list a.result')) return;
  const input = document.getElementById('localsearch-input') as HTMLInputElement | null;
  reportSearchQuery(input?.value);
}

/** Attach the delegated search listeners; safe to call more than once. */
export function initSearchTracking(): void {
  if (typeof document === 'undefined' || searchTrackingBound) return;
  searchTrackingBound = true;
  document.addEventListener('keydown', handleSearchKeydown, true);
  document.addEventListener('click', handleSearchResultClick, true);
}
