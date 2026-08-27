const { hasAttackScenariosAtThreshold, hasVulnerabilitiesAtThreshold } = require('./thresholds')

module.exports = ({ policy, vulnerabilitySummary, vulnerabilityThreshold, scenarioSummary, scenarioThreshold }) => {
  const vulnerabilityThresholdMet = policy !== 'scenarios' && hasVulnerabilitiesAtThreshold(vulnerabilitySummary, vulnerabilityThreshold)
  const scenarioThresholdMet = policy !== 'vulnerability' && hasAttackScenariosAtThreshold(scenarioSummary, scenarioThreshold)
  return vulnerabilityThresholdMet || scenarioThresholdMet ? 0x8 : 0
}
