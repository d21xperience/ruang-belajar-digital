// src/composables/useRichText.js
// =============================================================
// Parser mini-markdown + KaTeX untuk konten materi.
//
// Sintaks yang didukung:
//   **bold**       → <strong>
//   *italic*       → <em>
//   __underline__  → <u>
//   `code`         → <code>
//   ~~strike~~     → <s>
//   $rumus$        → KaTeX inline
//   $$rumus$$      → KaTeX block
//   [teks](url)    → <a>
// =============================================================

import { escapeHtml } from '../utils/htmlEscape'

// Cache untuk KaTeX agar tidak load berulang
let katexModulePromise = null
async function loadKatex() {
  if (!katexModulePromise) {
    katexModulePromise = import('katex').then((m) => m.default || m)
  }
  return katexModulePromise
}

/**
 * Render KaTeX pada elemen DOM yang sudah ada (post-mount).
 * Lebih efisien: HTML plain dulu, lalu KaTeX render di DOM.
 */
export async function renderKatexInElement(el) {
  if (!el) return

  const katex = await loadKatex()

  // Inline: $...$ (tapi bukan $$...$$)
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let node
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node)
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue
    if (!text.includes('$')) continue

    const fragment = document.createDocumentFragment()
    // Regex: $$block$$ atau $inline$
    const regex = /\$\$([^$]+?)\$\$|\$([^$\n]+?)\$/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Teks sebelum match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
      }

      const isBlock = !!match[1]
      const formula = (match[1] || match[2]).trim()

      const span = document.createElement(isBlock ? 'div' : 'span')
      span.className = isBlock ? 'katex-block' : 'katex-inline'
      try {
        katex.render(formula, span, {
          throwOnError: false,
          displayMode: isBlock,
          errorColor: '#A6403F',
          strict: false,
        })
      } catch (e) {
        console.log(e)
        span.textContent = isBlock ? `$$${formula}$$` : `$${formula}$`
        span.classList.add('katex-error')
      }
      fragment.appendChild(span)

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    if (fragment.childNodes.length) {
      textNode.parentNode.replaceChild(fragment, textNode)
    }
  }
}

/**
 * Konversi mini-markdown → HTML string.
 * AMAN: semua input di-escape dulu sebelum di-parse.
 * KaTeX tidak disini — biarkan renderKatexInElement() handle setelah DOM ready.
 */
export function markdownToHtml(input) {
  if (!input) return ''
  let html = escapeHtml(String(input))

  // ═══ Escape $$...$$ dan $...$ agar tidak rusak oleh parser markdown ═══
  const mathPlaceholders = []
  html = html.replace(/\$\$([^$]+?)\$\$|\$([^$\n]+?)\$/g, (match) => {
    const key = `%%MATH${mathPlaceholders.length}%%`
    mathPlaceholders.push(match)
    return key
  })

  // ═══ Bold (**...**) — harus dicek sebelum italic ═══
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')

  // ═══ Italic (*...*) — hindari match bold sisa ═══
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')

  // ═══ Underline (__...__) ═══
  html = html.replace(/__([^_\n]+?)__/g, '<u>$1</u>')

  // ═══ Strikethrough (~~...~~) ═══
  html = html.replace(/~~([^~\n]+?)~~/g, '<s>$1</s>')

  // ═══ Inline code (`...`) ═══
  html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>')

  // ═══ Link ([teks](url)) ═══
  html = html.replace(
    /\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  // ═══ Restore placeholder matematika ═══
  mathPlaceholders.forEach((original, i) => {
    html = html.replace(`%%MATH${i}%%`, original)
  })

  return html
}

/**
 * Cek apakah string mengandung markdown atau KaTeX.
 */
export function hasRichContent(input) {
  if (!input) return false
  return /\*\*|__|~~|`|\$|\[.*?\]\(.*?\)/.test(String(input))
}

export default { renderKatexInElement, markdownToHtml, hasRichContent }
