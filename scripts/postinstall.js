const path = require('node:path')
require('dotenv').config({ quiet: true })

const analytics = require(path.join(__dirname, '..', 'src', 'analytics'))

const parseNpmCommand = () => {
  const npmCommand = process.env.npm_command
  if (npmCommand) {
    if (npmCommand === 'ci') return 'ci'
    if (npmCommand === 'update') return 'update'
    if (npmCommand === 'install') return 'install'
    return npmCommand
  }

  // fallback to "install" if npm_command is not set
  return 'install'
}

analytics.setEnabled(true)
analytics.track('cli_installed', {
  install_command: parseNpmCommand()
})
