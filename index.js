import rehypeMinifyWhitespace from 'rehype-minify-whitespace'
import visit from 'unist-util-visit-parents'
import embedded from 'hast-util-embedded'
import phrasing from 'hast-util-phrasing'
import whitespace from 'hast-util-whitespace'
import is from 'hast-util-is-element'
import {whitespaceSensitiveTagNames} from 'html-whitespace-sensitive-tag-names'
import repeat from 'repeat-string'

const minify = rehypeMinifyWhitespace({newlines: true})

export default function rehypeFormat(options) {
  var settings = options || {}
  var indent = settings.indent || 2
  var indentInitial = settings.indentInitial

  if (typeof indent === 'number') {
    indent = repeat(' ', indent)
  }

  // Default to indenting the initial level.
  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true
  }

  return transform

  function transform(tree) {
    var head

    minify(tree)

    visit(tree, visitor)

    function visitor(node, parents) {
      var children = node.children || []
      var level = parents.length
      var index = -1
      var result
      var previous
      var child
      var eol

      if (is(node, 'head')) {
        head = true
      }

      if (head && is(node, 'body')) {
        head = null
      }

      if (is(node, whitespaceSensitiveTagNames)) {
        return visit.SKIP
      }

      // Don’t indent content of whitespace-sensitive nodes / inlines.
      if (!children.length || !padding(node, head)) {
        return
      }

      if (!indentInitial) {
        level--
      }

      // Indent newlines in `text`.
      while (++index < children.length) {
        child = children[index]

        if (child.type === 'text' || child.type === 'comment') {
          if (child.value.indexOf('\n') !== -1) {
            eol = true
          }

          child.value = child.value.replace(
            / *\n/g,
            '$&' + repeat(indent, level)
          )
        }
      }

      result = []
      index = -1

      while (++index < children.length) {
        child = children[index]

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
      settings.blanks.length &&
      settings.blanks.indexOf(node.tagName) > -1
    )
  }

  function addBreak(list, level, next) {
    var tail = list[list.length - 1]
    var previous = whitespace(tail) ? list[list.length - 2] : tail
    var replace =
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
      ? head || is(node, 'script') || embedded(node) || !phrasing(node)
      : false)
  )
}
