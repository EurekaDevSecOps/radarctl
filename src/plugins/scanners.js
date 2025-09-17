const fs = require('node:fs')
const path = require('node:path')
const TOML = require('smol-toml')

function enumerate(dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const candidate = path.join(dir, entry.name, 'about.toml')
      try {
        const stat = fs.statSync(candidate)
        if (stat.isFile()) {
          files.push(candidate)
        }
      } catch {
        // no about.toml in this subfolder — ignore
      }
    }
  }
  return files
}

function parseTOML(filePath) {
  const text = fs.readFileSync(filePath, "utf8")
  try {
    return TOML.parse(text)
  } catch (error) {
    const rel = path.relative(process.cwd(), filePath)
    throw new Error(`Failed to parse TOML at ${rel}: ${error.message}`)
  }
}

function readConfig(dir) {
  const scanners = []
  const files = enumerate(dir)
  for (const file of files) {
    const scanner = parseTOML(file)
    scanners.push(scanner)
  }
  return { scanners }
}

const config = readConfig(path.join(__dirname, '..', '..', 'scanners'))
const categories = Array.from(new Set(config.scanners.flatMap(scanner => scanner.categories)))

module.exports = {
  toolbox: {
    scanners: config.scanners,
    categories
  }
}
