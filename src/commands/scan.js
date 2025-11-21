const crypto = require('node:crypto')
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
    { name: 'DEBUG', short: 'd', long: 'debug', type: 'boolean', description: 'log detailed debug info to stdout' },
    { name: 'ESCALATE', short: 'e', long: 'escalate', type: 'string', description: 'severities to treat as high/error' },
    { name: 'FORMAT', short: 'f', long: 'format', type: 'string', description: 'severity format' },
    { name: 'LOCAL', short: 'l', long: 'local', type: 'boolean', description: 'local scan (no upload of findings to Eureka)' },
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
    neither option is specified, all default scanners are run. You can see which
    scanners are marked as defaults with the 'radar scanners' command.

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
    use the value 'all' for SCANNERS.

    You can specify both SCANNERS and CATEGORIES at the same time. This will run
    only those scanners that match both options. For example, if you specify the
    SCA category and 'all' for SCANNERS then all scanners in the SCA category will 
    run. If you specify 'SAST' and 'opengrep,depscan' then only opengrep will run
    (because depscan is an SCA scanner, not a SAST one).

    By default, findings are displayed as high, moderate, and low. This is the
    'security' severity format. Findings can also be displayed as errors, warnings,
    and notes. This is the 'sarif' severity format.

    Runs entirely on your machine — by default, Radar CLI doesn’t upload any findings.
    Your vulnerabilities stay local and private. To upload results to Eureka ASPM,
    provide your API credentials via two environment variables: 'EUREKA_AGENT_TOKEN'
    (your API token) and 'EUREKA_PROFILE' (your profile ID). When these are set, Radar CLI
    automatically uploads results after each scan — letting you view your full scan 
    history and all findings in the Eureka ASPM Dashboard. To prevent Radar CLI from
    uploading scan findings even when you have 'EUREKA_AGENT_TOKEN' and 'EUREKA_PROFILE'
    set, you can pass the LOCAL option on the command line.

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
    '$ radar scan --local ' + '(run a local scan / no uploads to Eureka)'.grey,
    '$ radar scan -d' + '(turn debug mode on)'.grey,
    '$ radar scan --debug' + '(turn debug mode on)'.grey,
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
  run: async (toolbox, args, globals) => {
    const { log, scanners: availableScanners, categories: availableCategories, telemetry, git } = toolbox

    // Enable debug mode, if needed.
    if (args.DEBUG) globals.debug = true

    // Set defaults for args and options.
    args.TARGET ??= process.cwd()
    args.FORMAT ??= 'security'
    args.CATEGORIES ??= 'all'
    args.SCANNERS ??= ''

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
    else {
      args.SCANNERS = availableScanners.filter(s => s.default).map(s => s.name).join(',')
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
    const scansdir = path.join(os.homedir(), '.radar', 'scans')
    const tmpdir = path.join(scansdir, crypto.randomUUID()) // temporary output directory
    fs.mkdirSync(tmpdir, { recursive: true })
    const outfile = args.OUTPUT ? path.resolve(args.OUTPUT) : undefined // output file, if any

    // Validate scan parameters.
    if (!categories.length) throw new Error(`CATEGORIES must be one or more of '${availableCategories.join("', '")}', or 'all'`)
    if (!scanners.length) throw new Error('No available scanners selected.')

    if (!telemetry.enabled || args.LOCAL) {
      log(`INFO: Running a local scan.\n`)
    }

    // Get target git metadata.
    const metadata = git.metadata(target)
    if (metadata.type === 'error') throw new Error(`${metadata.error.code}: ${metadata.error.details}`)
    const repoFullName = `${metadata?.repo?.owner}/${metadata?.repo?.name}` || ""

    // Send telemetry: scan started.
    let scanID = undefined
    if (telemetry.enabled && !args.LOCAL) {
      // TODO: Should pass scanID to the server; not read it from the server.
      try {
        const res = await telemetry.send(`scans/started`, {}, { scanners: scanners.map((s) => s.name), repoFullName })
        if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}: ${await res.text()}`)
        const data = await res.json()
        scanID = data.scan_id
      }
      catch (error) {
        log(`WARNING: Telemetry will be skipped for this scan run: ${error.message}\n`)
        if (args.DEBUG) {
          log(error)
          if (error?.cause?.code === 'ECONNREFUSED') {
            log(error.cause.errors)
            log()
          }
        }
      }
    }

    // Send telemetry: git metadata.
    if (telemetry.enabled && scanID && !args.LOCAL) {
      let res = await telemetry.send(`scans/:scanID/metadata`, { scanID }, { metadata, repoFullName})
      if (!res.ok) log(`WARNING: Scan metadata (stage 1) telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
      res = await telemetry.sendSensitive(`scans/:scanID/metadata`, { scanID }, { metadata, repoFullName  })
      if (!res.ok) log(`WARNING: Scan metadata (stage 2) telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
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
      if (telemetry.enabled && scanID && !args.LOCAL) {
        const res = await telemetry.send(`scans/:scanID/failed`, { scanID })
        if (!res.ok) log(`WARNING: Scan status (not completed) telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
      }
      fs.rmSync(tmpdir, { recursive: true, force: true }) // Clean up.
      return 0x10 // exit code
    }

    // Transform scan findings: treat warnings and notes as errors, and normalize location paths.
    if (escalations) results.sarif = SARIF.transforms.escalate(results.sarif, escalations)
    SARIF.transforms.normalize(results.sarif, target, metadata, git.root(target))

    // Write findings to the destination SARIF file.
    if (outfile) fs.writeFileSync(outfile, JSON.stringify(results.sarif, null, 2))


    // Send telemetry: scan results.
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const res = await telemetry.sendSensitive(`scans/:scanID/results`, { scanID }, { findings: results.sarif, log: results.log, repoFullName })
      if (!res.ok) log(`WARNING: Scan results telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
    }

    // Analyze scan results: group findings by severity level.
    let summary
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const analysis = await telemetry.receiveSensitive(`scans/:scanID/summary`, { scanID, repoFullName })
      console.log(analysis)
      if (!analysis?.findingsBySeverity) throw new Error(`Failed to retrieve analysis summary for scan '${scanID}'`)
      summary = analysis.findingsBySeverity
    } else {
      summary = await SARIF.analysis.summarize(results.sarif, target)
    }

    // Send telemetry: scan summary.
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const res = await telemetry.send(`scans/:scanID/completed`, { scanID }, summary)
      if (!res.ok) log(`WARNING: Scan status (completed) telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
    }

    // Display summarized findings.
    if (!args.QUIET) {
      log()
      SARIF.visualizations.display_findings(summary, args.FORMAT, log)
      if (outfile) log(`Findings exported to ${outfile}`)
      SARIF.visualizations.display_totals(summary, args.FORMAT, log, telemetry.enabled && scanID && !args.LOCAL)
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

    // Display the exit code.
    if (!args.QUIET && exitCode !== 0) {
      log(`Terminating with exit code ${exitCode}. See 'radar help scan' for list of possible exit codes.`)
    }

    // Clean up.
    fs.rmSync(tmpdir, { recursive: true, force: true })

    return exitCode
  }
}
