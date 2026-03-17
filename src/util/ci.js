const getEnvValue = (value) => {
  if (!value || value.trim() === '') return undefined
  return value
}

const getBitbucketCloneDir = () =>
  getEnvValue(process.env.BITBUCKET_CLONE_DIR)

const isBitbucketCi = () =>
  !!(
    process.env.BITBUCKET_CLONE_DIR ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.BITBUCKET_PIPELINE_UUID
  )

const getCiProvider = () => {
  // BitBucket CI provides BITBUCKET_CLONE_DIR, BITBUCKET_BUILD_NUMBER, or BITBUCKET_PIPELINE_UUID for the repository checkout path
  if (getBitbucketCloneDir() || isBitbucketCi()) return 'bitbucket'
  return 'default'
}

// resolve clone directory based on CI/CD provider or return null if not applicable
const getCloneDir = (provider = getCiProvider()) => {
  switch (provider) {
    case 'bitbucket':
      return getBitbucketCloneDir()
    case 'default':
    default:
      return null
  }
}

module.exports = {
  getBitbucketCloneDir,
  isBitbucketCi,
  getCiProvider,
  getCloneDir
}
