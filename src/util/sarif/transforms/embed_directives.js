const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

// Matches the @eureka-radar directive anywhere on a line
const DIRECTIVE_REGEX = /@eureka-radar\s+(\w+)\b(.*)$/

// Matches key=value pairs — value is either a bare token or a double-quoted string
const TOKEN_REGEX = /(\w+)=("(?:[^"\\]|\\.)*"|[^\s]+)/g

// Valid reasons for the 'ignore' action
const VALID_IGNORE_REASONS = new Set(['false-positive', 'accept-risk'])

/**
 * Parses the key=value tail of a directive into a plain object.
 * Handles quoted values with spaces, e.g. comment="needs refactor"
 */
function tokenizeParams(tail) {
  const params = {}
  const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags)
  let match
  while ((match = regex.exec(tail)) !== null) {
    let value = match[2]
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"')
    }
    params[match[1]] = value
  }
  return params
}

/**
 * Runs git blame on a single line of a file and returns the commit author.
 * Returns null if git blame fails or the file is not tracked.
 */
const blameCache = new Map()
function blameAuthor(root, relativePath, lineNumber) {
  const key = `${relativePath}:${lineNumber}`
  if (blameCache.has(key)) return blameCache.get(key)
  try {
    const output = execFileSync(
      'git',
      ['blame', '-L', `${lineNumber},${lineNumber}`, '--porcelain', '--', relativePath],
      { cwd: root }
    ).toString()
    const nameMatch = output.match(/^author (.+)$/m)
    const emailMatch = output.match(/^author-mail <(.+)>$/m)
    const name = nameMatch?.[1]?.trim()
    const email = emailMatch?.[1]?.trim()
    const author = (!name || !email || email === 'not.committed.yet') ? null : { name, email }
    blameCache.set(key, author)
    return author
  } catch {
    blameCache.set(key, null)
    return null
  }
}

/**
 * Scans a single file for @eureka-radar directives and returns any found.
 * `relativePath` should already be the normalized URI from the SARIF result.
 */
function scanFile(filePath, relativePath, root) {
  const directives = []
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch {
    return directives
  }

  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(DIRECTIVE_REGEX)
    if (!match) continue

    const action = match[1]
    const params = tokenizeParams(match[2].trim())

    // Only 'ignore' is supported for now
    if (action !== 'ignore') continue

    // 'reason' is required and must be a known value
    if (!params.reason || !VALID_IGNORE_REASONS.has(params.reason)) continue

    const lineNumber = i + 1 // 1-indexed to match SARIF region.startLine
    const directive = {
      filePath: relativePath,
      lineNumber,
      action,
      reason: params.reason,
      rawDirective: lines[i].trim(),
    }

    if (params.comment) directive.comment = params.comment

    if (root) {
      const author = blameAuthor(root, relativePath, lineNumber)
      if (author) directive.author = author
    }

    directives.push(directive)
  }

  return directives
}

/**
 * Collects all unique file URIs referenced across every result in the SARIF.
 */
function collectUris(sarif) {
  const uris = new Set()
  for (const run of sarif.runs ?? []) {
    for (const result of run.results ?? []) {
      for (const location of result.locations ?? []) {
        const uri = location?.physicalLocation?.artifactLocation?.uri
        if (uri) uris.add(uri)
      }
    }
  }
  return uris
}

/**
 * Scans only the files referenced in SARIF results for @eureka-radar directives
 * and embeds the consolidated list into sarif.properties.EUREKA_IGNORE_DIRECTIVES.
 *
 * Called after the normalize transform so that file URIs are relative to the
 * repo root and will match the normalized URIs in SARIF results.
 *
 * @param {object} sarif  - The SARIF object to mutate
 * @param {string} target - The scan target directory
 * @param {string} root   - The git repo root directory
 */
module.exports = (sarif, target, root) => {
  const effectiveRoot = root ?? target
  const uris = collectUris(sarif)

  if (uris.size === 0) return

  const rootAbs = path.resolve(effectiveRoot)
  const directives = []
  for (const uri of uris) {
    if (uri.includes('://')) continue
    let rel
    try {
      rel = decodeURIComponent(uri)
    } catch {
      continue
    }
    const abs = path.resolve(rootAbs, rel)
    if (!abs.startsWith(rootAbs + path.sep)) continue

    directives.push(...scanFile(abs, rel, rootAbs))
  }

  if (directives.length === 0) return

  sarif.properties = sarif.properties ?? {}
  sarif.properties.EUREKA_IGNORE_DIRECTIVES = directives
}
