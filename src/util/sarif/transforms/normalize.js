const path = require('node:path')
module.exports = (sarif, dir, git, root) => {
  // Normalize findings.
  for (const run of sarif.runs) {

    // Record the source repo location and the relative target subfolder within the repo.
    run.originalUriBaseIds = {
     "SOURCE": {
        "uri": git.repo.url.https,
        "description": "Source origin for the target being scanned (ie. git repo URL)."
     },
      "TARGET": {
        "uri": `${path.relative(root, dir)}`,
        "uriBaseId": "SOURCE",
        "description": "Scan target (subfolder) within the source repo or folder."
      }
    }

    // Make all physical locations for the result relative to the scan directory.
    if (!run.results) continue
    for (const result of run.results) {
      for (const location of result.locations) {
        if (location.physicalLocation?.artifactLocation?.uri?.startsWith('/app')) {
          let file = path.relative('/app', location.physicalLocation.artifactLocation.uri)
          if (result?.message?.text) result.message.text = result.message.text.replace(location.physicalLocation.artifactLocation.uri, file)
          location.physicalLocation.artifactLocation.uri = file
        }
        else if (location.physicalLocation?.artifactLocation?.uri?.startsWith('/')) {
          let file = path.relative('/', location.physicalLocation.artifactLocation.uri)
          if (result?.message?.text) result.message.text = result.message.text.replace(location.physicalLocation.artifactLocation.uri, file)
          location.physicalLocation.artifactLocation.uri = file
        }
      }

    }
  }
}
