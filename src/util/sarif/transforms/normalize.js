const path = require('node:path')
module.exports = (sarif, dir) => {
  // Normalize findings.
  for (const run of sarif.runs) {
    if (!run.results) continue
    for (const result of run.results) {

      // Find paths in the finding description and make them relative to the scan directory.
      if (result?.message?.text) result.message.text = result.message.text.replace('/app/', '')

      // Make all physical locations for the result relative to the scan directory.
      for (const location of result.locations) {
        if (!location.physicalLocation?.artifactLocation?.uri?.startsWith('/app')) continue
        let file = path.relative('/app', location.physicalLocation.artifactLocation.uri)
        location.physicalLocation.artifactLocation.uri = file
      }

    }
  }
}
