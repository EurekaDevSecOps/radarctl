const pkg = require('../../package.json')
const { jwtDecode } = require('jwt-decode')
const { ensureInstallationId } = require('./installation_id')
const { getCiProvider } = require('../util/ci')

const DEFAULT_EWA_URL = 'https://bff.eurekadevsecops.com'

class AnalyticsClient {
  #analyticsDisabled = false
  #debug = false
  #log = console.error
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

    if (this.#debug) this.#log(`[analytics] POST ${url} (${event})`)

    const request = fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        if (!response.ok && this.#debug) {
          let body = ''
          try {
            body = await response.text()
          } catch {}
          this.#log(`[analytics] request failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`)
        }
      })
      .catch((error) => {
        if (this.#debug) this.#log(`[analytics] network error: ${error.message}`)
      })

    this.#pendingRequests.add(request)
    request.finally(() => {
      this.#pendingRequests.delete(request)
    })
  }

  setEnabled (enabled) {
    this.#analyticsDisabled = !enabled
  }

  setDebug (enabled) {
    this.#debug = Boolean(enabled)
  }

  setLogger (logger) {
    this.#log = typeof logger === 'function' ? logger : console.error
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
    const { local = false, ...eventProperties } = properties
    const payload = {
      event,
      radarInstallationId: ensureInstallationId(),
      local,
      properties: {
        local,
        name: pkg.name,
        version: pkg.version,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        ...eventProperties
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
