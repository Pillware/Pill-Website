// REQUIREMENTS: Node.js 18+ with no external dependencies. Git is required on
//   PATH when syncing from the remote repository; a local --from directory
//   needs no git at all.
// DESCRIPTION: Mirrors the Pill-Docs content repository into this VitePress
//   source tree. Run on demand only; dev and build use whatever was last synced:
//   - reference/            -> pages/reference/  (full mirror, stale pages are removed)
//   - reference-sidebar.ts  -> .vitepress/reference-sidebar.ts
//   - guide/                -> pages/guide/      (full mirror, stale pages are removed)
//   - guide-sidebar.ts      -> .vitepress/guide-sidebar.ts
//   - content commit info   -> .vitepress/content-version.json (shown in the docs footer)
//   All targets are generated and git ignored; never edit them in this repo.
// USAGE: node scripts/mirror-pill-docs-content.mjs [--from <directory>] [--repo <url>] [--ref <git-ref>] [<directory>]
//   --from <directory>  read a local checkout instead of cloning
//   --repo <url>        content repository (default https://github.com/Pillware/Pill-Docs.git)
//   --ref <git-ref>     branch or tag to read (default main)
//   <directory>         shorthand for --from (npm drops --flag arguments on Windows)
//   Environment equivalents: PILL_DOCS_SOURCE, PILL_DOCS_REPO, PILL_DOCS_REF and
//   PILL_DOCS_TOKEN (read access to a private content repository).
// EXAMPLE USAGE:
//   npm run docs:update-reference
//   npm run docs:update-reference -- D:\Programming\Pill-Docs
//   node scripts/mirror-pill-docs-content.mjs --from D:\Programming\Pill-Docs
//   $env:PILL_DOCS_REF='v1.2.0'; npm run docs:update-reference
// --- SCRIPT ---

import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(scriptDirectory, '..')

const DEFAULT_CONTENT_REPOSITORY = 'https://github.com/Pillware/Pill-Docs.git'
const DEFAULT_CONTENT_REF = 'main'

// Shallow clone kept between runs so repeated local syncs only fetch the tip.
const CONTENT_CACHE_DIRECTORY = join(docsRoot, '.content', 'Pill-Docs')

// Each entry is mirrored: the target is emptied first, so a page deleted from
// the content repository cannot survive a sync.
const CONTENT_MIRRORS = [
    { source: 'reference', target: join(docsRoot, 'pages', 'reference') },
    { source: 'guide', target: join(docsRoot, 'pages', 'guide') },
]

// Sidebars travel with the content they describe instead of being maintained
// in this repo. A missing file is not fatal: the existing sidebar is kept.
const GENERATED_SIDEBARS = [
    {
        source: 'reference-sidebar.ts',
        target: join(docsRoot, '.vitepress', 'reference-sidebar.ts'),
    },
    {
        source: 'guide-sidebar.ts',
        target: join(docsRoot, '.vitepress', 'guide-sidebar.ts'),
    },
]

// Which content commit the synced pages came from. The docs footer displays it
// and the deploy workflow compares it with the latest content commit.
const CONTENT_VERSION_FILE = join(docsRoot, '.vitepress', 'content-version.json')

// Directory names that are never part of the published content.
const SKIPPED_DIRECTORY_NAMES = new Set(['.git', 'node_modules', '.vitepress'])

// Reads the supported command line flags into a plain options object. Missing
// flags fall back to the PILL_DOCS_* environment variables and then defaults.
// A bare argument is treated as the source directory because npm on Windows
// swallows "--from" and only forwards the value.
function parseArguments(commandLineArguments) {
    const options = {
        fromDirectory: process.env.PILL_DOCS_SOURCE || null,
        repository: process.env.PILL_DOCS_REPO || DEFAULT_CONTENT_REPOSITORY,
        ref: process.env.PILL_DOCS_REF || DEFAULT_CONTENT_REF,
    }

    for (let argumentIndex = 0; argumentIndex < commandLineArguments.length; argumentIndex += 1) {
        const flag = commandLineArguments[argumentIndex]
        const flagValue = commandLineArguments[argumentIndex + 1]

        if (flag === '--from') {
            options.fromDirectory = requireFlagValue(flag, flagValue)
            argumentIndex += 1
        } else if (flag === '--repo') {
            options.repository = requireFlagValue(flag, flagValue)
            argumentIndex += 1
        } else if (flag === '--ref') {
            options.ref = requireFlagValue(flag, flagValue)
            argumentIndex += 1
        } else if (!flag.startsWith('--') && !options.fromDirectory) {
            options.fromDirectory = flag
        } else {
            throw new Error(`Unknown argument "${flag}". Supported flags are --from, --repo and --ref, plus one bare source directory.`)
        }
    }

    return options
}

// Guards flags that were given without their value, which otherwise turns into
// an undefined path and a confusing downstream error.
function requireFlagValue(flag, flagValue) {
    if (!flagValue || flagValue.startsWith('--')) {
        throw new Error(`Flag "${flag}" needs a value.`)
    }
    return flagValue
}

// Runs one git command and fails loudly with the command that broke, so CI logs
// pinpoint the failing step instead of showing a bare exit code.
function runGit(gitArguments, workingDirectory) {
    const result = spawnSync('git', gitArguments, { cwd: workingDirectory, stdio: 'inherit' })
    if (result.error) {
        throw new Error(`Could not run git (${result.error.message}). Is git installed and on PATH?`)
    }
    if (result.status !== 0) {
        throw new Error(`git ${gitArguments.join(' ')} failed with exit code ${result.status}.`)
    }
}

// Runs one read-only git command and returns its trimmed output, or null when
// the directory is not a git checkout (a plain local --from folder).
function readGit(gitArguments, workingDirectory) {
    const result = spawnSync('git', gitArguments, { cwd: workingDirectory, encoding: 'utf8' })
    if (result.error || result.status !== 0) return null
    return result.stdout.trim() || null
}

// Git authentication header for private content repositories. The token stays
// out of the command line (and therefore out of logs) by travelling in a config
// override instead of inside the clone URL.
function buildGitAuthenticationArguments() {
    const token = process.env.PILL_DOCS_TOKEN
    if (!token) return []

    const credentials = Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64')
    return ['-c', `http.extraheader=Authorization: Basic ${credentials}`]
}

// Clones the content repository on first use and refreshes the cached clone on
// later runs. Only the requested branch tip is downloaded: the reference has
// thousands of files and its history is irrelevant to a build.
function cloneOrUpdateContentRepository(options) {
    console.log(`Reading content repository ${options.repository} (${options.ref})`)

    if (existsSync(join(CONTENT_CACHE_DIRECTORY, '.git'))) {
        runGit(['fetch', '--depth', '1', 'origin', options.ref], CONTENT_CACHE_DIRECTORY)
        runGit(['reset', '--hard', 'FETCH_HEAD'], CONTENT_CACHE_DIRECTORY)
        runGit(['clean', '-fdx'], CONTENT_CACHE_DIRECTORY)
        return CONTENT_CACHE_DIRECTORY
    }

    rmSync(CONTENT_CACHE_DIRECTORY, { recursive: true, force: true })
    mkdirSync(dirname(CONTENT_CACHE_DIRECTORY), { recursive: true })
    runGit(
        [
            ...buildGitAuthenticationArguments(),
            'clone',
            '--depth',
            '1',
            '--single-branch',
            '--branch',
            options.ref,
            options.repository,
            CONTENT_CACHE_DIRECTORY,
        ],
        dirname(CONTENT_CACHE_DIRECTORY)
    )
    return CONTENT_CACHE_DIRECTORY
}

// Resolves the directory the content is read from: an explicit local checkout
// when one is configured, otherwise the remote clone.
function resolveContentDirectory(options) {
    if (options.fromDirectory) {
        const localDirectory = resolve(options.fromDirectory)
        console.log(`Reading local content directory ${localDirectory}`)
        return localDirectory
    }
    return cloneOrUpdateContentRepository(options)
}

// Fails before any copying when the source does not look like the Pill-Docs
// layout, which otherwise surfaces as a confusing missing-page build error.
function verifyContentLayout(contentDirectory) {
    if (!existsSync(contentDirectory)) {
        throw new Error(`Content directory does not exist: ${contentDirectory}`)
    }
    for (const mirror of CONTENT_MIRRORS) {
        const sourceDirectory = join(contentDirectory, mirror.source)
        if (!existsSync(sourceDirectory)) {
            throw new Error(`Missing "${mirror.source}/" inside ${contentDirectory}. Point --from at a Pill-Docs checkout or a content repository URL.`)
        }
    }
    if (!existsSync(join(contentDirectory, 'reference', 'index.md'))) {
        throw new Error(`Missing "reference/index.md" inside ${contentDirectory}. The reference landing page is required for the sidebar and llms.txt output.`)
    }
}

// Recursively copies one directory tree and returns the number of files copied.
// Binary assets (fonts, images) are copied byte for byte, so no encoding is
// ever applied to content authored elsewhere.
function copyDirectoryTree(sourceDirectory, targetDirectory, copiedFiles) {
    mkdirSync(targetDirectory, { recursive: true })
    for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
        if (entry.isDirectory() && SKIPPED_DIRECTORY_NAMES.has(entry.name)) continue

        const sourceEntryPath = join(sourceDirectory, entry.name)
        const targetEntryPath = join(targetDirectory, entry.name)
        if (entry.isDirectory()) {
            copyDirectoryTree(sourceEntryPath, targetEntryPath, copiedFiles)
        } else if (entry.isFile()) {
            copyFileSync(sourceEntryPath, targetEntryPath)
            copiedFiles.total += 1
            if (entry.name.endsWith('.md')) copiedFiles.markdown += 1
        }
    }
    return copiedFiles
}

// Copies the generated sidebars. Each is optional in the source: an older
// checkout without one keeps the sidebar this repo already has.
function copyGeneratedSidebars(contentDirectory) {
    for (const generatedSidebar of GENERATED_SIDEBARS) {
        const sourceFile = join(contentDirectory, generatedSidebar.source)
        if (!existsSync(sourceFile)) {
            console.warn(`Warning: ${generatedSidebar.source} is missing from the content repository, keeping the existing sidebar.`)
            continue
        }
        mkdirSync(dirname(generatedSidebar.target), { recursive: true })
        copyFileSync(sourceFile, generatedSidebar.target)
        console.log(`  ${generatedSidebar.source} -> ${relative(docsRoot, generatedSidebar.target)}`)
    }
}

// Mirrors every configured content entry, replacing its target directory so the
// website always shows exactly what the content repository holds.
function mirrorContent(contentDirectory) {
    let totalMarkdownFiles = 0

    for (const mirror of CONTENT_MIRRORS) {
        const sourceDirectory = join(contentDirectory, mirror.source)
        rmSync(mirror.target, { recursive: true, force: true })

        const copiedFiles = copyDirectoryTree(sourceDirectory, mirror.target, { total: 0, markdown: 0 })
        totalMarkdownFiles += copiedFiles.markdown
        console.log(
            `  ${mirror.source}/ -> ${relative(docsRoot, mirror.target)} ` +
            `(${copiedFiles.markdown} markdown files, ${copiedFiles.total} files)`
        )
    }

    copyGeneratedSidebars(contentDirectory)
    return totalMarkdownFiles
}

// Records the commit the content was read from. A local folder that is not a
// git checkout still gets a file, with null commit fields, so the footer can
// say the version is unknown instead of showing a stale one.
function writeContentVersion(contentDirectory, options) {
    const contentVersion = {
        repository: options.fromDirectory ? (readGit(['remote', 'get-url', 'origin'], contentDirectory) || options.repository) : options.repository,
        ref: options.fromDirectory ? readGit(['rev-parse', '--abbrev-ref', 'HEAD'], contentDirectory) : options.ref,
        commit: readGit(['rev-parse', 'HEAD'], contentDirectory),
        commitDate: readGit(['log', '-1', '--format=%cI'], contentDirectory),
        syncedAt: new Date().toISOString(),
    }
    mkdirSync(dirname(CONTENT_VERSION_FILE), { recursive: true })
    writeFileSync(CONTENT_VERSION_FILE, JSON.stringify(contentVersion, null, 2) + '\n')
    console.log(`  content commit ${contentVersion.commit || 'unknown'} -> ${relative(docsRoot, CONTENT_VERSION_FILE)}`)
}

// Entry point: resolve the source, validate it, then overwrite the generated
// parts of the VitePress tree.
function main() {
    const startedAt = Date.now()
    const options = parseArguments(process.argv.slice(2))

    const contentDirectory = resolveContentDirectory(options)
    verifyContentLayout(contentDirectory)

    console.log('Syncing content:')
    const markdownFileCount = mirrorContent(contentDirectory)
    writeContentVersion(contentDirectory, options)

    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1)
    console.log(`Done: ${markdownFileCount} markdown files synced in ${elapsedSeconds}s.`)
}

try {
    main()
} catch (error) {
    console.error(`Content sync failed: ${error.message}`)
    process.exit(1)
}
