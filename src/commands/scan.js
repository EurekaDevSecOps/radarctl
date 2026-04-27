const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const SARIF = require('../util/sarif')
const runner = require('../util/runner')
const paths = require('../util/paths')
const SBOM = require('../util/sbom')
const { DateTime } = require('luxon')

function is_error(threshold) {
  return is_warning(threshold) || threshold === 'high' || threshold === 'error'
}

function is_warning(threshold) {
  return is_note(threshold) || threshold === 'moderate' || threshold === 'warning'
}

function is_note(threshold) {
  return threshold === 'low' || threshold === 'note'
}

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
    { name: 'ID', short: 'i', long: 'id', type: 'string', description: 'scan ID to associate results with' },
    { name: 'LOCAL', short: 'l', long: 'local', type: 'boolean', description: 'local scan (no upload of findings to Eureka)' },
    { name: 'OUTPUT', short: 'o', long: 'output', type: 'string', description: 'output SARIF file' },
    { name: 'QUIET', short: 'q', long: 'quiet', type: 'boolean', description: 'suppress stdout logging' },
    { name: 'SCANNERS', short: 's', long: 'scanners', type: 'string', description: 'list of scanners to use' },
    { name: 'SKIP_SBOM', short: 'B', long: 'skipSbom', type: 'bool', description: 'skip SBOM generation' },
    { name: 'THRESHOLD', short: 't', long: 'threshold', type: 'string', description: 'severity threshold for non-zero exit code' }
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
    provide your API credentials through the 'EUREKA_AGENT_TOKEN' environment variable.
    When set, Radar CLI automatically uploads results after each scan — letting you view
    your full scan history and all findings in the Eureka ASPM Dashboard. To prevent
    Radar CLI from uploading scan findings even when you have 'EUREKA_AGENT_TOKEN' set,
    you can pass the LOCAL option on the command line.

    Use the THRESHOLD option to return a non-zero exit code for severities at or
    above the threshold. For example, setting THRESHOLD to "high" would result in
    a non-zero exit code only if high or critical vulnerabilities were found by the
    scan. Available values are low, moderate, high, and critical - or note, warning,
    and error if using the SARIF native severity levels.

    Exit codes:
         0 - Clean and successful scan. No vulnerabilities.
         1 - Bad command, arguments, or options. Scan not completed.
         8 - Scan completed with vulnerabilities (>= THRESHOLD severity, if set).
     >= 16 - Scan aborted due to unexpected error.
  `,
  examples: [
    '$ radar scan ' + '(scan current working directory)'.grey,
    '$ radar scan . ' + '(scan current working directory)'.grey,
    '$ radar scan /my/repo/dir ' + '(scan target directory)'.grey,
    '$ radar scan --local ' + '(run a local scan / no uploads to Eureka)'.grey,
    '$ radar scan -d' + '(turn debug mode on)'.grey,
    '$ radar scan --debug' + '(turn debug mode on)'.grey,
    '$ radar scan --output=scan.sarif ' + '(save findings in a file)'.grey,
    '$ radar scan -o scan.sarif /my/repo/dir ' + '(short versions of options)'.grey,
    '$ radar scan -s depscan,opengrep ' + '(use only given scanners)'.grey,
    '$ radar scan -c sca,sast ' + '(use all scanners from given categories)'.grey,
    '$ radar scan -c sca,sast -s all ' + '(use all scanners from given categories)'.grey,
    '$ radar scan -c sast -s opengrep ' + '(use only the opengrep scanner)'.grey,
    '$ radar scan -e moderate,low ' + '(treat moderate and low severities as high)'.grey,
    '$ radar scan -t moderate ' + '(non-zero exit code for severities moderate and higher)'.grey,
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
    args.SKIP_SBOM ??= false

    // Normalize and/or rewrite args and options.
    args.TARGET = paths.resolveScanTarget(args.TARGET)
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
    if (args.THRESHOLD) {
      if (args.FORMAT === 'security' && !['critical', 'high', 'moderate', 'low'].includes(args.THRESHOLD)) throw new Error(`THRESHOLD must be one of 'critical', 'high', 'moderate' or 'low'`)
      if (args.FORMAT === 'sarif' && !['error', 'warning', 'note'].includes(args.THRESHOLD)) throw new Error(`THRESHOLD must be one of 'error', 'warning' or 'note'`)
    }

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
    const scansdir = paths.resolveScansDir()
    const tmpdir = path.join(scansdir, crypto.randomUUID()) // temporary output directory
    fs.mkdirSync(tmpdir, { recursive: true })
    const outfile = args.OUTPUT ? path.resolve(args.OUTPUT) : undefined // output file, if any
    const sbomFile = path.join(tmpdir, 'sbom.cdx.json')

    // Validate scan parameters.
    if (!categories.length) throw new Error(`CATEGORIES must be one or more of '${availableCategories.join("', '")}', or 'all'`)
    if (!scanners.length) throw new Error('No available scanners selected.')

    if (!telemetry.enabled || args.LOCAL) {
      log(`INFO: Running a local scan.\n`)
    }

    // Get target git metadata.
    const metadata = git.metadata(target)
    if (metadata.type === 'error') throw new Error(`${metadata.error.code}: ${metadata.error.details}`)

    // Send telemetry: scan started.
    let scanID = args.ID ?? undefined
    let scanURL = undefined
    const timestamp = DateTime.now().toISO()

    if (telemetry.enabled && !args.LOCAL) {
      try {
        const res = await telemetry.send(`scans/started`, {}, { scanners: scanners.map((s) => s.name), scanID, metadata, timestamp })
        if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}: ${await res.text()}`)
        const data = await res.json()
        scanID = data.scan_id
        scanURL = data.scan_url
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

    // Send telemetry: scan started (stage 2).
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const res = await telemetry.sendSensitive(`scans/:scanID/started`, { scanID }, { metadata, timestamp })
      if (!res.ok) log(`WARNING: Scan started (stage 2) telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
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

    if (args.DEBUG && results.log) {
      log()
      log(results.log)
    }

    // Transform scan findings: treat warnings and notes as errors, and normalize location paths.
    if (escalations) results.sarif = SARIF.transforms.escalate(results.sarif, escalations)
    SARIF.transforms.normalize(results.sarif, target, metadata, git.root(target))

    // Scan target for @eureka-radar ignore directives and embed them in the SARIF.
    // Must run after normalize so file paths match the normalized URIs in results.
    SARIF.transforms.embedDirectives(results.sarif, target, git.root(target))

    // Write findings to the destination SARIF file.
    if (outfile) fs.writeFileSync(outfile, JSON.stringify(results.sarif, null, 2))

    // Generate SBOM artifacts after scanners complete and before uploading the
    // full scan results payload.
    let sboms
    if (!args.SKIP_SBOM) {
      const lockfile = SBOM.findLockfile(target)
      if (!lockfile) {
        if (!args.QUIET) log('Skipping SBOM: no supported dependency lockfile found.')
      } else {
        try {
          if (!args.QUIET) log(`Generating SBOM from ${path.relative(target, lockfile)}:`)
          const generatedSbom = await SBOM.generate({ target, outfile: sbomFile, quiet: args.QUIET })
          sboms = generatedSbom.artifacts
        } catch (error) {
          if (error.interrupted) {
            if (!args.QUIET) log('\nSBOM generation interrupted.')
            fs.rmSync(tmpdir, { recursive: true, force: true })
            return 0x10
          }
          log(`WARNING: SBOM generation failed: ${error.message}`)
          if (args.DEBUG && error.stderr) log(error.stderr)
        }
      }
    }

    // Send telemetry: scan results.
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const res = await telemetry.sendSensitive(`scans/:scanID/results`, { scanID }, { findings: results.sarif, log: results.log, sboms })
      if (!res.ok) log(`WARNING: Scan results telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
    }

    // Analyze scan results: group findings by severity level.
    let summary
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const analysis = await telemetry.receiveSensitive(`scans/:scanID/summary`, { scanID })
      if (!analysis?.findingsBySeverity) throw new Error(`Failed to retrieve analysis summary for scan '${scanID}'`)
      summary = analysis.findingsBySeverity
    } else {
      summary = await SARIF.analysis.summarize(results.sarif, target)
    }

    // Send telemetry: scan summary.
    if (telemetry.enabled && scanID && !args.LOCAL) {
      const res = await telemetry.send(`scans/:scanID/completed`, { scanID }, { summary })
      if (!res.ok) log(`WARNING: Scan status (completed) telemetry upload failed: [${res.status}] ${res.statusText}: ${await res.text()}`)
    }

    // Display summarized findings.
    if (!args.QUIET) {
      log()
      SARIF.visualizations.display_findings(summary, args.FORMAT, log)
      if (outfile) log(`Findings exported to ${outfile}`)
      SARIF.visualizations.display_totals(summary, args.FORMAT, log, telemetry.enabled && scanID && !args.LOCAL)
    }

    // Display link to scan results in the dashboard.
    if (telemetry.enabled && scanURL && !args.QUIET) {
      log(`View scan findings in the Eureka dashboard: ${scanURL}`)
    }

    // Determine the correct exit code.
    let exitCode = 0
    if (!summary.errors.length && !summary.warnings.length && !summary.notes.length) {
      // No vulnerabilities.
      exitCode = 0
    } else if (args.THRESHOLD) {
      // Set the exit code to 8 if there are any vulnerabilities with severities at or above the given threshold.
      if (is_error(args.THRESHOLD) && summary.errors.length > 0) exitCode = 0x8
      if (is_warning(args.THRESHOLD) && summary.warnings.length > 0) exitCode = 0x8
      if (is_note(args.THRESHOLD) && summary.notes.length > 0) exitCode = 0x8
    } else {
      // Set the exit code to 8 if there are any vulnerabilities.
      exitCode = 0x8
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
