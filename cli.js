#!/usr/bin/env node

// require('dotenv').config()
const path = require('node:path')
const plugins = { scanners: require(path.join(__dirname, 'src', 'plugins', 'scanners')) }
const cli = require(path.join(__dirname, 'src')).build({ plugins })

// Check for updates (not in browsers).
cli.checkForUpdates()

// Export the configured CLI module.
module.exports = cli

// Run the command given on the command line.
cli.run().then((exitCode) => { process.exitCode = exitCode ?? 0 })
