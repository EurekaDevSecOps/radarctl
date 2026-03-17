const os = require('node:os')
const path = require('node:path')

const { getCiProvider, getCloneDir } = require('./ci')

const resolveWithinCloneDir = ({ target, cloneDir, label }) => {
  let resolved = target ?? cloneDir
  if (!path.isAbsolute(resolved)) {
    resolved = path.join(cloneDir, resolved)
  }
  resolved = path.resolve(path.normalize(resolved))

  const relative = path.relative(cloneDir, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`TARGET must be within ${label}: ${cloneDir}`)
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
    case 'bitbucket':
      assertCloneDir({
        cloneDir,
        label: 'BITBUCKET_CLONE_DIR',
        provider: 'Bitbucket'
      })
      return resolveWithinCloneDir({
        target,
        cloneDir,
        label: 'BITBUCKET_CLONE_DIR'
      })
    case 'gitlab':
      assertCloneDir({
        cloneDir,
        label: 'CI_PROJECT_DIR',
        provider: 'GitLab'
      })
      return resolveWithinCloneDir({
        target,
        cloneDir,
        label: 'CI_PROJECT_DIR'
      })
    case 'default':
    default:
      break
  }

  return path.resolve(path.normalize(target ?? process.cwd()))
}

// resolve scans directory based on CI/CD provider or default to ~/.radar/scans
const resolveScansDir = () => {
  const provider = getCiProvider()
  const cloneDir = getCloneDir(provider)

  if (provider === 'bitbucket') {
    assertCloneDir({
      cloneDir,
      label: 'BITBUCKET_CLONE_DIR',
      provider: 'Bitbucket'
    })
  }

  if (provider === 'gitlab') {
    assertCloneDir({
      cloneDir,
      label: 'CI_PROJECT_DIR',
      provider: 'GitLab'
    })
  }

  if (cloneDir) return path.join(cloneDir, '.radar', 'scans')

  return path.join(os.homedir(), '.radar', 'scans')
}

module.exports = {
  getCiProvider,
  getCloneDir,
  resolveScanTarget,
  resolveScansDir
}
