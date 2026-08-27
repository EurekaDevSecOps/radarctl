const { execSync } = require('node:child_process')
const hostedGitInfo = require('hosted-git-info')
const { isGitlabCi } = require('../ci')


function isAzureDevOpsUrl(originUrl) {
  const knownAzureDomains = [
    'dev.azure.com',
    'visualstudio.com',
    'ssh.dev.azure.com',
    'vs-ssh.visualstudio.com'
  ]

  return knownAzureDomains.some((url) => originUrl.includes(url))
}

function isBitbucketUrl(originUrl) {
  if (!originUrl) return false
  return originUrl.toLowerCase().includes('bitbucket.org')
}

function isGitlabHostUrl(originUrl) {
  if (!originUrl) return false

  const sshMatch = parseSshUrl(originUrl)
  if (sshMatch) {
    return sshMatch.host.toLowerCase().includes('gitlab')
  }

  if (!/^https?:\/\//i.test(originUrl)) return false

  try {
    const url = new URL(originUrl)
    return url.hostname.toLowerCase().includes('gitlab')
  } catch (error) {
    return false
  }
}

function parseSshUrl(originUrl, { user } = {}) {
  if (/^https?:\/\//i.test(originUrl)) return null
  const match = originUrl.match(/^(?:ssh:\/\/)?([^@]+)@([^:/]+)(?::|\/)(.+)$/)
  if (!match) return null
  if (user && match[1] !== user) return null
  return {
    user: match[1],
    host: match[2],
    path: match[3]
  }
}


/**
 * BitBucket formats:
 * - `http://<user>@bitbucket.org/<workspace>/<repo>`
 * - `https://bitbucket.org/<workspace>/<repo>`
 * - `git@bitbucket.org:<workspace>/<repo>.git`
 * - `ssh://git@bitbucket.org/<workspace>/<repo>.git`
 * - The remote URL for BitBucket repositories may omit or include the .git suffix.
 */
function parseBitbucketUrl(originUrl) {
  if (!originUrl) return null

  const parsePathParts = (rawPath) =>
    rawPath.split('/').filter((p) => p)

  const sshMatch = parseSshUrl(originUrl, { user: 'git' })
  if (sshMatch) {
    const host = sshMatch.host
    const pathParts = parsePathParts(sshMatch.path)
    if (pathParts.length < 2) return null

    const user = pathParts[0]
    const project = pathParts[1].replace(/\.git$/i, '')
    if (!user || !project) return null

    const httpsUrl = `https://${host}/${user}/${project}`
    return {
      https: () => httpsUrl,
      type: 'bitbucket',
      domain: host,
      user,
      project
    }
  }

  if (!/^https?:\/\//i.test(originUrl)) return null

  let url
  try {
    url = new URL(originUrl)
  } catch (error) {
    return null
  }

  const pathParts = parsePathParts(url.pathname)
  if (pathParts.length < 2) return null

  const user = pathParts[0]
  const project = pathParts[1].replace(/\.git$/i, '')
  if (!user || !project) return null

  const httpsUrl = `https://${url.hostname}/${user}/${project}`
  return {
    https: () => httpsUrl,
    type: 'bitbucket',
    domain: url.hostname,
    user,
    project
  }
}

// Fallback for GitLab-style remotes that hosted-git-info does not recognize.
function parseGitlabSelfManagedUrl(originUrl) {
  if (!originUrl) return null

  const type = isGitlabCi() || isGitlabHostUrl(originUrl) ? 'gitlab' : 'git'

  const parsePathParts = (rawPath) =>
    rawPath.split('/').filter((p) => p)

  const buildInfo = ({ domain, pathParts, httpsBaseUrl }) => {
    if (pathParts.length < 2) return null

    const project = pathParts.at(-1).replace(/\.git$/i, '')
    const user = pathParts.slice(0, -1).join('/')
    if (!user || !project) return null

    const httpsUrl = `${httpsBaseUrl}/${user}/${project}`
    return {
      https: () => httpsUrl,
      type,
      domain,
      user,
      project
    }
  }

  const sshMatch = parseSshUrl(originUrl)
  if (sshMatch) {
    return buildInfo({
      domain: sshMatch.host,
      pathParts: parsePathParts(sshMatch.path),
      httpsBaseUrl: `https://${sshMatch.host}`
    })
  }

  if (!/^https?:\/\//i.test(originUrl)) return null

  let url
  try {
    url = new URL(originUrl)
  } catch (error) {
    return null
  }

  return buildInfo({
    domain: url.host,
    pathParts: parsePathParts(url.pathname),
    httpsBaseUrl: url.origin
  })
}

function parseFallbackGitInfoFromUrl(originUrl) {
  if (isGitlabCi() || isGitlabHostUrl(originUrl)) {
    return parseGitlabSelfManagedUrl(originUrl)
  }
}

/**
 * Azure DevOps formats:
 * - `https://TOKEN@dev.azure.com/<org>/<project>/_git/<repo>`
 * - `https://pat:TOKEN@dev.azure.com/<org>/<project>/_git/<repo>` (the "pat" here can be any arbitrary string)
 * - `git@ssh.dev.azure.com:v3/<org>/<project>/<repo>`
 * - `ssh://git@ssh.dev.azure.com/v3/<org>/<project>/<repo>`
 * - `git@vs-ssh.visualstudio.com:v3/<org>/<project>/<repo>`
 */
function parseAzureDevOpsUrl(originUrl) {
  const decodeComponentURI = (value) => {
    try {
      return decodeURIComponent(value)
    } catch (error) {
      throw new Error(`failed decoding Azure DevOps URL component: ${error.message}`)
    }
  }

  const parsePathParts = (rawPath) =>
    rawPath
      .split('/')
      .filter((p) => p)
      .map((part) => decodeComponentURI(part))

  const sshMatch = parseSshUrl(originUrl, { user: 'git' })
  if (sshMatch) {
    const host = sshMatch.host
    let pathParts = parsePathParts(sshMatch.path)
    if (pathParts[0] === 'v3') pathParts = pathParts.slice(1)
    if (pathParts.length < 3) {
      throw new Error(`Invalid Azure DevOps URL format: ${originUrl}`)
    }

    const [org, project, repo] = pathParts
    const https =
      host.includes('visualstudio.com')
        ? `https://${org}.visualstudio.com/${project}/_git/${repo}`
        : `https://dev.azure.com/${org}/${project}/_git/${repo}`

    return {
      https: () => https,
      type: 'azure',
      domain: host,
      // project name
      user: project,
      // repo name
      project: repo
    }
  }

  // Strip credentials from URL
  const cleanUrl = originUrl.replace(/https:\/\/([^@:]+:)?[^@]+@/, 'https://')
  const url = new URL(cleanUrl)

  const pathParts = parsePathParts(url.pathname)
  if (pathParts.length < 4 || pathParts[2] !== '_git') {
    throw new Error(`Invalid Azure DevOps URL format: ${originUrl}`)
  }

  return {
    https: () => cleanUrl,
    type: 'azure',
    domain: url.hostname,
    // project name
    user: `${pathParts[0]}/${pathParts[1]}`, 
    // repo name
    project: pathParts[3]
  }
}

function parseGitInfoFromUrl(originUrl) {
  if (isAzureDevOpsUrl(originUrl)) {
    return parseAzureDevOpsUrl(originUrl)
  }

  if (isBitbucketUrl(originUrl)) {
    const bitbucketInfo = parseBitbucketUrl(originUrl)
    if (bitbucketInfo) return bitbucketInfo
  }

  const hostedInfo = hostedGitInfo.fromUrl(originUrl, { noGitPlus: true })
  if (hostedInfo) return hostedInfo

  return parseFallbackGitInfoFromUrl(originUrl)
}

function metadata(folder) {
  try {
    // Determine if we're scanning a valid git repo.
    const isGitRepo = execSync('git rev-parse --is-inside-work-tree', { cwd: folder }).toString().trim()
    if (isGitRepo !== 'true') {
      return { type: 'folder' }
    }

    // Get the repo name and owner.
    const originUrl = execSync('git config --get remote.origin.url', { cwd: folder }).toString().trim()
    const info = parseGitInfoFromUrl(originUrl)
    
    if (!info || !info.user || !info.project || !info.domain || !info.https) {
      throw new Error(`unsupported remote.origin.url: ${originUrl}`)
    }

    const ownerPath = info.user.split('/')

    // Get the branch name.
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: folder }).toString().trim()

    // Get the commit identifier and timestamp.
    const shortCommitId = execSync('git rev-parse --short HEAD', { cwd: folder }).toString().trim()
    const fullCommitId = execSync('git rev-parse HEAD', { cwd: folder }).toString().trim()
    const commitTime = execSync('git show -s --format=%cI HEAD', { cwd: folder }).toString().trim()

    // Get the tags for the current commit.
    let tags = execSync('git tag --points-at HEAD', { cwd: folder }).toString().trim()
    tags = '["' + tags.split('\n').join('","') + '"]'
    try {
      tags = JSON.parse(tags).filter(tag => tag)
    }
    catch (error) {
      throw new Error(`failed parsing repo tags: ${error.message}`)
    }

    // Get the list of unique repo contributors (authors and committers).
    const template = '%cn:%ce%n%an:%ae%n'
    let contributors = execSync(`git log --pretty=${template} | sort -u`, { cwd: folder }).toString().trim()
    try {
      contributors = contributors
        .split('\n')
        .map(c => {
          const ne = (c + '').split(':')
          return {
            name: ne?.at(0) ?? '',
            email: ne?.at(1) ?? ''
          }
        })
        .filter(c => isValidEmail(c.email))
    }
    catch (error) {
      throw new Error(`failed parsing repo contributors: ${error.message}`)
    }

    const script = `MAX_LENGTH=4;
git rev-list --abbrev=4 --abbrev-commit --all | \
  ( while read -r line; do
      if [ \${#line} -gt $MAX_LENGTH ]; then
        MAX_LENGTH=\${#line};
      fi
    done && printf %s\\\\n "$MAX_LENGTH"
  )`
    const abbrevs = Number(execSync(script, { cwd: folder }).toString().trim())

/*
    // Get the total lines of code in the repo.
    const loc = execSync('git ls-files -z ${1} | xargs -0 cat | wc -l', { cwd: folder }).toString().trim()
*/

    // Return the repo metadata.
    const metadata = {
      type: 'git',
      repo: {
        url: {
          origin: originUrl,
          https: info.https()
        },
        source: {
          type: info.type,
          domain: info.domain
        },
        owner: ownerPath[0],
        path: ownerPath.slice(1).join('/'),
        name: info.project,
        abbrevs,
        contributors
      },
      commit: {
        id: fullCommitId,
        time: commitTime,
        branch,
        tags
      }
    }

    // Validate repo metadata.
    if (!metadata.repo.url.origin) throw new Error('remote.origin.url not present')
    if (!metadata.repo.url.https) throw new Error('remote.origin.url (https) not present')
    if (!metadata.repo.source.type) throw new Error('unable to determine repository type')
    if (!metadata.repo.source.domain) throw new Error('unable to determine repository domain')
    if (!metadata.repo.owner) throw new Error('unknown repo owner')
    if (!metadata.repo.name) throw new Error('unknown repo name')
    if (!metadata.repo.abbrevs) throw new Error('unable to determine number of significant digits for commit IDs')
    if (!metadata.repo.contributors) throw new Error('no repository contributors present')
    if (!metadata.commit.id) throw new Error('commit ID not present')
    if (!metadata.commit.time) throw new Error('commit time not present')
    if (!metadata.commit.branch) throw new Error('branch not present')

    return metadata
  } catch (error) {
    return {
      type: 'error',
      error: {
        code: 'E_GIT_METADATA',
        details: error
      }
    }
  }
}

function root(folder) {
  try {
    // Get the full OS path to the root of the repo.
    const root = execSync('git rev-parse --show-toplevel', { cwd: folder }).toString().trim()
    return root
  } catch (error) {
    return {
      type: 'error',
      error: {
        code: 'E_GIT_METADATA',
        details: error
      }
    }
  }
}

/**
 * Thanks to:
 * http://fightingforalostcause.net/misc/2006/compare-email-regex.php
 * http://thedailywtf.com/Articles/Validating_Email_Addresses.aspx
 * http://stackoverflow.com/questions/201323/what-is-the-best-regular-expression-for-validating-email-addresses/201378#201378
 * https://en.wikipedia.org/wiki/Email_address  The format of an email address is local-part@domain, where the 
 * local part may be up to 64 octets long and the domain may have a maximum of 255 octets.[4]
 */
function isValidEmail(email) {
  if (!email) return false

  const parts = email.split('@')
  if (parts.length !== 2) return false

  const account = parts[0]
  if (account.length > 64) return false

  const address = parts[1]
  if (address.length > 255) return false

  const domainParts = address.split('.')
  if (domainParts.some((part) => part.length > 63 )) return false

  const emailRE = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  return emailRE.test(email)
}

module.exports = {
  metadata,
  root
}
