const package = require('../../package.json')
const { DateTime } = require("luxon")

const EWA_URL = process.env.EWA_URL ?? 'https://bff.eurekadevsecops.com/'
const VDBE_URL = process.env.VDBE_URL ?? 'https://vulns.eurekadevsecops.com'

const USER_AGENT = `Radar/${package.version} (${package.pkgname}@${package.version}; ${process?.platform}-${process?.arch}; ${process?.release?.name}-${process?.version})`

const enabled = () => {
  if (process.env.EUREKA_AGENT_TOKEN) return true
  return false
}

const send = async (path, params, body, token) => {
  return fetch(toURL(path, params), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token ?? process.env.EUREKA_AGENT_TOKEN}`,
      'Content-Type': toContentType(path),
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    },
    body: toBody(path, body)
  })
}

const sendSensitive = async (path, params, body) => {
  return send(path, params, body, await token())
}

const token = async () => {
  const response = await fetch(`${EWA_URL}/vdbe/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EUREKA_AGENT_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    }
  })
  if (!response.ok) throw new Error(`Internal Error: Failed to get VDBE auth token from EWA: ${response.statusText}: ${await response.text()}`)
  const data = await response.json()
  return data.token
}

const toURL = (path, params) => {
  if (path === `scans/started`) return `${EWA_URL}/scans/started`
  if (path === `scans/:scanID/completed`) return `${EWA_URL}/scans/${params.scanID}/completed`
  if (path === `scans/:scanID/failed`) return `${EWA_URL}/scans/${params.scanID}/completed`
  if (path === `scans/:scanID/results`) return `${VDBE_URL}/scans/${params.scanID}/results`
  throw new Error(`Internal Error: Unknown telemetry event: ${path}`)
}

const toContentType = (path) => {
  if (path === `scans/:scanID/log`) return 'text/plain'
  return 'application/json'
}

const toBody = (path, body) => {
  if (path === `scans/started`) body = { ...body, timestamp: DateTime.now().toISO(), profile_id: process.env.EUREKA_PROFILE }
  if (path === `scans/:scanID/completed`) body = { ...toFindings(body), timestamp: DateTime.now().toISO(), status: 'success', log: { sizeBytes: 0, warnings: 0, errors: 0, link: 'none' }, params: { id: '' }}
  if (path === `scans/:scanID/failed`) body = { ...body, timestamp: DateTime.now().toISO(), status: 'failure', findings: { total: 0, critical: 0, high: 0, med: 0, low: 0 }, log: { sizeBytes: 0, warnings: 0, errors: 0, link: 'none' }, params: { id: '' }}
  if (path === `scans/:scanID/results`) body = { findings: body.findings /* SARIF */, profileId: process.env.EUREKA_PROFILE, log: Buffer.from(body.log, 'utf8').toString('base64') }
  return JSON.stringify(body)
}

const toFindings = (summary) => ({
  findings: {
    total: summary.errors.length + summary.warnings.length + summary.notes.length,
    critical: 0,
    high: summary.errors.length,
    med: summary.warnings.length,
    low: summary.notes.length
  }
})

module.exports = {
  enabled,
  send,
  sendSensitive
}
