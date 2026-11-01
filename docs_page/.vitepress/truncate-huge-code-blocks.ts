import type MarkdownIt from 'markdown-it'

// rustdoc emits constants that hold binary assets (fonts, images) as one
// multi-megabyte byte-string literal. Highlighting such a literal expands it
// into tens of megabytes of HTML: it dominates the build, the page payload and
// the local search index, while the value itself is unreadable anyway. Code
// blocks above the limit keep a readable head and tail plus a note.

// Applied per code block, not per line: real API examples are far below this.
const MAXIMUM_CODE_BLOCK_CHARACTERS = 4000

// Characters of the original value kept before and after the omission marker.
const HEAD_CHARACTERS = 2400
const TAIL_CHARACTERS = 800

// Builds the replacement content: head, a marker naming how much was dropped,
// then the tail. Everything stays inside the fence, so the page keeps its
// language highlighting and nothing outside the block changes.
function truncateContent(content: string): string {
    const omittedCharacters = content.length - HEAD_CHARACTERS - TAIL_CHARACTERS
    const marker = `\n// [Pill docs] ${omittedCharacters.toLocaleString('en-US')} characters omitted: the value is a generated binary blob.\n`
    return `${content.slice(0, HEAD_CHARACTERS)}${marker}${content.slice(-TAIL_CHARACTERS)}`
}

// Registers a markdown-it core rule that rewrites oversized fences before the
// highlighter and the Vue renderer ever see them.
export function truncateHugeCodeBlocks(markdown: MarkdownIt): void {
    markdown.core.ruler.push('pill-truncate-huge-code-blocks', (state) => {
        for (const token of state.tokens) {
            if (token.type !== 'fence') continue
            if (token.content.length <= MAXIMUM_CODE_BLOCK_CHARACTERS) continue
            token.content = truncateContent(token.content)
        }
    })
}
