const displayFindings = require('./sarif/visualizations/display_findings')
const displayTotals = require('./sarif/visualizations/display_totals')
const displayAttackScenarios = require('./display_attack_scenarios')
const displayAttackScenarioTotals = require('./display_attack_scenario_totals')
const displaySectionHeading = require('./display_section_heading')

module.exports = ({ summary, scenarioSummary, useAttackScenarios, outfile, format, baselined, scanURL, log }) => {
  const hasVulnerabilities = summary.errors.length > 0 || summary.warnings.length > 0 || summary.notes.length > 0
  const hasAttackScenarios = useAttackScenarios && Object.values(scenarioSummary).some((scenarios) => scenarios.length > 0)

  if (hasVulnerabilities) {
    log()
    displaySectionHeading('Vulnerabilities', log)
    displayFindings(summary, format, log)
  }
  if (outfile) log(`Findings exported to ${outfile}`)
  if (hasAttackScenarios) {
    log()
    displayAttackScenarios(scenarioSummary, log)
  }
  log()
  displayTotals(summary, format, log, baselined)
  if (useAttackScenarios) displayAttackScenarioTotals(scenarioSummary, log)
  if (scanURL) {
    log()
    log(`View scan findings in the Eureka dashboard: ${scanURL}`)
  }
}
