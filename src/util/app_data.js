const os = require('node:os')
const path = require('node:path')

const getRadarDataDir = () => path.join(os.homedir(), '.radar')

module.exports = {
  getRadarDataDir
}
