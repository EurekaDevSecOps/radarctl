const assert = require('node:assert/strict')
const test = require('node:test')
const colors = require('colors')

const displayScanResults = require('../src/util/display_scan_results')

colors.disable()

const emptyVulnerabilities = () => ({ errors: [], warnings: [], notes: [] })
const emptyScenarios = () => ({ critical: [], high: [], moderate: [], low: [] })

function capture (overrides = {}) {
  const lines = []
  displayScanResults({
    summary: emptyVulnerabilities(),
    scenarioSummary: emptyScenarios(),
    useAttackScenarios: true,
    format: 'security',
    baselined: true,
    log: (...args) => lines.push(args.join(' ')),
    ...overrides
  })
  return { lines, output: lines.join('\n') }
}

test('hides empty vulnerability and attack-scenario sections', () => {
  const { output } = capture()

  assert.doesNotMatch(output, /^Vulnerabilities$/m)
  assert.doesNotMatch(output, /^Attack Scenarios$/m)
  assert.match(output, /0 new vulnerabilities:/)
  assert.match(output, /0 attack scenarios discovered:/)
})

test('shows only the vulnerability section when scenarios are empty', () => {
  const { output } = capture({
    summary: {
      errors: [{ artifact: { name: 'app.js', line: 4 }, tool: 'scanner', message: 'unsafe call' }],
      warnings: [],
      notes: []
    }
  })

  assert.match(output, /^Vulnerabilities\n─+\n/m)
  assert.match(output, /app\.js:4: high severity: scanner: unsafe call/)
  assert.doesNotMatch(output, /^Attack Scenarios$/m)
})

test('shows scenario names and exploitability without IDs or status', () => {
  const { output } = capture({
    scenarioSummary: {
      critical: [{
        id: 'scenario-id',
        friendlyId: 'AS-1',
        name: 'Account takeover',
        status: 'open',
        exploitabilityScore: 95
      }],
      high: [],
      moderate: [],
      low: []
    }
  })

  assert.match(output, /^Attack Scenarios\n─+\n/m)
  assert.match(output, /critical attack scenario: exploitability 95: Account takeover/)
  assert.doesNotMatch(output, /AS-1|scenario-id|\bopen\b/)
})

test('groups both totals at the end and leaves a blank line before the dashboard link', () => {
  const { lines } = capture({
    summary: {
      errors: [{ artifact: { name: 'app.js', line: 4 }, tool: 'scanner', message: 'unsafe call' }],
      warnings: [],
      notes: []
    },
    scenarioSummary: {
      critical: [{ name: 'Account takeover', exploitabilityScore: 95 }],
      high: [],
      moderate: [],
      low: []
    },
    scanURL: 'https://example.test/scans/scan-id'
  })
  const scenario = lines.findIndex((line) => line.includes('Account takeover'))
  const vulnerabilityTotal = lines.findIndex((line) => line.includes('1 new vulnerability:'))
  const scenarioTotal = lines.findIndex((line) => line.includes('1 attack scenario discovered:'))
  const link = lines.findIndex((line) => line.startsWith('View scan findings'))

  assert.ok(vulnerabilityTotal > scenario)
  assert.equal(scenarioTotal, vulnerabilityTotal + 1)
  assert.equal(lines[link - 1], '')
})
