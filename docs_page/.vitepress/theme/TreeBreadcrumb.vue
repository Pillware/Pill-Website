<script setup lang="ts">
// REQUIREMENTS: Vue SFC rendered from the doc-before slot of the default
//   theme layout (registered in theme/index.ts).
// DESCRIPTION: Sticky path of the current page inside the sidebar tree, for
//   example "Pill Core / profiling / profiling_extras / message". Every
//   segment except the last one links to its page. The path is read from the
//   rendered sidebar: VitePress marks the current item with .is-active and
//   every ancestor with .has-active.
// USAGE: registered as the doc-before slot; no props.

import { nextTick, onMounted, ref, watch } from 'vue'
import { useData, useRouter } from 'vitepress'
import { rememberSidebarScrollTarget, scrollSidebarToRememberedTarget } from './breadcrumb-scroll'

interface TreeCrumb {
  text: string
  link: string | null
}

const { page } = useData()
const router = useRouter()
const crumbs = ref<TreeCrumb[]>([])

// Walks from the active sidebar item up through its ancestors, so a nested
// module page yields crate > module > submodule > entry.
function readCrumbsFromSidebar(): TreeCrumb[] {
  const activeItem = document.querySelector<HTMLElement>('.VPSidebar .VPSidebarItem.is-active')
  const chain: HTMLElement[] = []
  let sidebarItem: HTMLElement | null = activeItem

  while (sidebarItem) {
    chain.unshift(sidebarItem)
    sidebarItem = sidebarItem.parentElement?.closest<HTMLElement>('.VPSidebarItem') ?? null
  }

  return chain
    .map((item) => {
      const textElement = item.querySelector(':scope > .item > .link > .text, :scope > .item > .text')
      const linkElement = item.querySelector<HTMLAnchorElement>(':scope > .item > .link')

      // The kind badge is part of the sidebar label, not of the path.
      const label = textElement?.cloneNode(true) as HTMLElement | undefined
      label?.querySelector('.ref-kind')?.remove()

      return {
        text: label?.textContent?.trim() ?? '',
        link: linkElement?.getAttribute('href') ?? null
      }
    })
    .filter((crumb) => crumb.text.length > 0)
}

// Re-reads the sidebar after the new page has rendered, otherwise the
// previous page's active item would be used.
async function refreshCrumbs(): Promise<void> {
  await nextTick()
  crumbs.value = readCrumbsFromSidebar()
  // Runs after the DOM flush; reading the row position forces the layout, so
  // it is measured after the ancestors expanded.
  scrollSidebarToRememberedTarget()
}

// Keeps client-side navigation inside the SPA and remembers which sidebar
// row should end up at the top.
function goTo(link: string | null): void {
  if (!link) return
  rememberSidebarScrollTarget(link)
  router.go(link)
}

onMounted(refreshCrumbs)
watch(() => page.value.relativePath, refreshCrumbs)
</script>

<template>
  <nav v-if="crumbs.length > 1" class="tree-breadcrumb" aria-label="Page path">
    <template v-for="(crumb, index) in crumbs" :key="`${index}-${crumb.text}`">
      <span v-if="index > 0" class="tree-breadcrumb-separator" aria-hidden="true">/</span>
      <a
        v-if="crumb.link && index < crumbs.length - 1"
        class="tree-breadcrumb-link"
        :href="crumb.link"
        @click.prevent="goTo(crumb.link)"
      >{{ crumb.text }}</a>
      <span v-else class="tree-breadcrumb-current">{{ crumb.text }}</span>
    </template>
  </nav>
</template>
