const assert = require('node:assert/strict')
const test = require('node:test')

const pipelineExitCode = require('../src/util/pipeline_exit_code')

const emptyVulnerabilities = () => ({ errors: [], warnings: [], notes: [] })
const emptyScenarios = () => ({ critical: [], high: [], moderate: [], low: [] })

const sourceCases = [
  { name: 'neither source matches', vulnerabilities: false, scenarios: false },
  { name: 'only vulnerabilities match', vulnerabilities: true, scenarios: false },
  { name: 'only scenarios match', vulnerabilities: false, scenarios: true },
  { name: 'both sources match', vulnerabilities: true, scenarios: true }
]

const expectedByPolicy = {
  vulnerability: [0, 8, 0, 8],
  scenarios: [0, 0, 8, 8],
  all: [0, 8, 8, 8]
}

for (const [policy, expectedExitCodes] of Object.entries(expectedByPolicy)) {
  for (const [index, sourceCase] of sourceCases.entries()) {
    const expectedExitCode = expectedExitCodes[index]
    test(`${policy} policy with ${sourceCase.name} returns exit code ${expectedExitCode}`, () => {
      const exitCode = pipelineExitCode({
        policy,
        vulnerabilitySummary: {
          ...emptyVulnerabilities(),
          errors: sourceCase.vulnerabilities ? [{}] : []
        },
        vulnerabilityThreshold: 'high',
        scenarioSummary: {
          ...emptyScenarios(),
          high: sourceCase.scenarios ? [{}] : []
        },
        scenarioThreshold: 'high'
      })

      assert.equal(exitCode, expectedExitCode)
    })
  }
}

const thresholdCases = [
  {
    name: 'vulnerability policy with moderate finding and high threshold returns exit code 0',
    args: {
      policy: 'vulnerability',
      vulnerabilitySummary: { ...emptyVulnerabilities(), warnings: [{}] },
      vulnerabilityThreshold: 'high'
    },
    expectedExitCode: 0
  },
  {
    name: 'vulnerability policy with moderate finding and moderate threshold returns exit code 8',
    args: {
      policy: 'vulnerability',
      vulnerabilitySummary: { ...emptyVulnerabilities(), warnings: [{}] },
      vulnerabilityThreshold: 'moderate'
    },
    expectedExitCode: 8
  },
  {
    name: 'scenarios policy with high scenario and critical threshold returns exit code 0',
    args: {
      policy: 'scenarios',
      vulnerabilitySummary: emptyVulnerabilities(),
      scenarioSummary: { ...emptyScenarios(), high: [{}] },
      scenarioThreshold: 'critical'
    },
    expectedExitCode: 0
  },
  {
    name: 'scenarios policy with high scenario and high threshold returns exit code 8',
    args: {
      policy: 'scenarios',
      vulnerabilitySummary: emptyVulnerabilities(),
      scenarioSummary: { ...emptyScenarios(), high: [{}] },
      scenarioThreshold: 'high'
    },
    expectedExitCode: 8
  },
  {
    name: 'scenarios policy with high vulnerability, low scenario, and moderate threshold returns exit code 0',
    args: {
      policy: 'scenarios',
      vulnerabilitySummary: { ...emptyVulnerabilities(), errors: [{}] },
      vulnerabilityThreshold: 'high',
      scenarioSummary: { ...emptyScenarios(), low: [{}] },
      scenarioThreshold: 'moderate'
    },
    expectedExitCode: 0
  },
  {
    name: 'scenarios policy with high vulnerability, low scenario, and low threshold returns exit code 8',
    args: {
      policy: 'scenarios',
      vulnerabilitySummary: { ...emptyVulnerabilities(), errors: [{}] },
      vulnerabilityThreshold: 'high',
      scenarioSummary: { ...emptyScenarios(), low: [{}] },
      scenarioThreshold: 'low'
    },
    expectedExitCode: 8
  },
  {
    name: 'vulnerability policy with low vulnerability, critical scenario, and moderate threshold returns exit code 0',
    args: {
      policy: 'vulnerability',
      vulnerabilitySummary: { ...emptyVulnerabilities(), notes: [{}] },
      vulnerabilityThreshold: 'moderate',
      scenarioSummary: { ...emptyScenarios(), critical: [{}] },
      scenarioThreshold: 'critical'
    },
    expectedExitCode: 0
  },
  {
    name: 'vulnerability policy with low vulnerability, critical scenario, and low threshold returns exit code 8',
    args: {
      policy: 'vulnerability',
      vulnerabilitySummary: { ...emptyVulnerabilities(), notes: [{}] },
      vulnerabilityThreshold: 'low',
      scenarioSummary: { ...emptyScenarios(), critical: [{}] },
      scenarioThreshold: 'critical'
    },
    expectedExitCode: 8
  },
  {
    name: 'all policy exits when only the scenario threshold is met',
    args: {
      policy: 'all',
      vulnerabilitySummary: { ...emptyVulnerabilities(), notes: [{}] },
      vulnerabilityThreshold: 'moderate',
      scenarioSummary: { ...emptyScenarios(), high: [{}] },
      scenarioThreshold: 'high'
    },
    expectedExitCode: 8
  },
  {
    name: 'all policy exits when only the vulnerability threshold is met',
    args: {
      policy: 'all',
      vulnerabilitySummary: { ...emptyVulnerabilities(), errors: [{}] },
      vulnerabilityThreshold: 'high',
      scenarioSummary: { ...emptyScenarios(), low: [{}] },
      scenarioThreshold: 'moderate'
    },
    expectedExitCode: 8
  },
  {
    name: 'all policy passes when both sources are below their thresholds',
    args: {
      policy: 'all',
      vulnerabilitySummary: { ...emptyVulnerabilities(), notes: [{}] },
      vulnerabilityThreshold: 'moderate',
      scenarioSummary: { ...emptyScenarios(), low: [{}] },
      scenarioThreshold: 'moderate'
    },
    expectedExitCode: 0
  }
]

for (const { name, args, expectedExitCode } of thresholdCases) {
  test(name, () => assert.equal(pipelineExitCode(args), expectedExitCode))
}

test('vulnerability policy ignores inactive scenario data and threshold', () => {
  const exitCode = pipelineExitCode({
    policy: 'vulnerability',
    vulnerabilitySummary: emptyVulnerabilities(),
    scenarioSummary: undefined,
    scenarioThreshold: 'invalid'
  })

  assert.equal(exitCode, 0)
})

test('scenarios policy ignores inactive vulnerability data and threshold', () => {
  const exitCode = pipelineExitCode({
    policy: 'scenarios',
    vulnerabilitySummary: undefined,
    vulnerabilityThreshold: 'invalid',
    scenarioSummary: emptyScenarios(),
    scenarioThreshold: 'high'
  })

  assert.equal(exitCode, 0)
})

test('omitted vulnerability threshold preserves any-finding behavior', () => {
  const exitCode = pipelineExitCode({
    policy: 'vulnerability',
    vulnerabilitySummary: { ...emptyVulnerabilities(), notes: [{}] }
  })

  assert.equal(exitCode, 8)
})
