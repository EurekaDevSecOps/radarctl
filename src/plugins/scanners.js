const fs = require('node:fs')
const path = require('node:path')
const TOML = require('smol-toml')

const data = fs.readFileSync(path.join(__dirname, '..', '..', 'scanners', 'scanners.toml'), 'utf8')
const config = TOML.parse(data)

module.exports = {
  toolbox: {
    scanners: config.scanners
  }
}
