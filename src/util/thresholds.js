function isError (threshold) {
  return isWarning(threshold) || threshold === 'high' || threshold === 'error'
}

function isWarning (threshold) {
  return isNote(threshold) || threshold === 'moderate' || threshold === 'warning'
}

function isNote (threshold) {
  return threshold === 'low' || threshold === 'note'
}

function hasVulnerabilitiesAtThreshold (summary, threshold) {
  if (!summary.errors.length && !summary.warnings.length && !summary.notes.length) return false
  if (!threshold) return true

  if (isError(threshold) && summary.errors.length > 0) return true
  if (isWarning(threshold) && summary.warnings.length > 0) return true
  if (isNote(threshold) && summary.notes.length > 0) return true
  return false
}

function hasAttackScenariosAtThreshold (summary, threshold) {
  if (summary.critical.length > 0) return true
  if (threshold === 'critical') return false
  if (summary.high.length > 0) return true
  if (threshold === 'high') return false
  if (summary.moderate.length > 0) return true
  if (threshold === 'moderate') return false
  return summary.low.length > 0
}

module.exports = {
  hasAttackScenariosAtThreshold,
  hasVulnerabilitiesAtThreshold
}
