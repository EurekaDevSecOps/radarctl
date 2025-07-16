const levels = require('./levels')
module.exports = async (summary, format, log) => {
  for (const finding of summary.notes) log(`${finding.artifact.name}:${finding.artifact.line}: ` + `${levels[format].single.note}`.bold + `${levels[format].single.suffix}:` + ` ${finding.tool}:` + ` ${finding.message}\n`)
  for (const finding of summary.warnings) log(`${finding.artifact.name}:${finding.artifact.line}: ` + `${levels[format].single.warning}`.bold.yellow + `${levels[format].single.suffix}:` + ` ${finding.tool}:` + ` ${finding.message}\n`)
  for (const finding of summary.errors) log(`${finding.artifact.name}:${finding.artifact.line}: ` + `${levels[format].single.error}`.bold.red + `${levels[format].single.suffix}:` + ` ${finding.tool}:` + ` ${finding.message}\n`)
}
