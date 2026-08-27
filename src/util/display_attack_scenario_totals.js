module.exports = (summary, log) => {
  const counts = Object.fromEntries(Object.entries(summary).map(([severity, scenarios]) => [severity, scenarios.length]))
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const critical = `${counts.critical} ${'critical'.red.bold}`
  const high = `${counts.high} ${'high'.red.bold}`
  const moderate = `${counts.moderate} ${'moderate'.yellow.bold}`
  const low = `${counts.low} low`
  log(`${total} attack scenario${total === 1 ? '' : 's'} discovered: ${critical}, ${high}, ${moderate}, ${low}.`)
}
