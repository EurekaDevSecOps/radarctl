module.exports = (sarif, diffRanges) => {
  for (const run of sarif.runs) {
    if (!run.results) continue
    run.results = run.results.filter(result => {
      if (!result.locations) return false
      return result.locations.every(loc => {
        const uri = loc.physicalLocation?.artifactLocation?.uri
        const line = loc.physicalLocation?.region?.startLine
        if (!uri || !line) return false
        const ranges = diffRanges.get(uri)
        if (!ranges) return false
        return ranges.some(([start, end]) => line >= start && line <= end)
      })
    })
  }
  return sarif
}
