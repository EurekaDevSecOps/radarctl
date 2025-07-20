module.exports = (sarif, escalations) => {
  // Treat warnings and notes as errors.
  for (const run of sarif.runs) {
    if (!run.results) continue
    for (const result of run.results) {
      if (escalations.includes(result.level)) {
        result.level = 'error'
        continue
      }

      for (const rule of run.tool.driver.rules) {
        if (rule.id === result.ruleId) {
          if (escalations.includes(rule.defaultConfiguration?.level)) {
            rule.defaultConfiguration.level = 'error'
          }
          break
        }
      }
    }
  }
  return sarif
}
