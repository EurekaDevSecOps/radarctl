const path = require('node:path')
module.exports = (sarif, dir) => {
  // Normalize findings.
  for (const run of sarif.runs) {
    if (!run.results) continue
    for (const result of run.results) {
      if (!result.locations) continue
      for (const location of result.locations) {
        if (!location.physicalLocation?.artifactLocation?.uri?.startsWith('/app')) continue
        let file = path.relative('/app', location.physicalLocation.artifactLocation.uri)
        file = path.join(dir, file)
        file = path.relative(process.cwd(), file)
        location.physicalLocation.artifactLocation.uri = file
      }
    }
  }
}
