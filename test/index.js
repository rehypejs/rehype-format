/**
 * @typedef {import('../index.js').Options} Options
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {isHidden} from 'is-hidden'
import {rehype} from 'rehype'
import {read} from 'to-vfile'
import fmt from '../index.js'

test('format', async function (t) {
  const root = new URL('fixtures/', import.meta.url)

  const files = await fs.readdir(root)

  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (isHidden(name)) {
      continue
    }

    // eslint-disable-next-line no-await-in-loop
    await t.test(name, async function () {
      const folder = new URL(name + '/', root)
      const input = await read(new URL('input.html', folder))
      const output = await read(new URL('output.html', folder))
      /** @type {Options | undefined} */
      let config

      try {
        config = JSON.parse(
          String(await fs.readFile(new URL('config.json', folder)))
        )
      } catch {}

      const result = await rehype()
        // @ts-expect-error: to do: fix types.
        .use(fmt, config)
        .process(input)

      assert.equal(result.messages.length, 0, 'shouldn’t warn')
      assert.equal(String(input), String(output), 'should match')
    })
  }
})
