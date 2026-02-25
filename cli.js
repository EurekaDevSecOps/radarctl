#!/usr/bin/env node

require('dotenv').config({ quiet: true })
const path = require('node:path')
const analytics = require(path.join(__dirname, 'src', 'analytics'))
const commands = require(path.join(__dirname, 'src', 'commands'))
const cli = require(path.join(__dirname, 'src')).build()

const argv = process.argv.slice(2)

const getHelpInvocation = (argv) => {
  const command = argv[0]?.endsWith(':') ? argv[0].slice(0, -1) : argv[0]
  const hasHelpFlag = argv.includes('-h') || argv.includes('--help')
  const isHelpCommand = argv.length === 0 || command === 'help'
  const isHelpFlagForKnownCommand = !!command && !!commands[command] && hasHelpFlag

  if (!isHelpCommand && !isHelpFlagForKnownCommand) return null

  return { flags: argv }
}

const helpInvocation = getHelpInvocation(argv)
if (helpInvocation) {
  const analyticsDisabled = argv.includes('--disable-analytics') || argv.includes('-noa')
  analytics.setEnabled(!analyticsDisabled)
  analytics.track('help_command_invoked', helpInvocation)
}

// Check for updates (not in browsers).
cli.checkForUpdates()

// Export the configured CLI module.
module.exports = cli

// Run the command given on the command line.
cli.run().then((exitCode) => { process.exitCode = exitCode ?? 0 })
