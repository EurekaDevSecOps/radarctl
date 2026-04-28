const test = require('node:test')
const assert = require('node:assert/strict')
const summarize = require('./summarize')

const makeResult = ({ level, ruleId = 'rule-1' } = {}) => ({
  ...(level === undefined ? {} : { level }),
  ruleId,
  message: { text: 'test finding' },
  locations: [{
    physicalLocation: {
      artifactLocation: { uri: 'src/file.js' },
      region: { startLine: 1 }
    }
  }]
})

const makeRule = ({ id = 'rule-1', level } = {}) => ({
  id,
  ...(level === undefined ? {} : { defaultConfiguration: { level } })
})

const makeSarif = ({ resultLevel, ruleLevel } = {}) => ({
  runs: [{
    tool: {
      driver: {
        name: 'test-tool',
        rules: [makeRule({ level: ruleLevel })]
      }
    },
    results: [makeResult({ level: resultLevel })]
  }]
})

test('summarize keeps existing mappings for error warning and note', () => {
  const cases = [
    ['error', 'errors'],
    ['warning', 'warnings'],
    ['note', 'notes']
  ]

  for (const [inputLevel, bucket] of cases) {
    const summary = summarize(makeSarif({ resultLevel: inputLevel }), '.')
    assert.equal(summary.errors.length + summary.warnings.length + summary.notes.length, 1)
    assert.equal(summary[bucket].length, 1)
    assert.equal(summary[bucket][0].level, inputLevel)
  }
})

test('summarize maps info and none result levels to notes', () => {
  for (const inputLevel of ['info', 'none']) {
    const summary = summarize(makeSarif({ resultLevel: inputLevel }), '.')
    assert.equal(summary.notes.length, 1)
    assert.equal(summary.notes[0].level, 'note')
    assert.equal(summary.errors.length, 0)
    assert.equal(summary.warnings.length, 0)
  }
})

test('summarize maps info and none rule default levels to notes', () => {
  for (const ruleLevel of ['info', 'none']) {
    const summary = summarize(makeSarif({ ruleLevel }), '.')
    assert.equal(summary.notes.length, 1)
    assert.equal(summary.notes[0].level, 'note')
    assert.equal(summary.errors.length, 0)
    assert.equal(summary.warnings.length, 0)
  }
})

test('summarize keeps default fallback behavior for missing levels', () => {
  const summary = summarize(makeSarif(), '.')
  assert.equal(summary.errors.length, 1)
  assert.equal(summary.warnings.length, 0)
  assert.equal(summary.notes.length, 0)
  assert.equal(summary.errors[0].level, 'error')
})
