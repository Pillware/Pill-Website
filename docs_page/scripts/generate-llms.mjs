// REQUIREMENTS: Node.js 18+ (no external dependencies). Run AFTER
//   `vitepress build` so the dist directory exists.
// DESCRIPTION: Generates AI/LLM-friendly artifacts for the Pill docs site:
//   - dist/markdown/**/*.md  clean Markdown mirrors of every page (frontmatter
//     stripped, VitePress containers converted to blockquotes, links rewritten
//     to point at the mirror, HTML entities decoded, fence highlight markers
//     removed)
//   - dist/llms.txt          curated llms.txt index for AI agents
//   - dist/llms-full.txt     all pages concatenated into one Markdown file
// USAGE: node scripts/generate-llms.mjs [--site-url https://docs.pill.rocks]
// EXAMPLE USAGE: node scripts/generate-llms.mjs
// --- SCRIPT ---

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(scriptDirectory, '..');
const pagesDirectory = join(docsRoot, 'pages');
const outputDirectory = join(docsRoot, '.vitepress', 'dist');
const siteUrlArgumentIndex = process.argv.indexOf('--site-url');
const siteUrl = (siteUrlArgumentIndex === -1 ? 'https://docs.pill.rocks' : process.argv[siteUrlArgumentIndex + 1]).replace(/\/$/, '');

// Collects every Markdown source file below the pages directory, skipping the
// VitePress public folder (static assets such as logos and favicons).
function collectMarkdownFiles(directory) {
    const results = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'public') continue;
            results.push(...collectMarkdownFiles(fullPath));
        } else if (entry.name.endsWith('.md')) {
            results.push(fullPath);
        }
    }
    return results;
}

// Splits a leading YAML frontmatter block off the raw Markdown source.
function splitFrontmatter(markdown) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { frontmatter: '', content: markdown };
    return { frontmatter: match[1], content: markdown.slice(match[0].length) };
}

// Decodes the HTML entities that show up inside the source Markdown so the
// mirrors read as plain text (&amp; must run first to avoid double-decoding).
function decodeEntities(text) {
    return text
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ');
}

// Converts VitePress container blocks (::: tip Title ... :::) to blockquotes.
function convertContainers(markdown) {
    return markdown.replace(/:::[ \t]*(\w+)?[ \t]*([^\n]*)\n([\s\S]*?)\n:::/g, (match, type, title, body) => {
        const label = title.trim() || type || '';
        const quoted = body
            .split('\n')
            .map((line) => (line.trim().length > 0 ? `> ${line}` : '>'))
            .join('\n');
        return label ? `> **${label}**\n>\n${quoted}` : quoted;
    });
}

// Rewrites Markdown link targets so they point at the mirror files: absolute
// site routes (/guide/setup) become /markdown/guide/setup.md, and relative
// links are resolved against the linking page inside the mirror tree.
// External URLs and bare anchors are left untouched.
function rewriteLinks(markdown, mirrorPath) {
    const currentDirectory = posix.dirname(mirrorPath);
    return markdown.replace(/\]\(([^)]+)\)/g, (match, target) => {
        if (/^(https?:|mailto:|tel:|#)/.test(target)) return match;
        const [pathPart, ...fragmentParts] = target.split('#');
        if (pathPart.length === 0) return match;
        const fragment = fragmentParts.length > 0 ? `#${fragmentParts.join('#')}` : '';
        let resolvedPath;
        if (pathPart === '/') {
            resolvedPath = 'index.md';
        } else if (pathPart.startsWith('/')) {
            resolvedPath = pathPart.replace(/^\//, '');
        } else {
            resolvedPath = posix.normalize(posix.join(currentDirectory, pathPart));
        }
        resolvedPath = resolvedPath.replace(/\.html$/, '');
        if (resolvedPath.endsWith('/')) resolvedPath += 'index.md';
        else if (!resolvedPath.endsWith('.md')) resolvedPath += '.md';
        return `](/markdown/${resolvedPath}${fragment})`;
    });
}

// Removes VitePress code-fence highlight markers (```rust{1,3} -> ```rust).
function stripFenceHighlights(markdown) {
    return markdown.replace(/^```([A-Za-z0-9]*)\{[^\n]*\}$/gm, '```$1');
}

// Picks a human-readable title: the first H1, then a frontmatter title, then
// a prettified file name as a last resort.
function pickTitle(content, frontmatter, relativePath) {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();
    const frontmatterMatch = frontmatter.match(/^title:\s*(.+)$/m);
    if (frontmatterMatch) return frontmatterMatch[1].trim().replace(/^["']|["']$/g, '');
    return posix
        .basename(relativePath, '.md')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Builds a short one-line note for the llms.txt listing: frontmatter
// description if present, otherwise the first prose paragraph, truncated.
function pickNote(content, frontmatter) {
    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
    let text = descriptionMatch ? descriptionMatch[1].trim().replace(/^["']|["']$/g, '') : '';
    if (!text) {
        const lines = content.split('\n').map((line) => line.trim());
        text = lines.find((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('-') && !line.startsWith('<')) || '';
    }
    text = decodeEntities(text).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

// Maps a source file to its public route: page.md -> /page, dir/index.md ->
// /dir/ and the root index.md -> /.
function buildRoute(relativePath) {
    const withoutExtension = relativePath.replace(/\.md$/, '');
    if (withoutExtension === 'index') return '/';
    if (withoutExtension.endsWith('/index')) return `/${withoutExtension.slice(0, -'index'.length)}`;
    return `/${withoutExtension}`;
}

const sourceFiles = collectMarkdownFiles(pagesDirectory).sort();

const pages = sourceFiles.map((filePath) => {
    const relativePath = posix.join(...filePath.slice(pagesDirectory.length + 1).split(/[\\/]/));
    const raw = readFileSync(filePath, 'utf8');
    const { frontmatter, content } = splitFrontmatter(raw);
    const mirrorPath = `markdown/${relativePath}`;
    const title = pickTitle(content, frontmatter, relativePath);
    const note = pickNote(content, frontmatter);
    const taglineMatch = frontmatter.match(/^\s*tagline:\s*(.+)$/m);
    let cleanContent = stripFenceHighlights(decodeEntities(content));
    cleanContent = rewriteLinks(cleanContent, mirrorPath);
    cleanContent = convertContainers(cleanContent).trim();
    // The docs home page is frontmatter-only (a VitePress hero layout); give
    // the mirror a minimal body built from its tagline so it is not empty.
    if (cleanContent.replace(/^#.*$/m, '').trim().length < 40 && taglineMatch) {
        cleanContent = `# ${title}\n\n${taglineMatch[1].trim()}`;
    }
    return {
        relativePath,
        mirrorPath,
        route: buildRoute(relativePath),
        title,
        note,
        content: cleanContent,
    };
});

// Guide first, then the reference, then everything else - both for the
// llms.txt listing and the llms-full.txt concatenation order.
function sectionRank(relativePath) {
    if (relativePath.startsWith('guide/')) return 0;
    if (relativePath.startsWith('reference/')) return 1;
    return 2;
}
pages.sort((a, b) => sectionRank(a.relativePath) - sectionRank(b.relativePath) || a.relativePath.localeCompare(b.relativePath));

for (const page of pages) {
    const outputPath = join(outputDirectory, ...page.mirrorPath.split('/'));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${page.content}\n`, 'utf8');
}

const guidePages = pages.filter((page) => page.relativePath.startsWith('guide/'));
const referencePages = pages.filter((page) => page.relativePath.startsWith('reference/'));

// Curated llms.txt index following the llmstxt.org convention.
const llmsIndexLines = [
    '# Pill Documentation',
    '',
    '> Guide and API reference for Pill - a modern, free and blazingly fast game engine written in Rust with an Entity Component System, hot reloading and a WebAssembly build under 0.5 MB.',
    '',
    '## Guide',
    '',
    ...guidePages.map((page) => `- [${page.title}](${siteUrl}/${page.mirrorPath})${page.note ? `: ${page.note}` : ''}`),
    '',
    '## Reference',
    '',
    ...referencePages.map((page) => `- [${page.title}](${siteUrl}/${page.mirrorPath})${page.note ? `: ${page.note}` : ''}`),
    '',
    '## Optional',
    '',
    `- [Docs home](${siteUrl}/markdown/index.md): entry page of the documentation site`,
    '- [Landing page](https://pill.rocks): project overview, demos and community links',
    '- [GitHub repository](https://github.com/Pillware/Pill): source code, examples and issues',
    '- [Discord community](https://discord.gg/VUKNQrctms)',
    `- [Full documentation in a single file](${siteUrl}/llms-full.txt): every page concatenated as Markdown`,
    '',
].join('\n');
writeFileSync(join(outputDirectory, 'llms.txt'), llmsIndexLines, 'utf8');

// llms-full.txt: every page with a source banner, separated by horizontal rules.
const llmsFullContent = pages
    .map((page) => {
        // Drop the page's own leading H1 when it repeats the banner title.
        const body = page.content.replace(/^#\s+(.+)\r?\n/, (match, heading) => (heading.trim() === page.title ? '' : match));
        return `# ${page.title}\n\n> Source: ${siteUrl}${page.route}\n\n${body}\n`;
    })
    .join('\n---\n\n');
writeFileSync(join(outputDirectory, 'llms-full.txt'), `${llmsFullContent}\n`, 'utf8');

console.log(`generate-llms: wrote ${pages.length} Markdown mirrors, llms.txt and llms-full.txt to ${outputDirectory}`);
console.log(`generate-llms: llms-full.txt size roughly ${Math.round((llmsFullContent.length / 1024))} KB`);
