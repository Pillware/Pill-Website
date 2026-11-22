import type MarkdownIt from 'markdown-it'

// The guide documents one step per shell or language as a run of fences that
// sit directly after each other: the same commands for PowerShell, cmd and
// bash (section 19 of the writing guidelines). VitePress renders every fence as
// its own block, so the reader gets three near-identical boxes. Its
// ::: code-group container renders the same fences as switchable tabs, but the
// guide markdown is mirrored from the Pill-Docs repository, so runs are wrapped
// here instead of relying on authors to add the container markers.
//
// Only source-contiguous fences are grouped: a blank line between two blocks
// separates examples (a snippet and its output, say), while a run of
// alternatives is written without one. Shell alternatives are also grouped
// across a blank line as long as every block is a shell and no language
// repeats, because some pages split their shells that way.

// Without a title VitePress labels a tab with the raw language id; map the
// languages the guide uses for shell alternatives to readable names.
const TAB_LABELS: Record<string, string> = {
    powershell: 'PowerShell',
    pwsh: 'PowerShell',
    ps1: 'PowerShell',
    cmd: 'Command Prompt',
    bat: 'Command Prompt',
    batch: 'Command Prompt',
    bash: 'Bash',
    sh: 'Bash',
    shell: 'Bash',
    zsh: 'Bash'
}

const SHELL_LANGUAGES = new Set(Object.keys(TAB_LABELS))

function languageOf(info: string): string {
    return info
        .trim()
        .split(/\s+/)[0]
        .replace(/[{[].*$/, '')
        .toLowerCase()
}

function isFence(token: { type: string; tag: string }): boolean {
    return token.type === 'fence' && token.tag === 'code'
}

// A fence token's map is [first line of the opening fence, line after the
// closing fence] in the source, so continuous maps mean no blank line in
// between.
function followsDirectly(previous: { map: number[] | null }, next: { map: number[] | null }): boolean {
    return previous.map !== null && next.map !== null && next.map[0] === previous.map[1]
}

function languagesOf(fences: { info: string }[]): string[] {
    return fences.map((fence) => languageOf(fence.info))
}

function hasAlternatives(fences: { info: string }[]): boolean {
    return new Set(languagesOf(fences)).size >= 2
}

// A fence with an explicit [Title] keeps it; otherwise the mapped name is
// appended in the syntax the code-group container reads for tab labels.
function addTabLabel(fence: { info: string }): void {
    const label = TAB_LABELS[languageOf(fence.info)]
    if (!label || /\[.*\]/.test(fence.info)) return
    fence.info = `${fence.info.trim()} [${label}]`
}

// Builds the open/close tokens the code-group container would have produced,
// so the container's own renderer builds the tabs and blocks.
function createContainerToken(type: string, nesting: 1 | -1, level: number) {
    return {
        type,
        tag: 'div',
        nesting,
        level,
        attrs: [],
        map: null,
        children: null,
        markup: '::: code-group',
        info: 'code-group',
        meta: null,
        block: true,
        hidden: false
    }
}

// Registers a markdown-it core rule that renders runs of fences for the same
// step as one code group. Runs in a single language stay apart: consecutive
// snippets of one language are separate examples, not alternatives.
export function groupConsecutiveCodeBlocks(markdown: MarkdownIt): void {
    markdown.core.ruler.push('pill-group-consecutive-code-blocks', (state) => {
        const source = state.tokens
        const grouped: typeof state.tokens = []
        let index = 0

        while (index < source.length) {
            const start = source[index]
            if (!isFence(start)) {
                grouped.push(start)
                index += 1
                continue
            }

            let runEnd = index + 1
            while (runEnd < source.length && isFence(source[runEnd]) && source[runEnd].level === start.level) {
                runEnd += 1
            }

            let segmentStart = index
            while (segmentStart < runEnd) {
                let segmentEnd = segmentStart + 1
                while (segmentEnd < runEnd && followsDirectly(source[segmentEnd - 1], source[segmentEnd])) {
                    segmentEnd += 1
                }

                // Extend across a blank line while the blocks so far and the
                // next one are shell alternatives that name no language twice.
                while (segmentEnd < runEnd) {
                    const languages = languagesOf(source.slice(segmentStart, segmentEnd))
                    const next = languageOf(source[segmentEnd].info)
                    if (!languages.every((language) => SHELL_LANGUAGES.has(language)) || languages.includes(next)) break
                    segmentEnd += 1
                }

                const segment = source.slice(segmentStart, segmentEnd)
                if (hasAlternatives(segment)) {
                    grouped.push(createContainerToken('container_code-group_open', 1, start.level))
                    for (const fence of segment) {
                        fence.level += 1
                        addTabLabel(fence)
                        grouped.push(fence)
                    }
                    grouped.push(createContainerToken('container_code-group_close', -1, start.level))
                } else {
                    grouped.push(...segment)
                }
                segmentStart = segmentEnd
            }

            index = runEnd
        }

        state.tokens = grouped
    })
}
