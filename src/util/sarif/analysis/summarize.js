const path = require('node:path')
module.exports = (sarif, dir) => {
  // Summarize findings by severity level.
  const summary = { errors: [], warnings: [], notes: [] }
  for (const run of sarif.runs) {
    if (!run.results) continue
    for (const result of run.results) {
      const finding = {
        tool: run.tool.driver.name,
        message: result.message.text,
        artifact: {
          name: result.locations[0].physicalLocation.artifactLocation.uri,
          line: result.locations[0].physicalLocation.region.startLine
        }
      }

      if (result.level === 'error' || result.level === 'warning' || result.level === 'note') {
        finding.level = result.level
        summary[`${finding.level}s`].push(finding)
        continue
      }

      if (Array.isArray(run?.tool?.driver?.rules)) {
        for (const rule of run.tool.driver.rules) {
          if (rule.id === result.ruleId) {
            const level = rule?.defaultConfiguration?.level ?? 'error'
            if (level === 'error' || level === 'warning' || level === 'note') {
              finding.level = level
              summary[`${finding.level}s`].push(finding)
            }
            break
          }
        }
      }
    }
  }
  return summary
}
