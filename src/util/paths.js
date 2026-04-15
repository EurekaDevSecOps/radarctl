const os = require('node:os')
const path = require('node:path')

const { CICD_PROVIDERS, getCiProvider, getCloneDir } = require('./ci')

// resolves the target scan path to ensure that it is in the cloned directory for the CI/CD provider
const resolveWithinCloneDir = ({ target, cloneDir, label }) => {
  const baseDir = path.resolve(path.normalize(cloneDir))
  // `resolved` starts as the requested target (or the clone dir) and is then
  // anchored to `baseDir` before normalization/safety checks.
  let resolved = target ?? baseDir
  if (!path.isAbsolute(resolved)) {
    resolved = path.join(baseDir, resolved)
  }
  resolved = path.resolve(path.normalize(resolved))

  const relative = path.relative(baseDir, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`TARGET must be within ${label}: ${baseDir}`)
  }

  return resolved
}

const assertCloneDir = ({ cloneDir, label, provider }) => {
  if (!cloneDir) {
    throw new Error(
      `${label} must be set when running in ${provider} CI to resolve scan paths`
    )
  }
}

// resolve scan target based on CI/CD provider or default to current working directory
const resolveScanTarget = (target) => {
  const provider = getCiProvider()
  const cloneDir = getCloneDir(provider)

  switch (provider) {
    case CICD_PROVIDERS.BITBUCKET.value:
      assertCloneDir({
        cloneDir,
        label: CICD_PROVIDERS.BITBUCKET.env,
        provider: CICD_PROVIDERS.BITBUCKET.label
      })
      return resolveWithinCloneDir({
        target,
        cloneDir,
        label: CICD_PROVIDERS.BITBUCKET.env
      })
    case CICD_PROVIDERS.GITLAB.value:
      assertCloneDir({
        cloneDir,
        label: CICD_PROVIDERS.GITLAB.env,
        provider: CICD_PROVIDERS.GITLAB.label
      })
      return resolveWithinCloneDir({
        target,
        cloneDir,
        label: CICD_PROVIDERS.GITLAB.env
      })
    case 'default':
    default:
      break
  }

  // if no provider or target is set, default to current working directory
  return path.resolve(path.normalize(target ?? process.cwd()))
}

// resolve scans directory based on CI/CD provider or default to ~/.radar/scans
const resolveScansDir = () => {
  const provider = getCiProvider()
  const cloneDir = getCloneDir(provider)

  if (provider === CICD_PROVIDERS.BITBUCKET.value) {
    assertCloneDir({
      cloneDir,
      label: CICD_PROVIDERS.BITBUCKET.env,
      provider: CICD_PROVIDERS.BITBUCKET.label
    })
  }

  if (provider === CICD_PROVIDERS.GITLAB.value) {
    assertCloneDir({
      cloneDir,
      label: CICD_PROVIDERS.GITLAB.env,
      provider: CICD_PROVIDERS.GITLAB.label
    })
  }

  if (cloneDir) {
    const baseDir = path.resolve(path.normalize(cloneDir))
    return path.join(baseDir, '.radar', 'scans')
  }

  return path.join(os.homedir(), '.radar', 'scans')
}

module.exports = {
  getCiProvider,
  getCloneDir,
  resolveScanTarget,
  resolveScansDir
}
