const { AnalyticsClient } = require('./client')
const { ensureInstallationId } = require('./installation_id')

const analyticsClient = new AnalyticsClient()

const EVENTS = {
  radar_scan_started: 'radar_scan_started',
  radar_scan_completed: 'radar_scan_completed',
  radar_scan_failed: 'radar_scan_failed',
  radar_import_started: 'radar_import_started',
  radar_import_completed: 'radar_import_completed',
  radar_import_failed: 'radar_import_failed',
  radar_help_invoked: 'radar_help_invoked'
}

// Emit an analytics event with the given name and payload. The event name must be defined in EVENTS.
const track = (eventName, payload = {}) => {
  const analyticsEvent = EVENTS[eventName]
  if (!analyticsEvent) return
  analyticsClient.capture(analyticsEvent, payload)
}

const setEnabled = (enabled) => {
  analyticsClient.setEnabled(enabled)
}

const setDebug = (enabled) => {
  analyticsClient.setDebug(enabled)
}

const setLogger = (logger) => {
  analyticsClient.setLogger(logger)
}

const flush = async () => {
  await analyticsClient.flush()
}

module.exports = {
  EVENTS,
  ensureInstallationId,
  flush,
  setDebug,
  setLogger,
  track,
  setEnabled
}
