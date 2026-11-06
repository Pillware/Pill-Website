// Single source of truth for the site name, canonical origin and per-route
// metadata. Used by the React app (client-side navigation) and by
// scripts/generate-route-pages.mjs (static HTML for crawlers), so both agree.
//
// Canonical origin: pillengine.org. robots.txt, the press kit and the deploy
// checks name that host, while pill.rocks is an alias of the same webroot.
export const SITE_ORIGIN = 'https://pillengine.org';
export const SITE_NAME = 'Pill Engine';

// Keys are client-side routes without a trailing slash. Keep in sync with the
// <Route> list in App.jsx and with the pages that exist under src/pages.
export const ROUTE_METADATA = {
    '/': {
        title: 'Pill Engine - Modern, free and blazingly fast game engine',
        description:
            'Pill Engine is a modern, free and blazingly fast game engine built for developers who refuse to compromise: raw performance and creative freedom for even the wildest ideas.',
        canonical: '/',
    },
    '/demos': {
        title: 'Demos - Pill Engine',
        description:
            'Gameplay videos and playable browser demos built with Pill Engine, including the Wavey water simulation.',
        canonical: '/demos',
    },
    '/demos/wavey': {
        title: 'Wavey demo - Pill Engine',
        description:
            'Play Wavey in the browser: buoyant ships, Gerstner-style waves and a particle wake running on Pill Engine. Requires WebGPU.',
        canonical: '/demos/wavey',
    },
};

// Absolute canonical URL for one route entry; the home page keeps its slash.
export function buildCanonicalUrl(metadataEntry) {
    return `${SITE_ORIGIN}${metadataEntry.canonical}`;
}
