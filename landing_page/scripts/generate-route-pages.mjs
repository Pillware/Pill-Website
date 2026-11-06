// REQUIREMENTS: Node.js 18+. Run after `vite build`; reads dist/index.html.
// DESCRIPTION: Writes one static HTML file per client-side route (for example
//   dist/demos/index.html) carrying that route's title, description, Open
//   Graph tags and canonical URL. Crawlers then get route-specific metadata
//   from the first response instead of the home page head that the SPA shell
//   would otherwise reuse for every path.
// USAGE: node scripts/generate-route-pages.mjs
// EXAMPLE USAGE: npm run build (vite build already ran)
// --- SCRIPT ---

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_METADATA, buildCanonicalUrl } from '../src/lib/siteMetadata.js';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const distDirectory = join(scriptDirectory, '..', 'dist');
const templateHtml = readFileSync(join(distDirectory, 'index.html'), 'utf8');

// Escapes a value for use inside an HTML attribute.
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

// Applies one required replacement. A missing anchor fails the build instead of
// silently shipping the home page head on a subpage.
function replaceRequired(html, pattern, replacement, description) {
    if (!pattern.test(html)) {
        throw new Error(`Missing ${description} in dist/index.html; update index.html and this script together.`);
    }
    return html.replace(pattern, replacement);
}

// Builds the HTML for one route from the home page template.
function buildRouteHtml(metadata) {
    const canonicalUrl = buildCanonicalUrl(metadata);
    let html = templateHtml;

    html = replaceRequired(
        html,
        /<title>[^<]*<\/title>/,
        `<title>${escapeHtml(metadata.title)}</title>`,
        'a <title> tag',
    );
    html = replaceRequired(
        html,
        /<meta name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
        'the description meta tag',
    );
    html = replaceRequired(
        html,
        /<meta property="og:title"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
        'the og:title meta tag',
    );
    html = replaceRequired(
        html,
        /<meta property="og:description"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
        'the og:description meta tag',
    );
    html = replaceRequired(
        html,
        /<meta property="og:url"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
        'the og:url meta tag',
    );
    html = replaceRequired(
        html,
        /<link rel="canonical"\s+href="[^"]*"\s*\/?>/,
        `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
        'the canonical link',
    );
    // WebSite structured data describes the home page only, so subpages drop the
    // block together with its explanatory comment.
    html = replaceRequired(
        html,
        /<!-- website-structured-data:[\s\S]*?-->\s*<script type="application\/ld\+json" id="website-structured-data">[\s\S]*?<\/script>\s*/,
        '',
        'the WebSite JSON-LD block',
    );

    return html;
}

const generatedRoutes = Object.entries(ROUTE_METADATA).filter(([route]) => route !== '/');

for (const [route, metadata] of generatedRoutes) {
    const outputPath = join(distDirectory, ...route.split('/').filter(Boolean), 'index.html');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, buildRouteHtml(metadata), 'utf8');
    console.log(`Generated ${relative(distDirectory, outputPath)} for ${route}`);
}
