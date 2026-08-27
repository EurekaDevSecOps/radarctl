const displaySectionHeading = require('./display_section_heading')

const severities = ['critical', 'high', 'moderate', 'low']

function formatBySeverity (value, severity) {
  const label = `${value}`
  if (severity === 'critical' || severity === 'high') return label.bold.red
  if (severity === 'moderate') return label.bold.yellow
  return label.bold
}

module.exports = (summary, log) => {
  displaySectionHeading('Attack Scenarios', log)

  for (const severity of severities) {
    for (const scenario of summary[severity]) {
      const score = scenario.exploitabilityScore === null ? 'unscored' : scenario.exploitabilityScore
      log(`${formatBySeverity(severity, severity)} attack scenario: exploitability ${formatBySeverity(score, severity)}: ${scenario.name}\n`)
    }
  }
}
