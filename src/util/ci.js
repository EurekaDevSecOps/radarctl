const getEnvValue = (value) => {
  if (!value || value.trim() === '') return undefined
  return value
}

const CICD_PROVIDERS = {
  BITBUCKET: {
    label: 'Bitbucket',
    env: 'BITBUCKET_CLONE_DIR',
    value: 'bitbucket'
  }
}

const getBitbucketCloneDir = () =>
  getEnvValue(process.env[CICD_PROVIDERS.BITBUCKET.env])

const isBitbucketCi = () =>
  !!(
    process.env[CICD_PROVIDERS.BITBUCKET.env] ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.BITBUCKET_PIPELINE_UUID
  )

const getCiProvider = () => {
  // BitBucket CI provides BITBUCKET_CLONE_DIR, BITBUCKET_BUILD_NUMBER, or BITBUCKET_PIPELINE_UUID for the repository checkout path
  if (getBitbucketCloneDir() || isBitbucketCi()) {
    return CICD_PROVIDERS.BITBUCKET.value
  }
  return 'default'
}

// resolve clone directory based on CI/CD provider or return null if not applicable
const getCloneDir = (provider = getCiProvider()) => {
  switch (provider) {
    case CICD_PROVIDERS.BITBUCKET.value:
      return getBitbucketCloneDir()
    case 'default':
    default:
      return null
  }
}

module.exports = {
  CICD_PROVIDERS,
  getBitbucketCloneDir,
  isBitbucketCi,
  getCiProvider,
  getCloneDir
}
