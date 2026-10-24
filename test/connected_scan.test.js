const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const paths = require('../src/util/paths')
const runner = require('../src/util/runner')
const scan = require('../src/commands/scan')

const scanner = {
  name: 'test-scanner',
  default: true,
  categories: ['SAST']
}

const response = ({ ok, status, statusText, body = '' }) => ({
  ok,
  status,
  statusText,
  text: async () => body,
  json: async () => body
})

const runScan = async ({ local = false, telemetry }) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'radarctl-scan-test-'))
  const originalResolveScansDir = paths.resolveScansDir
  const originalRunner = runner.run
  let runnerCalled = false

  paths.resolveScansDir = () => target
  runner.run = async () => {
    runnerCalled = true
    throw new Error('scanner stopped by test')
  }

  const toolbox = {
    log: () => {},
    scanners: [scanner],
    categories: ['SAST'],
    telemetry,
    git: {
      metadata: () => ({
        type: 'git',
        repo: {
          owner: 'owner',
          name: 'repo',
          source: { type: 'github' }
        }
      })
    },
    analytics: {
      EVENTS: {
        radar_scan_started: 'started',
        radar_scan_failed: 'failed'
      },
      setEnabled: () => {},
      setDebug: () => {},
      setLogger: () => {},
      track: () => {}
    }
  }

  try {
    const result = await scan.run(toolbox, {
      TARGET: target,
      LOCAL: local,
      QUIET: true,
      SKIP_SBOM: true
    }, {})
    return { result, runnerCalled }
  } finally {
    paths.resolveScansDir = originalResolveScansDir
    runner.run = originalRunner
    fs.rmSync(target, { recursive: true, force: true })
  }
}

test('requires --local when connected scan credentials are unavailable', async () => {
  await assert.rejects(
    runScan({ telemetry: { enabled: false } }),
    /Connected scans require EUREKA_AGENT_TOKEN/
  )
})

test('does not run scanners when repository authorization is forbidden', async () => {
  const telemetry = {
    enabled: true,
    send: async () => response({ ok: true, body: { scan_id: 'scan-id' } }),
    sendSensitive: async () => response({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      body: 'Repository is not in this token scope.'
    })
  }

  await assert.rejects(
    runScan({ telemetry }),
    /Connected scan was not authorized: \[403\] Forbidden/
  )
})

test('does not run scanners when connected scan credentials are unauthorized', async () => {
  const telemetry = {
    enabled: true,
    send: async () => response({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      body: 'Invalid agent token.'
    })
  }

  await assert.rejects(
    runScan({ telemetry }),
    /\[401\] Unauthorized/
  )
})

test('runs scanners without connected authorization only with --local', async () => {
  const { result, runnerCalled } = await runScan({
    local: true,
    telemetry: { enabled: false }
  })

  assert.equal(result, 0x10)
  assert.equal(runnerCalled, true)
})
