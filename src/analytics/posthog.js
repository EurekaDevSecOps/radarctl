const crypto = require('node:crypto')
const { PostHog } = require('posthog-node')
const { jwtDecode } = require('jwt-decode')

const pkg = require('../../package.json')

const DEFAULT_HOST = 'https://app.posthog.com'

class PosthogAnalytics {
  #client
  #user
  #identified = false
  #analyticsDisabled = false

  constructor() {
    const apiKey = process.env.POSTHOG_API_KEY
    const host = process.env.POSTHOG_HOST || DEFAULT_HOST

    if (!apiKey) return

    this.#client = new PostHog(apiKey, { host })

    const shutdown = () => { void this.shutdown() }
    process.once('beforeExit', shutdown)
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)

    this.#user = this.#userFromToken(process.env.EUREKA_AGENT_TOKEN)
  }

  capture(event, properties = {}) {
    if (!this.#client || this.#analyticsDisabled) return
    // for local scans, generate a random distinctId 
    const distinctId = this.#user?.sub || (event === 'local_scan_started' ? crypto.randomUUID() : undefined)
    if (!distinctId) return

    // emit a PostHog identify event if we have a user and haven't already identified
    if (this.#user?.sub && !this.#identified) this.#identify(this.#user)

    // emit the PostHog capture event attached with base properties
    this.#client.capture({
      distinctId,
      event,
      properties: this.#withBaseProperties(properties)
    })
  }

  setEnabled(enabled) {
    this.#analyticsDisabled = !enabled
  }

  async shutdown() {
    if (!this.#client) return
    try {
      await this.#client._shutdown(2000)
    } catch (error) {}
  }

  #userFromToken(token) {
    if (!token) return undefined
    try { return jwtDecode(token) } catch (error) {}
    return undefined
  }

  #identify(user) {
    if (!this.#client || !user?.sub) return
    const properties = {}
    if (user.org) properties.organizationId = user.org
    if (user.site_id) properties.siteId = user.site_id
    this.#client.identify({ distinctId: user.sub, properties })
  }

  // attaches every PostHog radar emitted event with base properties
  #withBaseProperties(properties) {
    return {
      ...properties,
      name: pkg.name,
      version: pkg.version,
      node_version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }
}

module.exports = {
  PosthogAnalytics
}
