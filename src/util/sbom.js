const fs = require('node:fs')
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const path = require('node:path')
const { performance } = require('node:perf_hooks')
const { default: Spinner } = require('tiny-spinner')
const TOML = require('smol-toml')
const humanize = require('./humanize')

const LOCKFILE_NAMES = new Set([
  'bun.lock',
  'bun.lockb',
  'Cargo.lock',
  'Cartfile.resolved',
  'cabal.project.freeze',
  'cpanfile.snapshot',
  'composer.lock',
  'conda-lock.yml',
  'deno.lock',
  'flake.lock',
  'Gemfile.lock',
  'go.sum',
  'gradle.lockfile',
  'mix.lock',
  'npm-shrinkwrap.json',
  'package-lock.json',
  'packages.lock.json',
  'paket.lock',
  'Pipfile.lock',
  'Podfile.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'pubspec.lock',
  'Package.resolved',
  'renv.lock',
  'stack.yaml.lock',
  'uv.lock',
  'yarn.lock'
])

const isLockfile = entry => LOCKFILE_NAMES.has(entry.name) || entry.name.endsWith('.lockfile')

const SKIP_DIRS = new Set([
  '.git',
  '.hg',
  '.svn',
  'build',
  'dist',
  'node_modules',
  'vendor'
])

const findLockfile = dir => {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return null
  }

  for (const entry of entries) {
    if (entry.isFile() && isLockfile(entry)) return path.join(dir, entry.name)
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue
    const found = findLockfile(path.join(dir, entry.name))
    if (found) return found
  }

  return null
}

const readTool = assets => {
  const file = path.join(assets, 'about.toml')
  const text = fs.readFileSync(file, 'utf8')
  return TOML.parse(text)
}

const commandFor = ({ tool, target, assets, outdir }) => {
  let cmd = tool.cmd

  /* eslint-disable no-template-curly-in-string */
  cmd = cmd.replaceAll('${target}', target)
  cmd = cmd.replaceAll('${assets}', assets)
  cmd = cmd.replaceAll('${output}', outdir)
  /* eslint-enable no-template-curly-in-string */

  return cmd
}

const runTool = async (cmd, { quiet, display }) => {
  let label = display.begin()
  const spinner = new Spinner()
  if (!quiet) spinner.start(label)

  const t = performance.now()
  const interval = setInterval(() => {
    const t2 = performance.now()
    label = display.progress(label, t2 - t)
    if (!quiet) spinner.update(label)
  }, 1000)

  let interrupted = false
  const promise = exec(cmd, { maxBuffer: 50 * 1024 * 1024 })
  const child = promise.child

  const cleanup = () => {
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', terminate)
  }
  const stop = signal => {
    interrupted = true
    if (!child.killed) child.kill(signal)
  }
  const interrupt = () => stop('SIGINT')
  const terminate = () => stop('SIGTERM')

  process.on('SIGINT', interrupt)
  process.on('SIGTERM', terminate)

  try {
    await promise
    clearInterval(interval)
    cleanup()
    if (!quiet) spinner.success(display.success(label, performance.now() - t))
  } catch (error) {
    clearInterval(interval)
    cleanup()
    if (!quiet) spinner.error(display.error(label))
    let message = `${error}`
    if (error.stdout) message += error.stdout
    if (error.stderr) message += error.stderr
    const wrapped = new Error(message)
    wrapped.interrupted = interrupted
    throw wrapped
  }
}

const generate = async ({ target, outfile, quiet = false }) => {
  const outdir = path.dirname(outfile)
  const assets = path.join(__dirname, '..', '..', 'sbom', 'cdxgen')
  const tool = readTool(assets)

  await runTool(commandFor({ tool, target, assets, outdir }), {
    quiet,
    display: {
      begin: () => tool.name,
      progress: (label, duration) => `${tool.name} [${humanize.duration(duration)}]`,
      success: (label, duration) => `${tool.name} [${humanize.duration(duration)}]`,
      error: (label) => label
    }
  })

  return JSON.parse(fs.readFileSync(outfile, 'utf8'))
}

module.exports = {
  findLockfile,
  generate
}
