const normalizeLevel = (level) => {
  if (level === 'error' || level === 'warning' || level === 'note') return level
  if (level === 'info' || level === 'none') return 'note'
  return null
}

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

      const normalizedResultLevel = normalizeLevel(result.level)
      if (normalizedResultLevel) {
        finding.level = normalizedResultLevel
        summary[`${finding.level}s`].push(finding)
        continue
      }

      if (Array.isArray(run?.tool?.driver?.rules)) {
        for (const rule of run.tool.driver.rules) {
          if (rule.id === result.ruleId) {
            const normalizedRuleLevel = normalizeLevel(rule?.defaultConfiguration?.level ?? 'error')
            if (normalizedRuleLevel) {
              finding.level = normalizedRuleLevel
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
