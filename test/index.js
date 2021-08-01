import fs from 'fs'
import path from 'path'
import test from 'tape'
import {rehype} from 'rehype'
import {readSync} from 'to-vfile'
import negate from 'negate'
import {isHidden} from 'is-hidden'
import fmt from '../index.js'

test('format', function (t) {
  var root = path.join('test', 'fixtures')

  const files = fs.readdirSync(root).filter(negate(isHidden))

  t.plan(files.length)

  let index = -1
  while (++index < files.length) {
    one(files[index])
  }

  function one(fixture) {
    var base = path.join(root, fixture)
    var input = readSync(path.join(base, 'input.html'))
    var output = readSync(path.join(base, 'output.html'))
    var config
    var proc

    try {
      config = JSON.parse(fs.readFileSync(path.join(base, 'config.json')))
    } catch (_) {}

    proc = rehype().use(fmt, config)

    proc.process(input, function (error) {
      t.test(fixture, function (t) {
        t.plan(3)
        t.ifErr(error, 'shouldn’t throw')
        t.equal(input.messages.length, 0, 'shouldn’t warn')
        t.equal(String(input), String(output), 'should match')
      })
    })
  }
})
