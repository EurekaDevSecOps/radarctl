const fs = require('node:fs')
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const path = require('node:path')
const { performance } = require('node:perf_hooks')
const { default: Spinner } = require('tiny-spinner')
const TOML = require('smol-toml')
const humanize = require('./humanize')

// Derived from https://github.com/cdxgen/cdxgen/blob/master/docs/PROJECT_TYPES.md
const CDXGEN_EVIDENCE_NAMES = new Set([
  'BUILD',
  'BUILD.bazel',
  'CMakeLists.txt',
  'Cargo.lock',
  'Cargo.toml',
  'Cartfile.resolved',
  'Composer.lock',
  'Gemfile.lock',
  'Gopkg.lock',
  'MODULE.bazel',
  'Package.resolved',
  'Package.swift',
  'Pipfile.lock',
  'Podfile',
  'Podfile.lock',
  'WORKSPACE',
  'WORKSPACE.bazel',
  'bower.json',
  'bdist_wheel',
  'bun.lock',
  'bun.lockb',
  'build.gradle',
  'build.gradle.kts',
  'build.mill',
  'build.sbt',
  'cabal.project.freeze',
  'conda-lock.yml',
  'composer.lock',
  'conan.lock',
  'conanfile.txt',
  'cpanfile.snapshot',
  'deno.lock',
  'deps.edn',
  'flake.lock',
  'flake.nix',
  'go.sum',
  'go.mod',
  'gradle.lockfile',
  'meson.build',
  'mix.lock',
  'npm-shrinkwrap.json',
  'package-lock.json',
  'packages.config',
  'packages.lock.json',
  'paket.lock',
  'pdm.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'pom.xml',
  'project.assets.json',
  'project.clj',
  'pubspec.lock',
  'pubspec.yaml',
  'pylock.toml',
  'pyproject.toml',
  'renv.lock',
  'requirements.txt',
  'rush.js',
  'settings.gradle',
  'settings.gradle.kts',
  'setup.py',
  'stack.yaml.lock',
  'uv.lock',
  'yarn.lock'
])

const CDXGEN_EVIDENCE_PATTERNS = [
  /.+\.aab$/,
  /.+\.apk$/,
  /.+\.cmake$/,
  /.+\.crate$/,
  /.+\.csproj$/,
  /.+\.egg-info$/,
  /.+\.fsproj$/,
  /.+\.gemspec$/,
  /.+\.hmiproj$/,
  /.+\.hpi$/,
  /.+\.jar$/,
  /.+\.kts$/,
  /.+\.lockfile$/,
  /.+\.min\.js$/,
  /.+\.nupkg$/,
  /.+\.nuspec$/,
  /.+\.plcproj$/,
  /.+\.sln$/,
  /.+\.slnx$/,
  /.+\.tsproj$/,
  /.+\.vbproj$/,
  /.+\.vsix$/,
  /.+\.whl$/
]

const isSupportedEvidenceFile = entry => {
  if (!entry.isFile()) return false
  if (CDXGEN_EVIDENCE_NAMES.has(entry.name)) return true
  return CDXGEN_EVIDENCE_PATTERNS.some(pattern => pattern.test(entry.name))
}

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
    if (isSupportedEvidenceFile(entry)) return path.join(dir, entry.name)
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

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))

const artifactFor = ({ format, specVersion, document }) => ({
  format,
  specVersion,
  document
})

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

const toolAssets = name => path.join(__dirname, '..', '..', 'sbom', name)

const runSbomTool = async ({ name, target, outdir, quiet }) => {
  const assets = toolAssets(name)
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
}

const generate = async ({ target, outfile, quiet = false }) => {
  const outdir = path.dirname(outfile)
  const files = {
    cyclonedx: outfile,
    spdx: path.join(outdir, 'sbom.spdx.json')
  }

  await runSbomTool({ name: 'cdxgen', target, outdir, quiet })
  await runSbomTool({ name: 'spdx', target, outdir, quiet })

  const cyclonedx = readJson(files.cyclonedx)
  const spdx = readJson(files.spdx)

  return {
    cyclonedx,
    spdx,
    artifacts: [
      artifactFor({ format: 'cyclonedx', specVersion: cyclonedx.specVersion, document: cyclonedx }),
      artifactFor({ format: 'spdx', specVersion: spdx.spdxVersion, document: spdx })
    ]
  }
}

module.exports = {
  findLockfile,
  generate
}
