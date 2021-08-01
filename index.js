import rehypeMinifyWhitespace from 'rehype-minify-whitespace'
import {visitParents, SKIP} from 'unist-util-visit-parents'
import {embedded} from 'hast-util-embedded'
import {phrasing} from 'hast-util-phrasing'
import {whitespace} from 'hast-util-whitespace'
import {isElement} from 'hast-util-is-element'
import {whitespaceSensitiveTagNames} from 'html-whitespace-sensitive-tag-names'
import repeat from 'repeat-string'

const minify = rehypeMinifyWhitespace({newlines: true})

export default function rehypeFormat(options) {
  const settings = options || {}
  let indent = settings.indent || 2
  let indentInitial = settings.indentInitial

  if (typeof indent === 'number') {
    indent = repeat(' ', indent)
  }

  // Default to indenting the initial level.
  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true
  }

  return transform

  function transform(tree) {
    let head

    minify(tree)

    visitParents(tree, visitor)

    function visitor(node, parents) {
      const children = node.children || []
      let level = parents.length
      let index = -1

      if (isElement(node, 'head')) {
        head = true
      }

      if (head && isElement(node, 'body')) {
        head = null
      }

      if (isElement(node, whitespaceSensitiveTagNames)) {
        return SKIP
      }

      // Don’t indent content of whitespace-sensitive nodes / inlines.
      if (children.length === 0 || !padding(node, head)) {
        return
      }

      if (!indentInitial) {
        level--
      }

      let eol

      // Indent newlines in `text`.
      while (++index < children.length) {
        const child = children[index]

        if (child.type === 'text' || child.type === 'comment') {
          if (child.value.includes('\n')) {
            eol = true
          }

          child.value = child.value.replace(
            / *\n/g,
            '$&' + repeat(indent, level)
          )
        }
      }

      const result = []
      let previous
      index = -1

      while (++index < children.length) {
        const child = children[index]

        if (padding(child, head) || (eol && !index)) {
          addBreak(result, level, child)
          eol = true
        }

        previous = child
        result.push(child)
      }

      if (eol || padding(previous, head)) {
        // Ignore trailing whitespace (if that already existed), as we’ll add
        // properly indented whitespace.
        if (whitespace(previous)) {
          result.pop()
          previous = result[result.length - 1]
        }

        addBreak(result, level - 1)
      }

      node.children = result
    }
  }

  function blank(node) {
    return (
      node &&
      node.type === 'element' &&
      settings.blanks &&
      settings.blanks.length > 0 &&
      settings.blanks.includes(node.tagName)
    )
  }

  function addBreak(list, level, next) {
    const tail = list[list.length - 1]
    const previous = whitespace(tail) ? list[list.length - 2] : tail
    const replace =
      (blank(previous) && blank(next) ? '\n\n' : '\n') + repeat(indent, level)

    if (tail && tail.type === 'text') {
      tail.value = whitespace(tail) ? replace : tail.value + replace
    } else {
      list.push({type: 'text', value: replace})
    }
  }
}

function padding(node, head) {
  return (
    node.type === 'root' ||
    (node.type === 'element'
      ? head || isElement(node, 'script') || embedded(node) || !phrasing(node)
      : false)
  )
}
