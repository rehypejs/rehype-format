/**
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').RootContent} RootContent
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Array<string> | null | undefined} [blanks=[]]
 *   List of tag names to join with a blank line (default: `[]`); these tags,
 *   when next to each other, are joined by a blank line (`\n\n`); for example,
 *   when `['head', 'body']` is given, a blank line is added between these two.
 * @property {number | string | null | undefined} [indent=2]
 *   Indentation per level (default: `2`); when number, uses that amount of
 *   spaces; when `string`, uses that per indentation level.
 * @property {boolean | null | undefined} [indentInitial=true]
 *   Whether to indent the first level (default: `true`); this is usually the
 *   `<html>`, thus not indenting `head` and `body`.
 */

import {embedded} from 'hast-util-embedded'
import {isElement} from 'hast-util-is-element'
import {phrasing} from 'hast-util-phrasing'
import {whitespace} from 'hast-util-whitespace'
import {whitespaceSensitiveTagNames} from 'html-whitespace-sensitive-tag-names'
import rehypeMinifyWhitespace from 'rehype-minify-whitespace'
import {SKIP, visitParents} from 'unist-util-visit-parents'

/** @type {Options} */
const emptyOptions = {}
const transformWhitespace = rehypeMinifyWhitespace({newlines: true})

/**
 * Format whitespace in HTML.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function rehypeFormat(options) {
  const settings = options || emptyOptions
  let indent = settings.indent || 2
  let indentInitial = settings.indentInitial

  if (typeof indent === 'number') {
    indent = ' '.repeat(indent)
  }

  // Default to indenting the initial level.
  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true
  }

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    /** @type {boolean | undefined} */
    let head

    transformWhitespace(tree)

    // eslint-disable-next-line complexity
    visitParents(tree, function (node, parents) {
      let index = -1

      if (!('children' in node)) {
        return
      }

      if (isElement(node, 'head')) {
        head = true
      }

      if (head && isElement(node, 'body')) {
        head = undefined
      }

      if (isElement(node, whitespaceSensitiveTagNames)) {
        return SKIP
      }

      const children = node.children
      let level = parents.length

      // Don’t indent content of whitespace-sensitive nodes / inlines.
      if (children.length === 0 || !padding(node, head)) {
        return
      }

      if (!indentInitial) {
        level--
      }

      /** @type {boolean | undefined} */
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
            '$&' + String(indent).repeat(level)
          )
        }
      }

      /** @type {Array<RootContent>} */
      const result = []
      /** @type {RootContent | undefined} */
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

      if (previous && (eol || padding(previous, head))) {
        // Ignore trailing whitespace (if that already existed), as we’ll add
        // properly indented whitespace.
        if (whitespace(previous)) {
          result.pop()
          previous = result[result.length - 1]
        }

        addBreak(result, level - 1)
      }

      node.children = result
    })
  }

  /**
   * @param {Array<RootContent>} list
   *   Nodes.
   * @param {number} level
   *   Indentation level.
   * @param {RootContent | undefined} [next]
   *   Next node.
   * @returns {undefined}
   *   Nothing.
   */
  function addBreak(list, level, next) {
    const tail = list[list.length - 1]
    const previous = tail && whitespace(tail) ? list[list.length - 2] : tail
    const replace =
      (blank(previous) && blank(next) ? '\n\n' : '\n') +
      String(indent).repeat(Math.max(level, 0))

    if (tail && tail.type === 'text') {
      tail.value = whitespace(tail) ? replace : tail.value + replace
    } else {
      list.push({type: 'text', value: replace})
    }
  }

  /**
   * @param {Nodes | undefined} node
   *   Node.
   * @returns {boolean}
   *   Whether `node` is a blank.
   */
  function blank(node) {
    return Boolean(
      node &&
        node.type === 'element' &&
        settings.blanks &&
        settings.blanks.length > 0 &&
        settings.blanks.includes(node.tagName)
    )
  }
}

/**
 * @param {Nodes} node
 *   Node.
 * @param {boolean | undefined} head
 *   Whether the node is in `head`.
 * @returns {boolean}
 *   Whether `node` should be padded.
 */
function padding(node, head) {
  return (
    node.type === 'root' ||
    (node.type === 'element'
      ? head || isElement(node, 'script') || embedded(node) || !phrasing(node)
      : false)
  )
}
