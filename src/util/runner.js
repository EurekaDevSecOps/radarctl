const fs = require('node:fs')
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const path = require('node:path')
const { performance } = require('node:perf_hooks')
const { default: Spinner } = require('tiny-spinner')
const humanize = require('./humanize')
const SARIF = require('./sarif')

const runAll = async ({ scanners, target, assets, outdir, quiet, log }) => {
  // Results will include the stdout log and the final combined SARIF object.
  const results = { log: '' }

  // Run all scanners. This will produce one output SARIF file per scanner.
  for (const scanner of scanners) {
    results.log += await runScanner({ scanner, target, assets, outdir, quiet, log, display: {
      begin: () => scanner.name,
      progress: (label, duration) => `${scanner.name} [${humanize.duration(duration)}]`,
      success: (label) => label,
      error: (label) => label
    }})
  }

  // Merge all output SARIF files into one and load it into a JS object.
  const consolidated = path.join(outdir, 'scan.sarif')
  await SARIF.transforms.merge(consolidated, scanners.map(s => path.join(outdir, `${s.name}.sarif`)))
  results.sarif = JSON.parse(fs.readFileSync(consolidated, 'utf8'))

  return results
}

const runScanner = async ({ scanner, target, assets, outdir, quiet, log, display }) => {
  let label = display.begin()
  const spinner = new Spinner()
  if (!quiet) spinner.start(label)

  const t = performance.now()
  const interval = setInterval(() => {
    const t2 = performance.now()
    label = display.progress(label, t2 - t)
    if (!quiet) spinner.update(label)
  }, 1000) // 1000 milliseconds = 1 second

  let runLog = ''
  try {
    let cmd = scanner.cmd

    /* eslint-disable no-template-curly-in-string */
    cmd = cmd.replaceAll('${target}', target)
    cmd = cmd.replaceAll('${assets}', path.join(assets, scanner.name))
    cmd = cmd.replaceAll('${output}', outdir)
    /* eslint-enable no-template-curly-in-string */

    const { stdout } = await exec(cmd)
    runLog = stdout

    if (!quiet) spinner.success(display.success(label))
  } catch (error) {
    if (!quiet) spinner.error(display.error(label))

    let message = `${error}`
    if (error.stdout) message += error.stdout
    if (error.stderr) message += error.stderr
    throw new Error(message)
  }
  finally {
    clearInterval(interval)
  }

  return runLog
}

module.exports = {
  run: runAll
}
