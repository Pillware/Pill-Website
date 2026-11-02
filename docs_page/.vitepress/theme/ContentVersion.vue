<script setup lang="ts">
// REQUIREMENTS: Vue SFC rendered from the doc-after and home-features-after
//   slots of the default theme layout (registered in theme/index.ts). Reads
//   themeConfig.contentVersion, written by scripts/sync-content.mjs.
// DESCRIPTION: Shows which Pill-Docs commit (short hash and date) the
//   displayed docs were built from, followed by whether that commit is still
//   the latest one on the content branch. The latest commit is asked from the
//   public GitHub API in the browser, so a stale deploy shows up immediately.
// USAGE: registered as a layout slot; no props.

import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

interface ContentVersion {
  repository: string | null
  ref: string | null
  commit: string | null
  commitDate: string | null
}

type FreshnessStatus = 'checking' | 'up-to-date' | 'outdated' | 'unknown'

// The answer is shared by every page of one visit and kept for a few minutes
// across reloads: unauthenticated GitHub API calls are limited per visitor IP.
const LATEST_COMMIT_CACHE_MILLISECONDS = 10 * 60 * 1000
let latestCommitRequest: Promise<string | null> | null = null

const { theme } = useData()
const contentVersion = computed<ContentVersion | null>(() => theme.value.contentVersion ?? null)
const freshnessStatus = ref<FreshnessStatus>('checking')

// "owner/name" of a GitHub repository URL (https or ssh form), null otherwise.
const githubRepository = computed(() => {
  const match = contentVersion.value?.repository?.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
  return match ? `${match[1]}/${match[2]}` : null
})

const shortCommit = computed(() => contentVersion.value?.commit?.slice(0, 7) ?? null)

const commitLink = computed(() =>
  githubRepository.value && contentVersion.value?.commit
    ? `https://github.com/${githubRepository.value}/commit/${contentVersion.value.commit}`
    : null
)

// Commit date, e.g. "Oct 26, 2026". Fixed locale and time zone so the
// prerendered HTML and the hydrated page produce the same text.
const formattedCommitDate = computed(() => {
  const commitDate = contentVersion.value?.commitDate
  if (!commitDate) return null
  return new Date(commitDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
})

const freshnessLabel = computed(() => ({
  'checking': 'checking for updates',
  'up-to-date': 'up to date',
  'outdated': 'outdated',
  'unknown': 'update status unknown',
})[freshnessStatus.value])

// Reads the tip commit of the content branch, from sessionStorage when it was
// fetched recently. Any failure (rate limit, empty repository, offline) yields
// null so the footer falls back to "unknown" instead of guessing.
async function fetchLatestCommit(repository: string, branch: string): Promise<string | null> {
  const cacheKey = `pill-docs-latest-commit:${repository}:${branch}`
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
    if (cached && Date.now() - cached.fetchedAt < LATEST_COMMIT_CACHE_MILLISECONDS) return cached.commit
  } catch { }

  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(branch)}`, {
      headers: { Accept: 'application/vnd.github.sha' },
    })
    if (!response.ok) return null
    const commit = (await response.text()).trim()
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ commit, fetchedAt: Date.now() }))
    } catch { }
    return commit
  } catch {
    return null
  }
}

// Compares the built commit with the branch tip once the page is in the
// browser (the SSR build has no network access to rely on).
onMounted(async () => {
  const builtCommit = contentVersion.value?.commit
  if (!builtCommit || !githubRepository.value) {
    freshnessStatus.value = 'unknown'
    return
  }

  latestCommitRequest ??= fetchLatestCommit(githubRepository.value, contentVersion.value?.ref || 'main')
  const latestCommit = await latestCommitRequest
  if (!latestCommit) {
    freshnessStatus.value = 'unknown'
  } else {
    freshnessStatus.value = latestCommit === builtCommit ? 'up-to-date' : 'outdated'
  }
})
</script>

<template>
  <p class="content-version">
    <template v-if="shortCommit">
      Docs built from
      <a v-if="commitLink" :href="commitLink" target="_blank" rel="noopener" class="content-version-commit">{{ shortCommit }}</a>
      <code v-else class="content-version-commit">{{ shortCommit }}</code>
      <template v-if="formattedCommitDate"> · {{ formattedCommitDate }}</template>
      <span class="content-version-status" :class="`content-version-status-${freshnessStatus}`">({{ freshnessLabel }})</span>
    </template>
    <template v-else>Docs content version unknown</template>
  </p>
</template>
