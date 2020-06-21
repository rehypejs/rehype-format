# rehype-format

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**rehype**][rehype] plugin to format HTML.

## Install

[npm][]:

```sh
npm install rehype-format
```

## Use

Say we have the following file, `index.html`:

```html
<!doCTYPE HTML><html>
 <head>
    <title>Hello!</title>
<meta charset=utf8>
      </head>
  <body><section>    <p>hi there</p>
     </section>
 </body>
</html>
```

And our script, `example.js`, looks as follows:

```js
var vfile = require('to-vfile')
var report = require('vfile-reporter')
var rehype = require('rehype')
var format = require('rehype-format')

rehype()
  .use(format)
  .process(vfile.readSync('index.html'), function (err, file) {
    console.error(report(err || file))
    console.log(String(file))
  })
```

Now, running `node example` yields:

```txt
index.html: no issues found
```

```html
<!doctype html>
<html>
  <head>
    <title>Hello!</title>
    <meta charset="utf8">
  </head>
  <body>
    <section>
      <p>hi there</p>
    </section>
  </body>
</html>
```

## API

### `rehype().use(format[, options])`

Format white space in the processed tree.

*   Collapse all white space (to a single space or newline)
*   Remove unneeded white space
*   Inject needed newlines and indentation
*   Indent previously collapsed newlines properly

All superfluous white space is removed.
However, as newlines are kept (and later properly indented), your code will
still line-wrap as expected.

##### `options`

###### `options.indent`

Indentation per level (`number`, `string`, default: `2`).
When number, uses that amount of spaces.
When `string`, uses that per indentation level.

###### `options.indentInitial`

Whether to indent the first level (`boolean`, default: `true`).
This is usually the `<html>`, thus not indenting `head` and `body`.

###### `options.blanks`

List of tag names to join with a blank line (`Array.<string>`, default: `[]`).
These tags, when next to each other, are joined by a blank line (`\n\n`).
For example, when `['head', 'body']` is given, a blank line is added between
these two.

## Security

Use of `rehype-format` changes white space in the syntax tree.
White space in `<script>`, `<style>`, `<pre>`, or `<textarea>` is not modified.
If the tree is already safe, use of this plugin does not open you up for a
[cross-site scripting (XSS)][xss] attack.
When in doubt, use [`rehype-sanitize`][sanitize].

## Related

*   [`rehype-minify`](https://github.com/rehypejs/rehype-minify)
    — Minify HTML
*   [`rehype-document`](https://github.com/rehypejs/rehype-document)
    — Wrap a document around a fragment
*   [`rehype-sanitize`](https://github.com/rehypejs/rehype-sanitize)
    — Sanitize HTML
*   [`rehype-toc`](https://github.com/JS-DevTools/rehype-toc)
    — Add a table of contents (TOC)
*   [`rehype-section`](https://github.com/agentofuser/rehype-section)
    — Wrap headings and their contents in sections

## Contribute

See [`contributing.md`][contributing] in [`rehypejs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/rehypejs/rehype-format.svg

[build]: https://travis-ci.org/rehypejs/rehype-format

[coverage-badge]: https://img.shields.io/codecov/c/github/rehypejs/rehype-format.svg

[coverage]: https://codecov.io/github/rehypejs/rehype-format

[downloads-badge]: https://img.shields.io/npm/dm/rehype-format.svg

[downloads]: https://www.npmjs.com/package/rehype-format

[size-badge]: https://img.shields.io/bundlephobia/minzip/rehype-format.svg

[size]: https://bundlephobia.com/result?p=rehype-format

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/rehype

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/rehypejs/.github

[contributing]: https://github.com/rehypejs/.github/blob/HEAD/contributing.md

[support]: https://github.com/rehypejs/.github/blob/HEAD/support.md

[coc]: https://github.com/rehypejs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[rehype]: https://github.com/rehypejs/rehype

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[sanitize]: https://github.com/rehypejs/rehype-sanitize
