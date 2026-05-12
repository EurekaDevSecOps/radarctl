const assert = require('node:assert/strict')
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const git = require('../../../src/util/git')

const customHostedGitLabCases = [
  {
    name: 'parses custom hosted GitLab HTTPS remote',
    url: 'https://gitlab.example.com/group/proj.git',
    expected: {
      type: 'gitlab',
      domain: 'gitlab.example.com',
      user: 'group',
      project: 'proj',
      https: 'https://gitlab.example.com/group/proj.git'
    }
  },
  {
    name: 'parses custom hosted GitLab HTTPS remote with subgroup',
    url: 'https://gitlab.example.com/group/subgroup/proj.git',
    expected: {
      type: 'gitlab',
      domain: 'gitlab.example.com',
      user: 'group/subgroup',
      project: 'proj',
      https: 'https://gitlab.example.com/group/subgroup/proj.git'
    }
  },
  {
    name: 'parses custom hosted GitLab SCP-like SSH remote',
    url: 'git@gitlab.example.com:group/proj.git',
    expected: {
      type: 'gitlab',
      domain: 'gitlab.example.com',
      user: 'group',
      project: 'proj',
      https: 'https://gitlab.example.com/group/proj.git'
    }
  },
  {
    name: 'parses custom hosted GitLab SSH protocol remote',
    url: 'ssh://git@gitlab.example.com/group/proj.git',
    expected: {
      type: 'gitlab',
      domain: 'gitlab.example.com',
      user: 'group',
      project: 'proj',
      https: 'https://gitlab.example.com/group/proj.git'
    }
  }
]

for (const testCase of customHostedGitLabCases) {
  test(testCase.name, () => {
    const info = git.parseGitInfoFromUrl(testCase.url)

    assert.ok(info)
    assert.equal(info.type, testCase.expected.type)
    assert.equal(info.domain, testCase.expected.domain)
    assert.equal(info.user, testCase.expected.user)
    assert.equal(info.project, testCase.expected.project)
    assert.equal(info.https(), testCase.expected.https)
  })
}

test('keeps parsing gitlab.com remotes with hosted-git-info', () => {
  const info = git.parseGitInfoFromUrl('https://gitlab.com/group/proj.git')

  assert.ok(info)
  assert.equal(info.type, 'gitlab')
  assert.equal(info.domain, 'gitlab.com')
  assert.equal(info.user, 'group')
  assert.equal(info.project, 'proj')
  assert.equal(info.https(), 'https://gitlab.com/group/proj.git')
})

test('keeps parsing GitHub remotes', () => {
  const info = git.parseGitInfoFromUrl('https://github.com/org/proj.git')

  assert.ok(info)
  assert.equal(info.type, 'github')
  assert.equal(info.domain, 'github.com')
  assert.equal(info.user, 'org')
  assert.equal(info.project, 'proj')
  assert.equal(info.https(), 'https://github.com/org/proj.git')
})

test('keeps parsing Bitbucket remotes', () => {
  const info = git.parseGitInfoFromUrl('git@bitbucket.org:workspace/proj.git')

  assert.ok(info)
  assert.equal(info.type, 'bitbucket')
  assert.equal(info.domain, 'bitbucket.org')
  assert.equal(info.user, 'workspace')
  assert.equal(info.project, 'proj')
  assert.equal(info.https(), 'https://bitbucket.org/workspace/proj')
})

test('keeps parsing Azure DevOps remotes', () => {
  const info = git.parseGitInfoFromUrl('ssh://git@ssh.dev.azure.com/v3/org/project/repo')

  assert.ok(info)
  assert.equal(info.type, 'azure')
  assert.equal(info.domain, 'ssh.dev.azure.com')
  assert.equal(info.user, 'project')
  assert.equal(info.project, 'repo')
  assert.equal(info.https(), 'https://dev.azure.com/org/project/_git/repo')
})

test('metadata returns clear error when remote URL cannot be parsed', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radarctl-git-'))

  try {
    execSync('git init', { cwd: tmpDir })
    execSync('git config user.email test@example.com', { cwd: tmpDir })
    execSync('git config user.name "Test User"', { cwd: tmpDir })

    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# test\n')
    execSync('git add README.md', { cwd: tmpDir })
    execSync('git commit -m init', { cwd: tmpDir })
    execSync('git remote add origin not-a-valid-remote', { cwd: tmpDir })

    const metadata = git.metadata(tmpDir)

    assert.equal(metadata.type, 'error')
    assert.equal(metadata.error.code, 'E_GIT_METADATA')
    assert.match(metadata.error.details.message, /unable to parse repository remote URL: not-a-valid-remote/)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
