'use strict';

/* Dependencies. */
var minify = require('rehype-minify-whitespace')({newlines: true});
var phrasing = require('hast-util-phrasing');
var sensitive = require('html-whitespace-sensitive-tag-names');
var repeat = require('repeat-string');
var visit = require('unist-util-visit-parents');

/* Expose. */
module.exports = format;

/* Constants. */
var double = '\n\n';
var single = '\n';
var re = /\n/g;

/* Format white-space. */
function format(options) {
  var settings = options || {};
  var indent = settings.indent || 2;
  var indentInitial = settings.indentInitial;
  var blanks = settings.blanks || [];

  if (typeof indent === 'number') {
    indent = repeat(' ', indent);
  }

  /* Default to indenting the initial level. */
  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true;
  }

  return transform;

  function transform(tree) {
    var root = minify(tree);

    visit(root, visitor);

    return root;

    function visitor(node, parents) {
      var children = node.children || [];
      var length = children.length;
      var level = parents.length;
      var index = -1;
      var result;
      var prev;
      var child;
      var newline;

      /* Don’t indent content of whitespace-sensitive nodes / inlines. */
      if (!length || !padding(node) || ignore(parents.concat(node))) {
        return;
      }

      if (!indentInitial) {
        level--;
      }

      /* Indent newlines in `text`. */
      while (++index < length) {
        child = children[index];

        if (child.type === 'text') {
          if (child.value.indexOf('\n') !== -1) {
            newline = true;
          }

          child.value = child.value.replace(re, '$&' + repeat(indent, level));
        }
      }

      node.children = result = [];
      index = -1;

      while (++index < length) {
        child = children[index];

        if (padding(child) || (newline && index === 0)) {
          result.push({
            type: 'text',
            value: ((prev && blank(prev) && blank(child)) ? double : single) +
              repeat(indent, level)
          });
        }

        prev = child;
        result.push(child);
      }

      if (newline || padding(prev)) {
        result.push({
          type: 'text',
          value: single + repeat(indent, level - 1)
        });
      }
    }
  }

  function blank(node) {
    return node.type === 'element' &&
      blanks.length !== 0 &&
      blanks.indexOf(node.tagName) !== -1;
  }
}

function padding(node) {
  if (node.type === 'root') {
    return true;
  }

  if (node.type === 'element') {
    return node.tagName === 'script' || !phrasing(node);
  }

  return false;
}

function ignore(nodes) {
  var index = nodes.length;

  while (index--) {
    if (sensitive.indexOf(nodes[index].tagName) !== -1) {
      return true;
    }
  }

  return false;
}
