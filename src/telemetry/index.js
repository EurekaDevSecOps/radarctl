const pkg = require('../../package.json')
const { DateTime } = require("luxon")
const { jwtDecode } = require('jwt-decode')

class Telemetry {
  #EUREKA_AGENT_TOKEN = process.env.EUREKA_AGENT_TOKEN
  #USER_AGENT = `RadarCLI/${pkg.version} (${pkg.name}@${pkg.version}; ${process?.platform}-${process?.arch}; ${process?.release?.name}-${process?.version})`
  #EWA_URL

  constructor() {
    this.enabled = !!this.#EUREKA_AGENT_TOKEN
    this.#EWA_URL = this.#claims(this.#EUREKA_AGENT_TOKEN).aud
  }

  async send(path, params, body, token) {
    return fetch(this.#toPostURL(path, params, token), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token ?? this.#EUREKA_AGENT_TOKEN}`,
        'Content-Type': this.#toContentType(path),
        'User-Agent': this.#USER_AGENT,
        'Accept': 'application/json'
      },
      body: this.#toBody(path, body)
    })
    .then(async (res) => {
//TODO: Display this on stdout only if --debug option is selected on the cmd line.
//if (!res.ok) console.log(`POST ${this.#toPostURL(path, params, token)} [${res.status}] ${res.statusText}: ${await res.text()}`)
      return res
    })
  }

  async sendSensitive(path, params, body) {
    return this.send(path, params, body, await this.#token())
  }

  async receive(path, params, token) {
    return fetch(this.#toReceiveURL(path, params, token), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token ?? this.#EUREKA_AGENT_TOKEN}`,
        'User-Agent': this.#USER_AGENT,
        'Accept': 'application/json'
      }
    }).then(async (res) => {
//TODO: Display this on stdout only if --debug option is selected on the cmd line.
//if (!res.ok) console.log(`GET ${this.#toReceiveURL(path, params, token)} [${res.status}] ${res.statusText}`)
      return await res.json()
    })
  }

  async receiveSensitive(path, params) {
    return this.receive(path, params, await this.#token())
  }

  //
  // private
  //

  #claims(jwt) {
    let claims = undefined
    try { claims = jwtDecode(jwt) } catch (error) {}
    return claims ?? {}
  }

  async #token() {
    const response = await fetch(`${this.#EWA_URL}/vdbe/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.#EUREKA_AGENT_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': this.#USER_AGENT,
        'Accept': 'application/json'
      }
    })
    if (!response.ok) throw new Error(`Internal Error: Failed to get VDBE auth token from EWA: ${response.statusText}: ${await response.text()}`)
    const data = await response.json()
    return data.token
  }

  #toPostURL(path, params, token) {
    const claims = this.#claims(token ?? this.#EUREKA_AGENT_TOKEN)
    if (path === `scans/started`) return `${claims.aud}/scans/started`
    if (path === `scans/:scanID/completed`) return `${claims.aud}/scans/${params.scanID}/completed`
    if (path === `scans/:scanID/failed`) return `${claims.aud}/scans/${params.scanID}/completed`
    if (path === `scans/:scanID/results`) return `${claims.aud}/scans/${params.scanID}/results`
    throw new Error(`Internal Error: Unknown telemetry event: POST ${path}`)
  }

  #toReceiveURL(path, params, token) {
    const claims = this.#claims(token ?? this.#EUREKA_AGENT_TOKEN)
    if (path === `scans/:scanID/summary`) return `${claims.aud}/scans/${params.scanID}/summary?profileId=${process.env.EUREKA_PROFILE}`
    throw new Error(`Internal Error: Unknown telemetry event: GET ${path}`)
  }

  #toContentType(path) {
    if (path === `scans/:scanID/log`) return 'text/plain'
    return 'application/json'
  }

  #toBody(path, body) {
    if (path === `scans/started`) body = { ...body, timestamp: DateTime.now().toISO(), profile_id: process.env.EUREKA_PROFILE }
    if (path === `scans/:scanID/completed`) body = { ...this.#toFindings(body), timestamp: DateTime.now().toISO(), status: 'success', log: { sizeBytes: 0, warnings: 0, errors: 0, link: 'none' }, params: { id: '' }}
    if (path === `scans/:scanID/failed`) body = { ...body, timestamp: DateTime.now().toISO(), status: 'failure', findings: { total: 0, critical: 0, high: 0, med: 0, low: 0 }, log: { sizeBytes: 0, warnings: 0, errors: 0, link: 'none' }, params: { id: '' }}
    if (path === `scans/:scanID/results`) body = { findings: body.findings /* SARIF */, profileId: process.env.EUREKA_PROFILE, log: Buffer.from(body.log, 'utf8').toString('base64') }
    return JSON.stringify(body)
  }

  #toFindings(summary) {
    return {
      findings: {
        total: summary.errors.length + summary.warnings.length + summary.notes.length,
        critical: 0,
        high: summary.errors.length,
        med: summary.warnings.length,
        low: summary.notes.length
      }
    }
  }

}

module.exports = {
  Telemetry
}
