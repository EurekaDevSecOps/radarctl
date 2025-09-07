const levels = require('../../localization/levels')
module.exports = async (summary, format, log, baselined) => {
  const total = summary.errors.length + summary.warnings.length + summary.notes.length
  log(`${total} ` + `${baselined ? 'new ' : ''}`.bold + `${total === 1 ? levels[format].total.issue : levels[format].total.issues}: ${summary.errors.length} ` + `${levels[format].total.error}`.red.bold + `, ${summary.warnings.length} ` + `${levels[format].total.warning}`.yellow.bold + `, ${summary.notes.length} ` + `${levels[format].total.note}` + '.')
}
