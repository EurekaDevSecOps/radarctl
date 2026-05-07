const pkg = require('../../package.json')
const { jwtDecode } = require('jwt-decode')
const { ensureInstallationId } = require('./installation_id')
const { getCiProvider } = require('../util/ci')

const DEFAULT_EWA_URL = 'https://bff.eurekadevsecops.com'

class AnalyticsClient {
  #analyticsDisabled = false
  #pendingRequests = new Set()

  #EUREKA_AGENT_TOKEN = process.env.EUREKA_AGENT_TOKEN
  #USER_AGENT = `RadarCLI/${pkg.version} (${pkg.name}@${pkg.version}; ${process?.platform}-${process?.arch}; ${process?.release?.name}-${process?.version})`
  #EWA_URL

  constructor () {
    this.enabled = true
    const override = process.env.EUREKA_EWA_URL?.replace(/\/$/, '')
    this.#EWA_URL = override || this.#claims(this.#EUREKA_AGENT_TOKEN).aud?.replace(/\/$/, '') || DEFAULT_EWA_URL
  }

  capture (event, properties = {}) {
    if (!this.enabled || this.#analyticsDisabled || !this.#EWA_URL) return

    const payload = this.#buildPayload(event, properties)
    const url = `${this.#EWA_URL}/analytics`
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': this.#USER_AGENT,
      Accept: 'application/json'
    }
    if (this.#EUREKA_AGENT_TOKEN) headers.Authorization = `Bearer ${this.#EUREKA_AGENT_TOKEN}`

    const request = fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
      .catch(() => {})

    this.#pendingRequests.add(request)
    request.finally(() => {
      this.#pendingRequests.delete(request)
    })
  }

  setEnabled (enabled) {
    this.#analyticsDisabled = !enabled
  }

  async flush () {
    if (!this.#pendingRequests.size) return
    await Promise.allSettled([...this.#pendingRequests])
  }

  #claims (jwt) {
    let claims
    try { claims = jwtDecode(jwt) } catch (error) {}
    return claims ?? {}
  }

  #buildPayload (event, properties) {
    const ciProvider = getCiProvider()
    const payload = {
      event,
      radarInstallationId: ensureInstallationId(),
      properties: {
        name: pkg.name,
        version: pkg.version,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        ...properties
      }
    }

    if (ciProvider !== 'default') {
      payload.ci = true
      payload.ci_provider = ciProvider
    }

    return payload
  }
}

module.exports = {
  AnalyticsClient
}
