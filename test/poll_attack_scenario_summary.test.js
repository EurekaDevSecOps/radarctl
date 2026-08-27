const assert = require('node:assert/strict')
const test = require('node:test')

const pollAttackScenarioSummary = require('../src/util/poll_attack_scenario_summary')

test('polls pending responses until the summary is completed', async () => {
  const responses = [
    { status: 'pending' },
    { status: 'pending' },
    {
      status: 'completed',
      summary: {
        byStatus: { open: [], partiallyRemediated: [], remediated: [] },
        byScoreSeverity: { critical: [], high: [], moderate: [], low: [] }
      }
    }
  ]
  const events = []

  const summary = await pollAttackScenarioSummary({
    receiveSummary: async () => responses.shift(),
    onPoll: (event) => events.push(event),
    intervalMs: 0,
    timeoutMs: 100
  })

  assert.deepEqual(summary.byScoreSeverity, { critical: [], high: [], moderate: [], low: [] })
  assert.deepEqual(events.map(({ attempt, status }) => ({ attempt, status })), [
    { attempt: 1, status: 'pending' },
    { attempt: 2, status: 'pending' },
    { attempt: 3, status: 'completed' }
  ])
})

test('rejects an invalid polling response', async () => {
  await assert.rejects(
    pollAttackScenarioSummary({ receiveSummary: async () => ({ status: 'unknown' }) }),
    /invalid attack scenario summary polling response/
  )
})

test('times out while the summary remains pending', async () => {
  await assert.rejects(
    pollAttackScenarioSummary({
      receiveSummary: async () => ({ status: 'pending' }),
      intervalMs: 0,
      timeoutMs: 0
    }),
    /Timed out waiting for attack scenario summary/
  )
})
