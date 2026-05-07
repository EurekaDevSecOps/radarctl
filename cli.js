#!/usr/bin/env node

const path = require('node:path')
const analytics = require(path.join(__dirname, 'src', 'analytics'))
const commands = require(path.join(__dirname, 'src', 'commands'))
const cli = require(path.join(__dirname, 'src')).build()

const normalizeArgv = (argv) => {
  if (argv[1] === 'help' && commands[argv[0]]) {
    return [argv[0], '--help', ...argv.slice(2)]
  }

  return argv
}

const argv = normalizeArgv(process.argv.slice(2))
const analyticsDisabled = argv.includes('--disable-analytics') || argv.includes('-noa')

if (!analyticsDisabled) analytics.ensureInstallationId()

const getHelpInvocation = (argv) => {
  const command = argv[0]?.endsWith(':') ? argv[0].slice(0, -1) : argv[0]
  const hasHelpFlag = argv.includes('-h') || argv.includes('--help')
  const isHelpCommand = argv.length === 0 || command === 'help'
  const isHelpFlagForKnownCommand = !!command && !!commands[command] && hasHelpFlag

  if (!isHelpCommand && !isHelpFlagForKnownCommand) return null

  return {
    flags: Object.fromEntries(argv.map((value, index) => [String(index), value]))
  }
}

const helpInvocation = getHelpInvocation(argv)
if (helpInvocation) {
  analytics.setEnabled(!analyticsDisabled)
  analytics.track(analytics.EVENTS.radar_help_invoked, helpInvocation)
}

// Check for updates (not in browsers).
cli.checkForUpdates()

// Export the configured CLI module.
module.exports = cli

// Run the command given on the command line.
process.argv = [process.argv[0], process.argv[1], ...argv]

cli.run()
  .then(async (exitCode) => {
    await analytics.flush()
    process.exitCode = exitCode ?? 0
  })
