#!/usr/bin/env node

const fs = require('node:fs/promises')

function usage () {
  const cmd = process.argv[1] ? `node ${process.argv[1].split(/[\\/]/).pop()}` : 'node normalize.js'
  console.error(`Usage: ${cmd} /full/path/to/input.sarif.json`)
}

function normalizeUri (uri) {
  if (typeof uri !== 'string') return uri
  if (!uri.startsWith('app/')) return uri
  return uri.slice('app/'.length)
}

function normalizeResults (results) {
  if (!Array.isArray(results)) return

  for (const result of results) {
    if (!Array.isArray(result?.locations)) continue

    for (const location of result.locations) {
      const artifactLocation = location?.physicalLocation?.artifactLocation
      if (!artifactLocation || typeof artifactLocation !== 'object') continue

      if (Object.prototype.hasOwnProperty.call(artifactLocation, 'uri')) {
        artifactLocation.uri = normalizeUri(artifactLocation.uri)
      }
    }
  }
}

async function main () {
  const filePath = process.argv[2]
  if (!filePath) {
    usage()
    process.exitCode = 2
    return
  }

  const raw = await fs.readFile(filePath, 'utf8')
  const sarif = JSON.parse(raw)

  if (!Array.isArray(sarif?.runs)) {
    throw new Error('Invalid SARIF: expected top-level "runs" array')
  }

  for (const run of sarif.runs) {
    // SARIF standard: runs[].results[].locations[].physicalLocation.artifactLocation.uri
    normalizeResults(run?.results)

    // Some producers incorrectly nest results under `runs[].tool.results`.
    normalizeResults(run?.tool?.results)
  }

  await fs.writeFile(filePath, `${JSON.stringify(sarif, null, 2)}\n`, 'utf8')
}

main().catch((err) => {
  console.error(err?.stack || String(err))
  process.exitCode = 1
})
