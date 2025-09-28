const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const SARIF = require('../util/sarif')
const runner = require('../util/runner')
module.exports = {
  summary: 'import vulnerabilities',
  args: {
    INPUT: {
      description: 'input SARIF file',
      validate: INPUT => {
        if (!fs.existsSync(path.normalize(INPUT))) throw new Error(`path doesn't exist: ${INPUT}`)
      }
    }
  },
  options: [
    { name: 'ESCALATE', short: 'e', long: 'escalate', type: 'string', description: 'severities to treat as high/error' },
    { name: 'FORMAT', short: 'f', long: 'format', type: 'string', description: 'severity format' },
    { name: 'QUIET', short: 'q', long: 'quiet', type: 'boolean', description: 'suppress stdout logging' }
  ],
  description: `
    Imports vulnerabilities from the input SARIF file given by INPUT argument.
    The SARIF file must have been produced by scanners supported by Radar CLI.

    When quiet mode is selected with the QUIET command-line option, most stdout
    logs are ommitted except for errors that occur with the importing process.

    By default, findings are displayed as high, moderate, and low. This is the
    'security' severity format. Findings can also be displayed as errors, warnings,
    and notes. This is the 'sarif' severity format.

    Exit codes:
         0 - Clean and successful import. No errors, warnings, or notes.
         1 - Bad command, arguments, or options. Import not completed.
        16 - Import aborted due to unexpected error.
  `,
  examples: [
    '$ radar import scan.sarif ' + '(import findings from SARIF file)'.grey,
    '$ radar import -f security scan.sarif ' + '(displays findings as high, moderate, and low)'.grey,
    '$ radar import -f sarif scan.sarif ' + '(displays findings as error, warning, and note)'.grey,
    '$ radar import -e moderate,low scan.sarif ' + '(treat lower severities as high)'.grey,
    '$ radar import -f sarif -e warning,note scan.sarif ' + '(treat lower severities as errors)'.grey
  ],
  run: async (toolbox, args) => {
    const { log, scanners: availableScanners, telemetry } = toolbox

    // Set defaults for args and options.
    args.FORMAT ??= 'security'

    // Normalize and/or rewrite args and options.
    args.INPUT = path.resolve(path.normalize(args.INPUT))

    // Validate args and options.
    if (args.FORMAT !== 'sarif' && args.FORMAT !== 'security') throw new Error('FORMAT must be one of \'sarif\' or \'security\'')
    if (args.ESCALATE) args.ESCALATE.split(',').map(severity => {
      if (args.FORMAT === 'security' && severity !== 'moderate' && severity !== 'low') throw new Error(`Severity to escalate must be 'moderate' or 'low'`)
      if (args.FORMAT === 'sarif' && severity !== 'warning' && severity !== 'note') throw new Error(`Severity to escalate must be 'warning' or 'note'`)
    })

    // Derive scan parameters.
    const escalations = args.ESCALATE?.split(',').map(severity => {
      if (severity === 'moderate') return 'warning'
      if (severity === 'low') return 'note'
      return severity
    })

    // Check that telemetry is enabled.
    if (!args.QUIET && !telemetry.enabled) {
      log(`ERROR: Telemetry not enabled.`)
      log(`Terminating with exit code 16. See 'radar help import' for list of possible exit codes.`)
      return 0x10 // exit code
    }

    // Results include the log and the SARIF findings.
    const results = { log: `Import from "${args.INPUT}"` }
    results.sarif = JSON.parse(fs.readFileSync(args.INPUT, 'utf8'))

    // Read scanner names from the input SARIF.
    const scanners = []
    for (const run of results.sarif.runs) {
      const scanner = run.tool.driver?.properties?.scanner_name ?? run.tool.driver.name
      scanners.push(scanner)
    }

    // Send telemetry: scan started.
    let scanID = undefined
    // TODO: Should pass scanID to the server; not read it from the server.
    try {
      const res = await telemetry.send(`scans/started`, {}, { scanners })
      if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}: ${await res.text()}`)
      const data = await res.json()
      scanID = data.scan_id
    }
    catch (error) {
      log(`ERROR: ${error.message}${error?.cause?.code === 'ECONNREFUSED' ? ': CONNECTION REFUSED' : ''}`)
      log(`Terminating with exit code 16. See 'radar help import' for list of possible exit codes.`)
      return 0x10 // exit code
    }

    // Transform scan findings: treat warnings and notes as errors, and normalize location paths.
    if (escalations) results.sarif = SARIF.transforms.escalate(results.sarif, escalations)

    // Send telemetry: scan results.
    await telemetry.sendSensitive(`scans/:scanID/results`, { scanID }, { findings: results.sarif, log: results.log })

    // Analyze scan results: group findings by severity level.
    const analysis = await telemetry.receiveSensitive(`scans/:scanID/summary`, { scanID })
    if (!analysis?.findingsBySeverity) throw new Error(`Failed to retrieve analysis summary for scan '${scanID}'`)
    const summary = analysis.findingsBySeverity

    // Send telemetry: scan summary.
    await telemetry.send(`scans/:scanID/completed`, { scanID }, summary)

    // Display summarized findings.
    if (!args.QUIET) {
      process.stdout.write('Imported ')
      SARIF.visualizations.display_totals(summary, args.FORMAT, log, telemetry.enabled && scanID)
    }

    // Success.
    return 0 // exit code
  }
}
