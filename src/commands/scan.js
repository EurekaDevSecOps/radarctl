const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const SARIF = require('../util/sarif')
const runner = require('../util/runner')
module.exports = {
  summary: 'scan for vulnerabilities',
  args: {
    TARGET: {
      description: 'target to scan',
      optional: true,
      validate: TARGET => {
        if (!fs.existsSync(path.normalize(TARGET))) throw new Error(`path doesn't exist: ${TARGET}`)
      }
    }
  },
  options: [
    { name: 'CATEGORIES', short: 'c', long: 'categories', type: 'string', description: 'list of scanner categories' },
    { name: 'ESCALATE', short: 'e', long: 'escalate', type: 'string', description: 'severities to treat as high/error' },
    { name: 'FORMAT', short: 'f', long: 'format', type: 'string', description: 'severity format' },
    { name: 'OUTPUT', short: 'o', long: 'output', type: 'string', description: 'output SARIF file' },
    { name: 'QUIET', short: 'q', long: 'quiet', type: 'boolean', description: 'suppress stdout logging' },
    { name: 'SCANNERS', short: 's', long: 'scanners', type: 'string', description: 'list of scanners to use' }
  ],
  description: `
    Scans a target for vulnerabilities. Defaults to displaying findings on stdout.
    If TARGET argument is ommitted, it defaults to current working directory.

    When quiet mode is selected with the QUIET command-line option, most stdout
    logs are ommitted except for errors that occur with the scanning process. To
    suppress SARIF output on stdout, use the OUTPUT option to save findings into
    a file on disk.

    Select which scanners to use with the SCANNERS and CATEGORIES options. If
    neither option is specified, all scanners are run.

    If you want to run all scanners of a certain type, such as SAST, SCA, or DAST,
    use the CATEGORIES option. All scanners are classified into categories and
    some may belong to multiple categories. You could run all available SAST 
    scanners, for example, by passing in SAST as the value for the CATEGORIES
    option. Values are case-insensitive. Multiple values should be comma-separated.
    To select all categories, use the value "all" for CATEGORIES. Defaults to 'all'.

    If you want to limit your scan to a subset of available scanners, provide a 
    specific list of scanners, comma-separated, in the SCANNERS option. Scanner 
    names passed into the SCANNERS option should match the scanner names returned 
    by the "scanners" command. To select all scanners across selected categories,
    use the value 'all' for SCANNERS. Defaults to 'all'.

    You can specify both SCANNERS and CATEGORIES at the same time. This will run
    only those scanners that match both options. For example, if you specify the
    SCA category and 'all' for SCANNERS then all scanners in the SCA category will 
    run. If you specify 'SAST' and 'opengrep,depscan' then only opengrep will run
    (because depscan is an SCA scanner, not a SAST one).

    By default, findings are displayed as high, moderate, and low. This is the
    'security' severity format. Findings can also be displayed as errors, warnings,
    and notes. This is the 'sarif' severity format.

    Exit codes:
         0 - Clean and successful scan. No errors, warnings, or notes.
         1 - Bad command, arguments, or options. Scan not completed.
      8-15 - Scan completed with errors, warnings, or notes.
         9 - Scan completed with errors (no warnings or notes).
        10 - Scan completed with warnings (no errors or notes).
        11 - Scan completed with errors and warnings (no notes).
        12 - Scan completed with notes (no errors or warnings).
        13 - Scan completed with errors and notes (no warnings).
        14 - Scan completed with warnings and notes (no errors).
        15 - Scan completed with errors, warnings, and notes.
     >= 16 - Scan aborted due to unexpected error.
  `,
  examples: [
    '$ radar scan ' + '(scan current working directory)'.grey,
    '$ radar scan . ' + '(scan current working directory)'.grey,
    '$ radar scan /my/repo/dir ' + '(scan target directory)'.grey,
    '$ radar scan --output=scan.sarif ' + '(save findings in a file)'.grey,
    '$ radar scan -o scan.sarif /my/repo/dir ' + '(short versions of options)'.grey,
    '$ radar scan -s depscan,opengrep ' + '(use only given scanners)'.grey,
    '$ radar scan -c sca,sast ' + '(use all scanners from given categories)'.grey,
    '$ radar scan -c sca,sast -s all ' + '(use all scanners from given categories)'.grey,
    '$ radar scan -c sast -s opengrep ' + '(use only the opengrep scanner)'.grey,
    '$ radar scan -f security ' + '(displays findings as high, moderate, and low)'.grey,
    '$ radar scan -f sarif ' + '(displays findings as error, warning, and note)'.grey,
    '$ radar scan -e moderate,low ' + '(treat lower severities as high)'.grey,
    '$ radar scan -f sarif -e warning,note ' + '(treat lower severities as errors)'.grey
  ],
  run: async (toolbox, args) => {
    const { log, scanners: availableScanners, categories: availableCategories, telemetry } = toolbox

    // Set defaults for args and options.
    args.TARGET ??= process.cwd()
    args.FORMAT ??= 'security'
    args.CATEGORIES ??= 'all'
    args.SCANNERS ??= 'all'

    // Normalize and/or rewrite args and options.
    args.TARGET = path.resolve(path.normalize(args.TARGET))
    if (args.CATEGORIES.split(',').includes('all')) args.CATEGORIES = availableCategories.join(',')
    if (args.SCANNERS.split(',').includes('all')) args.SCANNERS = availableScanners.map(s => s.name).join(',')

    // Validate args and options.
    if (!fs.existsSync(args.TARGET)) throw new Error(`Path not found: ${args.TARGET}`)
    if (args.FORMAT !== 'sarif' && args.FORMAT !== 'security') throw new Error('FORMAT must be one of \'sarif\' or \'security\'')
    if (args.SCANNERS) {
      const unknownScanners = args.SCANNERS.split(',').filter(name => !availableScanners.find(s => s.name === name))
      if (unknownScanners.length > 1) throw new Error(`Unknown scanners: ${unknownScanners.join(', ')}`)
      else if (unknownScanners.length === 1) throw new Error(`Unknown scanner: ${unknownScanners[0]}`)
    }
    if (args.ESCALATE) args.ESCALATE.split(',').map(severity => {
      if (args.FORMAT === 'security' && severity !== 'moderate' && severity !== 'low') throw new Error(`Severity to escalate must be 'moderate' or 'low'`)
      if (args.FORMAT === 'sarif' && severity !== 'warning' && severity !== 'note') throw new Error(`Severity to escalate must be 'warning' or 'note'`)
    })

    // Derive scan parameters.
    const target = args.TARGET // target to scan
    const categories = args.CATEGORIES.toUpperCase().split(',').filter(c => availableCategories.includes(c))
    const scanners = availableScanners
        .filter(s => args.SCANNERS.split(',').includes(s.name))
        .filter(s => categories.filter(c => s.categories.includes(c)).length > 0)
    const escalations = args.ESCALATE?.split(',').map(severity => {
      if (severity === 'moderate') return 'warning'
      if (severity === 'low') return 'note'
      return severity
    })
    const assets = path.join(__dirname, '..', '..', 'scanners') // scanner assets
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-')) // temporary output directory
    const outfile = args.OUTPUT ? path.resolve(args.OUTPUT) : undefined // output file, if any

    // Validate scan parameters.
    if (!categories.length) throw new Error(`CATEGORIES must be one or more of '${availableCategories.join("', '")}', or 'all'`)
    if (!scanners.length) throw new Error('No available scanners selected.')

    // Send telemetry: scan started.
    let scanID = undefined
    const isTelemetryEnabled = telemetry.enabled()
    if (isTelemetryEnabled) {
      // TODO: Should pass scanID to the server; not read it from the server.
      const response = await telemetry.send(`scans/started`, {}, { scanners: scanners.map((s) => s.name) })
      const data = await response.json()
      scanID = data.scan_id
    }

    // Run scanners.
    log(`Running ${scanners.length} of ${availableScanners.length} scanners:`)
    let results = { /* log, sarif */ }
    try {
      // This will run all scanners and return the combined stdout log and SARIF object.
      results = await runner.run({ scanners, target, assets, outdir: tmpdir, quiet: args.QUIET, log })
    }
    catch (error) {
      log(`\n${error}`)
      if (!args.QUIET) log('Scan NOT completed!')
      if (telemetry.enabled()) telemetry.send(`scans/:scanID/failed`, { scanID })
      fs.rmSync(tmpdir, { recursive: true, force: true }) // Clean up.
      return 0x10 // exit code
    }

    // Transform scan findings: treat warnings and notes as errors, and normalize location paths.
    if (escalations) results.sarif = SARIF.transforms.escalate(results.sarif, escalations)
    SARIF.transforms.normalize(results.sarif, target)

    // Write findings to the destination SARIF file.
    if (outfile) fs.writeFileSync(outfile, JSON.stringify(results.sarif))

    // Analyze scan findings: count findings by severity level.
    const summary = await SARIF.analysis.summarize(results.sarif, target)

    // Send telemetry.
    if (isTelemetryEnabled && scanID) {
      telemetry.send(`scans/:scanID/completed`, { scanID }, summary)
      telemetry.sendSensitive(`scans/:scanID/results`, { scanID }, { findings: results.sarif, log: results.log })
    }

    // Display summarized findings.
    if (!args.QUIET) {
      log()
      SARIF.visualizations.display_findings(summary, args.FORMAT, log)
      if (outfile) log(`Findings exported to ${outfile}`)
      SARIF.visualizations.display_totals(summary, args.FORMAT, log)
    }

    // Determine the correct exit code.
    let exitCode = 0
    if (!summary.errors.length && !summary.warnings.length && !summary.notes.length) {
      exitCode = 0
    } else {
      exitCode = 0x8
      if (summary.errors.length > 0) exitCode |= 0x1
      if (summary.warnings.length > 0) exitCode |= 0x2
      if (summary.notes.length > 0) exitCode |= 0x4
    }

    // Clean up.
    fs.rmSync(tmpdir, { recursive: true, force: true })

    return exitCode
  }
}
