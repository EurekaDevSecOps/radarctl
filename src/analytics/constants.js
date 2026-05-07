const path = require('node:path')
const { getRadarDataDir } = require('../util/app_data')

const RADAR_DIR = getRadarDataDir()
const INSTALLATION_ID_PATH = path.join(RADAR_DIR, 'id')

module.exports = {
  RADAR_DIR,
  INSTALLATION_ID_PATH
}
