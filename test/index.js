/**
 * @typedef {import('../index.js').Options} Options
 */

import fs from 'node:fs'
import path from 'node:path'
import test from 'tape'
import {rehype} from 'rehype'
import {readSync} from 'to-vfile'
import {isHidden} from 'is-hidden'
import fmt from '../index.js'

test('format', (t) => {
  const root = path.join('test', 'fixtures')

  const files = fs.readdirSync(root).filter((d) => !isHidden(d))

  t.plan(files.length)

  let index = -1
  while (++index < files.length) {
    const fixture = files[index]
    const base = path.join(root, fixture)
    const input = readSync(path.join(base, 'input.html'))
    const output = readSync(path.join(base, 'output.html'))
    /** @type {Options|undefined} */
    let config

    try {
      config = JSON.parse(
        String(fs.readFileSync(path.join(base, 'config.json')))
      )
    } catch {}

    // @ts-expect-error: to do.
    const proc = rehype().use(fmt, config)

    proc.process(input, (error) => {
      t.test(fixture, (t) => {
        t.plan(3)
        t.ifErr(error, 'shouldn’t throw')
        t.equal(input.messages.length, 0, 'shouldn’t warn')
        t.equal(String(input), String(output), 'should match')
      })
    })
  }
})
