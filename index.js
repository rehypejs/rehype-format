'use strict'

var minify = require('rehype-minify-whitespace')({newlines: true})
var visit = require('unist-util-visit-parents')
var embedded = require('hast-util-embedded')
var phrasing = require('hast-util-phrasing')
var whitespace = require('hast-util-whitespace')
var is = require('hast-util-is-element')
var sensitive = require('html-whitespace-sensitive-tag-names')
var repeat = require('repeat-string')

module.exports = format

var double = '\n\n'
var single = '\n'
var space = ' '
var re = / *\n/g

function format(options) {
  var settings = options || {}
  var indent = settings.indent || 2
  var indentInitial = settings.indentInitial
  var blanks = settings.blanks || []

  if (typeof indent === 'number') {
    indent = repeat(space, indent)
  }

  // Default to indenting the initial level.
  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true
  }

  return transform

  function transform(tree) {
    var head = false

    minify(tree)

    visit(tree, visitor)

    function visitor(node, parents) {
      var children = node.children || []
      var length = children.length
      var level = parents.length
      var index = -1
      var result
      var previous
      var child
      var newline

      if (is(node, 'head')) {
        head = true
      }

      if (head && is(node, 'body')) {
        head = false
      }

      if (is(node, sensitive)) {
        return visit.SKIP
      }

      // Don’t indent content of whitespace-sensitive nodes / inlines.
      if (!length || !padding(node, head)) {
        return
      }

      if (!indentInitial) {
        level--
      }

      // Indent newlines in `text`.
      while (++index < length) {
        child = children[index]

        if (child.type === 'text' || child.type === 'comment') {
          if (child.value.indexOf('\n') !== -1) {
            newline = true
          }

          child.value = child.value.replace(re, '$&' + repeat(indent, level))
        }
      }

      result = []
      index = -1

      while (++index < length) {
        child = children[index]

        if (padding(child, head) || (newline && index === 0)) {
          addBreak(result, level, child)
          newline = true
        }

        previous = child
        result.push(child)
      }

      if (newline || padding(previous, head)) {
        // Ignore trailing whitespace (if that already existed), as we’ll add
        // properly indented whitespace.
        if (whitespace(previous)) {
          result.pop()
          previous = result[result.length - 1]
        }

        addBreak(result, level - 1)
        newline = true
      }

      node.children = result
    }
  }

  function blank(node) {
    return (
      node &&
      node.type === 'element' &&
      blanks.length !== 0 &&
      blanks.indexOf(node.tagName) !== -1
    )
  }

  function addBreak(list, level, next) {
    var tail = list[list.length - 1]
    var previous = whitespace(tail) ? list[list.length - 2] : tail
    var replace =
      (blank(previous) && blank(next) ? double : single) + repeat(indent, level)

    if (tail && tail.type === 'text') {
      if (whitespace(tail)) {
        tail.value = replace
      } else {
        tail.value += replace
      }
    } else {
      list.push({type: 'text', value: replace})
    }
  }
}

function padding(node, head) {
  if (node.type === 'root') {
    return true
  }

  if (node.type === 'element') {
    return head || is(node, 'script') || embedded(node) || !phrasing(node)
  }

  return false
}
