'use strict'

var minify = require('rehype-minify-whitespace')({newlines: true})
var phrasing = require('hast-util-phrasing')
var embedded = require('hast-util-embedded')
var sensitive = require('html-whitespace-sensitive-tag-names')
var repeat = require('repeat-string')
var visit = require('unist-util-visit-parents')

module.exports = format

var double = '\n\n'
var single = '\n'
var re = /\n/g

function format(options) {
  var settings = options || {}
  var indent = settings.indent || 2
  var indentInitial = settings.indentInitial
  var blanks = settings.blanks || []

  if (typeof indent === 'number') {
    indent = repeat(' ', indent)
  }

  // Default to indenting the initial level.
  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true
  }

  return transform

  function transform(tree) {
    var root = minify(tree)
    var head = false

    visit(root, visitor)

    return root

    function visitor(node, parents) {
      var children = node.children || []
      var length = children.length
      var level = parents.length
      var index = -1
      var result
      var prev
      var child
      var newline

      if (node.type === 'element' && node.tagName === 'head') {
        head = true
      }

      if (head && node.type === 'element' && node.tagName === 'body') {
        head = false
      }

      // Don’t indent content of whitespace-sensitive nodes / inlines.
      if (!length || !padding(node, head) || ignore(parents.concat(node))) {
        return
      }

      if (!indentInitial) {
        level--
      }

      // Indent newlines in `text`.
      while (++index < length) {
        child = children[index]

        if (child.type === 'text') {
          if (child.value.indexOf('\n') !== -1) {
            newline = true
          }

          child.value = child.value.replace(re, '$&' + repeat(indent, level))
        }
      }

      result = []
      index = -1

      node.children = result

      while (++index < length) {
        child = children[index]

        if (padding(child, head) || (newline && index === 0)) {
          result.push({
            type: 'text',
            value:
              (prev && blank(prev) && blank(child) ? double : single) +
              repeat(indent, level)
          })
        }

        prev = child
        result.push(child)
      }

      if (newline || padding(prev, head)) {
        result.push({
          type: 'text',
          value: single + repeat(indent, level - 1)
        })
      }
    }
  }

  function blank(node) {
    return (
      node.type === 'element' &&
      blanks.length !== 0 &&
      blanks.indexOf(node.tagName) !== -1
    )
  }
}

function padding(node, head) {
  if (node.type === 'root') {
    return true
  }

  if (node.type === 'element') {
    return (
      head || node.tagName === 'script' || embedded(node) || !phrasing(node)
    )
  }

  return false
}

function ignore(nodes) {
  var index = nodes.length

  while (index--) {
    if (sensitive.indexOf(nodes[index].tagName) !== -1) {
      return true
    }
  }

  return false
}
