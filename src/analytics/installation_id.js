const crypto = require('node:crypto')
const fs = require('node:fs')
const { INSTALLATION_ID_PATH, RADAR_DIR } = require('./constants')
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isValidInstallationId = (value) => UUID_PATTERN.test(value)

const readInstallationId = () => {
  try {
    const installationId = fs.readFileSync(INSTALLATION_ID_PATH, 'utf8').trim()
    return isValidInstallationId(installationId) ? installationId : null
  } catch (error) {
    return null
  }
}

const ensureInstallationId = () => {
  const existingInstallationId = readInstallationId()
  if (existingInstallationId) return existingInstallationId

  const installationId = crypto.randomUUID()

  try {
    fs.mkdirSync(RADAR_DIR, { recursive: true })
    fs.writeFileSync(INSTALLATION_ID_PATH, `${installationId}\n`, 'utf8')
  } catch (error) {}

  return installationId
}

module.exports = {
  ensureInstallationId,
  isValidInstallationId,
  readInstallationId
}
