const path = require('node:path')
module.exports = (sarif, dir, git, root) => {
  // Normalize findings.
  for (const run of sarif.runs) {

    // Subfolder within the repo root where the scan took place:
    const subfolder = path.relative(root, dir)

    // Record the source repo location and the relative target subfolder within the repo.
    run.properties = {
      repository: {
        type: 'git',
        url: git.repo.url.https
      }
    }
    if (subfolder) run.properties.includedirs = [ `${subfolder}` ]

    // Make all physical locations for the result relative to the repo root directory.
    // (or if the root is not available then to the scan directory)
    if (!run.results) continue
    for (const result of run.results) {
      for (const location of result.locations) {
        // Pattern matches managed scanner temporary job directories:
        // Format: /app/jobs/{uuid}/repo-{timestamp}/ or jobs/{uuid}/repo-{timestamp}/
        // Example: /app/jobs/830f53a2-5f0c-4565-a262-607dfcd4d5e1/repo-1771653645/
        const MANAGED_SCANNER_JOB_PREFIX = /^(\/app\/)?jobs\/[a-f0-9-]+\/repo-\d+\//
        
        if (location.physicalLocation?.artifactLocation?.uri?.match(MANAGED_SCANNER_JOB_PREFIX)) {
          let file = location.physicalLocation.artifactLocation.uri.replace(MANAGED_SCANNER_JOB_PREFIX, '')
          if (subfolder) file = path.join(subfolder, file)
          if (result?.message?.text) result.message.text = result.message.text.replace(location.physicalLocation.artifactLocation.uri, file)
          location.physicalLocation.artifactLocation.uri = file
        }
        else if (location.physicalLocation?.artifactLocation?.uri?.startsWith('/app')) {
          let file = path.join(subfolder, path.relative('/app', location.physicalLocation.artifactLocation.uri))
          if (result?.message?.text) result.message.text = result.message.text.replace(location.physicalLocation.artifactLocation.uri, file)
          location.physicalLocation.artifactLocation.uri = file
        }
        else if (location.physicalLocation?.artifactLocation?.uri?.startsWith('/')) {
          let file = path.join(subfolder, path.relative('/', location.physicalLocation.artifactLocation.uri))
          if (result?.message?.text) result.message.text = result.message.text.replace(location.physicalLocation.artifactLocation.uri, file)
          location.physicalLocation.artifactLocation.uri = file
        }
      }

    }
  }
}
