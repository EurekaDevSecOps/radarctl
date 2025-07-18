const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const fs = require('node:fs')
const path = require('node:path')
const { performance } = require('node:perf_hooks')
const os = require('node:os')
const { default: Spinner } = require('tiny-spinner')
const humanize = require('../util/humanize')
const sariftools = require('../util/sarif')
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
    { name: 'ERRORS', short: 'e', long: 'errors', type: 'string', description: 'severities to treat as errors' },
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

    By default, all scanners are used. If you want to limit your scan to a subset
    of available scanners, use the SCANNERS option. You can provide a specific
    list of scanners, comma-separated, that will be used to run the scan. Scanner
    names passed into the SCANNERS option should match the scanner names returned
    by the "scanners" command.

    If you want to run all scanners of a certain type, such as SAST, SCA, or DAST,
    use the CATEGORIES option. All scanners are classified into categories and
    some may belong to multiple categories. You could run all available SAST 
    scanners, for example, by passing in SAST as the value for the CATEGORIES
    option. Values are case-insensitive. Multiple values should be comma-separated.
    Defaults to "SAST", unless you use the SCANNERS option in which case the
    default value for CATEGORIES is ignored. To run all scanners across all
    categories, use the value "all" for CATEGORIES.

    You can specify both SCANNERS and CATEGORIES at the same time. This will run
    all scanners provided in both options.

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
    '$ radar scan -c sca,sast ' + '(use only scanners from given categories)'.grey,
    '$ radar scan -f security ' + '(displays findings as high, medium, and low)'.grey,
    '$ radar scan -e warning,note ' + '(treat warnings and notes as errors)'.grey
  ],
  run: async (toolbox, args) => {
    const { log, scanners: availableScanners, telemetry } = toolbox

    // Set defaults.
    args.TARGET = path.normalize(args.TARGET ?? process.cwd())
    args.FORMAT = args.FORMAT ?? 'security'
    if (args.FORMAT !== 'sarif' && args.FORMAT !== 'security') throw new Error('FORMAT must be one of \'sarif\' or \'security\'')
    if (args.CATEGORIES && !['all', 'sca', 'sast', 'dast'].includes(args.CATEGORIES.toLowerCase())) throw new Error(`CATEGORIES must be one of 'all', 'SCA', 'SAST', or 'DAST'`)
    if (!args.SCANNERS && !args.CATEGORIES) args.CATEGORIES = 'sast'
    if (!args.SCANNERS && (args.CATEGORIES === 'all')) args.CATEGORIES = ''
    if (args.SCANNERS) {
      const unknownScanners = args.SCANNERS.split(',').filter(name => !availableScanners.find(scanner => scanner.name === name))
      if (unknownScanners.length > 1) throw new Error(`Unknown scanners: ${unknownScanners.join(', ')}`)
      else if (unknownScanners.length === 1) throw new Error(`Unknown scanner: ${unknownScanners[0]}`)
    }

    // Set scan parameters.
    const target = path.resolve(args.TARGET) // target to scan
    const assets = path.join(__dirname, '..', '..', 'scanners') // scanner assets
    const outdir = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-')) // output directory
    const outfile = args.OUTPUT ? path.resolve(args.OUTPUT) : undefined // output file, if any

    // Select scanners to use.
    const scanners = availableScanners

      // Filter by scanner names given by the user:
      .filter(scanner => {
        if (!args.SCANNERS) return true
        return args.SCANNERS.split(',').includes(scanner.name)
      })

      // Filter by scanner categories given by the user:
      .filter(scanner => {
        if (!args.CATEGORIES) return true
        for (const category of args.CATEGORIES.toUpperCase().split(',')) {
          if (scanner.categories.includes(category)) return true
        }
        return false
      })

    // At least one scanner must be selected in order to have a successful scan.
    if (scanners.length === 0) throw new Error('No available scanners selected.')

    // Send telemetry: scan started.
    let scanID = undefined
    const isTelemetryEnabled = telemetry.enabled()
    if (isTelemetryEnabled) {
      // TODO: Should pass scanID to the server; not read it from the server.
      const response = await telemetry.send(`scans/started`, {}, { scanners: scanners.map((scanner) => scanner.name) })
      const data = await response.json()
      scanID = data.scan_id
    }

    // Run scanners.
    let isScanCompleted = true
    let runLog = ''
    log(`Running ${scanners.length} of ${availableScanners.length} scanners:`)
    for (const scanner of scanners) {
      let label = scanner.name
      const spinner = new Spinner()
      if (!args.QUIET) spinner.start(label)

      const t = performance.now()
      const interval = setInterval(() => {
        const t2 = performance.now()
        label = `${scanner.name} [${humanize.duration(t2 - t)}]`
        if (!args.QUIET) spinner.update(label)
      }, 1000) // 1000 milliseconds = 1 second

      try {
        let cmd = scanner.cmd

        /* eslint-disable no-template-curly-in-string */
        cmd = cmd.replaceAll('${target}', target)
        cmd = cmd.replaceAll('${assets}', path.join(assets, scanner.name))
        cmd = cmd.replaceAll('${output}', outdir)
        /* eslint-enable no-template-curly-in-string */

        const { stdout } = await exec(cmd)
        runLog += stdout

        if (!args.QUIET) spinner.success(label)
      } catch (error) {
        isScanCompleted = false
        if (!args.QUIET) spinner.error(label)
        log(`\n${error}`)
        if (error.stdout) log(error.stdout)
        if (error.stderr) log(error.stderr)
      }

      clearInterval(interval)
    }

    // Process scan findings.
    let exitCode = 0
    if (isScanCompleted) {
      const consolidated = path.join(outdir, 'scan.sarif')

      // Merge all output SARIF files into one.
      const all = []
      for (const scanner of scanners) {
        all.push(path.join(outdir, `${scanner.name}.sarif`))
      }
      await sariftools.merge(all, consolidated)

      // Display findings on stdout or write them to destination SARIF file.
      let sarif = fs.readFileSync(consolidated, 'utf8')

      // Convert the SARIF file into a JS object.
      try {
        sarif = JSON.parse(sarif)
      } catch (error) {
        log(`\n${error}`)
      }

      // Treat warnings and notes as errors.
      if (args.ERRORS) {
        const levels = args.ERRORS.split(',')

        for (const run of sarif.runs) {
          if (!run.results) continue
          for (const result of run.results) {
            if (levels.includes(result.level)) {
              result.level = 'error'
              continue
            }

            for (const rule of run.tool.driver.rules) {
              if (rule.id === result.ruleId) {
                const level = rule.defaultConfiguration.level
                if (levels.includes(level)) {
                  rule.defaultConfiguration.level = 'error'
                }
                break
              }
            }
          }
        }
      }

      // Write findings to the destination SARIF file.
      if (outfile) {
        fs.writeFileSync(outfile, JSON.stringify(sarif))
      }

      // Count findings by severity level.
      const summary = await sariftools.summarize(sarif, target)

      // Send telemetry.
      if (isTelemetryEnabled && scanID) {
        // Scan completed.
        telemetry.send(`scans/:scanID/completed`, { scanID }, {
          findings: {
            total: summary.errors.length + summary.warnings.length + summary.notes.length,
            critical: 0,
            high: summary.errors.length,
            med: summary.warnings.length,
            low: summary.notes.length
          }
        })

        // Send sensitive telemetry: scan log and scan findings.
        telemetry.sendSensitive(`scans/:scanID/log`, { scanID }, runLog)
        telemetry.sendSensitive(`scans/:scanID/findings`, { scanID }, { findings: sarif })
      }

      // Display summarized findings.
      if (!args.QUIET) {
        log()
        sariftools.display_findings(summary, args.FORMAT, log)
        if (outfile) log(`Findings exported to ${consolidated}`)
        sariftools.display_totals(summary, args.FORMAT, log)
      }

      // Determine the correct exit code.
      if (!summary.errors.length && !summary.warnings.length && !summary.notes.length) {
        exitCode = 0
      } else {
        exitCode = 0x8
        if (summary.errors.length > 0) exitCode |= 0x1
        if (summary.warnings.length > 0) exitCode |= 0x2
        if (summary.notes.length > 0) exitCode |= 0x4
      }
    } else {
      exitCode = 0x10
      if (!args.QUIET) log('Scan NOT completed!')
      if (telemetry.enabled()) telemetry.send(`scans/:scanID/failed`, { scanID })
    }

    // Clean up.
    fs.rmSync(outdir, { recursive: true, force: true })

    return exitCode
  }
}
