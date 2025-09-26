module.exports = {
  summary: 'display available scanners',
  description: `
    Displays available scanners.
  `,
  examples: [
    '$ radar scanners'
  ],
  run: async (toolbox, args) => {
    const { log, scanners } = toolbox
    for (const scanner of scanners) {
      log(`${scanner.name}: ${scanner.title} [${scanner.categories.join()}] - ${scanner.default ? '(default) ' : ''}${scanner.description}`)
    }
  }
}
