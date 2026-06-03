const parseRepositorySegments = (segments) => {
  if (!Array.isArray(segments) || segments.length < 2) return null
  if (segments.some((segment) => !segment)) return null

  const segmentFormat = /^[a-zA-Z0-9_.-]+$/

  if (segments.some((segment) => !segmentFormat.test(segment))) return null
  const owner = segments[0]
  const name = segments[segments.length - 1]
  const path = segments.length > 2 ? segments.slice(1, -1).join('/') : ''

  const fullName = path ? `${owner}/${path}/${name}` : `${owner}/${name}`

  return { fullName, owner, path, name }
}

const parseRepositoryValue = (value) => {
  if (!value) return null
  const segments = value.split('/').map((segment) => segment.trim())

  return parseRepositorySegments(segments)
}

const parseRepositoryFromSarif = (sarif) => {
  let resolved = null
  for (const run of sarif?.runs ?? []) {
    const repo =
      run?.tool?.driver?.properties?.repository ??
      run?.properties?.repository
    if (!repo) continue
    if (typeof repo?.owner !== 'string' || typeof repo?.name !== 'string') continue

    const owner = repo.owner.trim()
    const name = repo.name.trim()
    if (!owner || !name) continue

    const path = typeof repo.path === 'string' ? repo.path.trim() : ''
    const fullName = path ? `${owner}/${path}/${name}` : `${owner}/${name}`

    const current = { fullName, owner, path, name }

    if (!resolved) {
      resolved = current
      continue
    }
    if (
      resolved.owner !== current.owner ||
      resolved.path !== current.path ||
      resolved.name !== current.name
    ) {
      throw new Error(
        `SARIF runs contain conflicting repository metadata: ` +
        `found '${resolved.fullName}' and '${current.fullName}'`
      )
    }
  }
  return resolved
}

module.exports = {
  parseRepositorySegments,
  parseRepositoryValue,
  parseRepositoryFromSarif
}
