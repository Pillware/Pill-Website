import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// pill.rocks → landing page
const landingBuildDir = path.join(__dirname, 'landing_page', 'dist');
const distDir = path.join(__dirname, 'dist');

// docs.pill.rocks → VitePress documentation (guide + API reference)
const docsBuildDir = path.join(__dirname, 'docs_page', '.vitepress', 'dist');
const distDocsDir = path.join(__dirname, 'dist-docs');

// Optional target argument ("landing" or "docs") assembles only that site, so
// the two deploy workflows do not need each other's build output. No argument
// assembles both.
const requestedTarget = process.argv[2] || 'all';
if (!['all', 'landing', 'docs'].includes(requestedTarget)) {
    console.error(`Unknown target "${requestedTarget}". Use "landing", "docs" or no argument.`);
    process.exit(1);
}

console.log('🚀 Assembling deploy outputs...');

// Generated output - recreate it so obsolete files cannot survive between builds.
function resetDirectory(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

// Recursively copy a directory.
function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        throw new Error(`Source directory does not exist: ${src}`);
    }

    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursive(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// ── Landing page → dist/ (served at https://pill.rocks) ──
if (requestedTarget !== 'docs') {
    console.log('🌐 Assembling landing page...');
    resetDirectory(distDir);
    copyRecursive(landingBuildDir, distDir);
    console.log('✅ Landing page copied to dist/');
}

// ── Documentation → dist-docs/ (served at https://docs.pill.rocks) ──
if (requestedTarget !== 'landing') {
    console.log('📚 Assembling documentation...');
    resetDirectory(distDocsDir);
    copyRecursive(docsBuildDir, distDocsDir);
    console.log('✅ Documentation copied to dist-docs/');
}

console.log('🎉 Build complete!');
console.log('');
console.log('📁 Structure:');
console.log('  dist/          → Landing page (served at https://pill.rocks)');
console.log('  dist-docs/     → Documentation (served at https://docs.pill.rocks)');
console.log('    dist-docs/guide/      → Guide');
console.log('    dist-docs/reference/  → API reference');
console.log('');
console.log('To preview the landing page: npm run preview');
