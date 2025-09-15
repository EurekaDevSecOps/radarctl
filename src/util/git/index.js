const { execSync } = require('node:child_process')
const hostedGitInfo = require('hosted-git-info')

function metadata(folder) {
  try {
    // Determine if we're scanning a valid git repo.
    const isGitRepo = execSync('git rev-parse --is-inside-work-tree', { cwd: folder }).toString().trim()
    if (isGitRepo !== 'true') {
      return { type: 'folder' }
    }

    // Get the repo name and owner.
    const originUrl = execSync('git config --get remote.origin.url', { cwd: folder }).toString().trim()
    const info = hostedGitInfo.fromUrl(originUrl, { noGitPlus: true })
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
    tags = JSON.parse(tags).filter(tag => tag)

    // Get the list of unique repo contributors (authors and committers).
    const template = '"{\\\"name\\\":\\\"%cn\\\",\\\"email\\\":\\\"%ce\\\"}%n{\\\"name\\\":\\\"%an\\\",\\\"email\\\":\\\"%ae\\\"}"'
    let contributors = execSync(`git log --pretty=${template} | sort -u`, { cwd: folder }).toString().trim()
    contributors = '[' + contributors.split('\n').join(',') + ']'
    contributors = JSON.parse(contributors)

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
    return {
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

module.exports = {
  metadata
}
