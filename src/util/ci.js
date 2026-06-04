const getEnvValue = (value) => {
  if (!value || value.trim() === '') return undefined
  return value
}

const CICD_PROVIDERS = {
  BITBUCKET: {
    label: 'Bitbucket',
    env: 'BITBUCKET_CLONE_DIR',
    value: 'bitbucket'
  },
  GITHUB: {
    label: 'GitHub',
    env: 'GITHUB_WORKSPACE',
    value: 'github'
  },
  GITLAB: {
    label: 'GitLab',
    env: 'CI_PROJECT_DIR',
    value: 'gitlab'
  }
}

const getBitbucketCloneDir = () =>
  getEnvValue(process.env[CICD_PROVIDERS.BITBUCKET.env])

const getGithubCloneDir = () =>
  getEnvValue(process.env[CICD_PROVIDERS.GITHUB.env])

const getGitlabCloneDir = () =>
  getEnvValue(process.env[CICD_PROVIDERS.GITLAB.env])

const isGithubActions = () => !!process.env.GITHUB_ACTIONS

const isGitlabCi = () => !!process.env.GITLAB_CI

const isSelfManagedGitlabCi = () =>
  isGitlabCi() && process.env.CI_SERVER_HOST !== 'gitlab.com'

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
  // GitHub Actions provides GITHUB_WORKSPACE for the repository checkout path
  if (getGithubCloneDir() || isGithubActions()) {
    return CICD_PROVIDERS.GITHUB.value
  }
  // GitLab CI provides CI_PROJECT_DIR for the repository checkout path
  if (getGitlabCloneDir() || isGitlabCi()) {
    return CICD_PROVIDERS.GITLAB.value
  }
  return 'default'
}

// resolve clone directory based on CI/CD provider or return null if not applicable
const getCloneDir = (provider = getCiProvider()) => {
  switch (provider) {
    case CICD_PROVIDERS.BITBUCKET.value:
      return getBitbucketCloneDir()
    case CICD_PROVIDERS.GITHUB.value:
      return getGithubCloneDir()
    case CICD_PROVIDERS.GITLAB.value:
      return getGitlabCloneDir()
    case 'default':
    default:
      return null
  }
}

module.exports = {
  CICD_PROVIDERS,
  getBitbucketCloneDir,
  getGithubCloneDir,
  getGitlabCloneDir,
  isBitbucketCi,
  isGithubActions,
  isGitlabCi,
  isSelfManagedGitlabCi,
  getCiProvider,
  getCloneDir
}
