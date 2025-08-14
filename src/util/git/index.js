const { execSync } = require('node:child_process')
const GitUrlParse = require('git-url-parse')

function metadata() {
  try {
    // Determine if we're scanning a valid git repo.
    const isGitRepo = execSync('git rev-parse --is-inside-work-tree').toString().trim()
    if (isGitRepo !== 'true') {
      return { type: 'folder' }
    }

    // Get the repo name and owner.
    const originUrl = execSync('git config --get remote.origin.url').toString().trim()
    const urlParts = GitUrlParse(originUrl)

    // Get the branch name.
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

    // Get the commit identifier and timestamp.
    const shortCommitId = execSync('git rev-parse --short HEAD').toString().trim()
    const fullCommitId = execSync('git rev-parse HEAD').toString().trim()
    const commitTime = execSync('git show -s --format=%cI HEAD').toString().trim()

    // Get the tags for the current commit.
    let tags = execSync('git tag --points-at HEAD').toString().trim()
    tags = '["' + tags.split('\n').join('","') + '"]'
    tags = JSON.parse(tags).filter(tag => tag)

    // Get the list of unique repo contributors (authors and committers).
    const template = '"{\\\"name\\\":\\\"%cn\\\",\\\"email\\\":\\\"%ce\\\"}%n{\\\"name\\\":\\\"%an\\\",\\\"email\\\":\\\"%ae\\\"}"'
    let contributors = execSync(`git log --pretty=${template} | sort -u`).toString().trim()
    contributors = '[' + contributors.split('\n').join(',') + ']'
    contributors = JSON.parse(contributors)

/*
    // Get the total lines of code in the repo.
    const loc = execSync('git ls-files -z ${1} | xargs -0 cat | wc -l').toString().trim()
*/

    // Return the repo metadata.
    return {
      type: 'git',
      source: urlParts.source,
      name: urlParts.name,
      owner: urlParts.owner,
      branch,
      commit: {
        id: fullCommitId,
        short: shortCommitId,
        time: commitTime,
      },
      tags,
      contributors
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
