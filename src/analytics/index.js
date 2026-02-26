const { PosthogAnalytics } = require('./posthog')

const posthog = new PosthogAnalytics()

const ANALYTICS_EVENTS = {
  scan_command_started: 'scan_command_started',
  local_scan_started: 'local_scan_started',
  import_started: 'import_started',
  import_completed: 'import_completed',
  import_failed: 'import_failed',
  help_invoked: 'help_invoked',
  cli_installed: 'cli_installed'
}

// Emit a PostHog event with the given name and payload. The event name must be defined in ANALYTICS_EVENTS.
const track = (eventName, payload = {}) => {
  const posthogEvent = ANALYTICS_EVENTS[eventName]
  if (!posthogEvent) return
  posthog.capture(posthogEvent, payload)
}

const setEnabled = (enabled) => {
  posthog.setEnabled(enabled)
}

module.exports = {
  ANALYTICS_EVENTS,
  track,
  setEnabled
}
