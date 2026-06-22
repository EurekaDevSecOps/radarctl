const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/

// Returns Map<filePath, [startLine, endLine][]> of added-line ranges in the new file.
module.exports = (diffOutput) => {
  const ranges = new Map()
  let currentFile = null
  let lineNumber = 0

  for (const line of diffOutput.split('\n')) {
    if (line.startsWith('diff --git ')) {
      currentFile = null
      lineNumber = 0
      continue
    }

    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6)
      if (!ranges.has(currentFile)) ranges.set(currentFile, [])
      continue
    }

    const hunkMatch = line.match(HUNK_HEADER)
    if (hunkMatch) {
      lineNumber = parseInt(hunkMatch[1], 10)
      continue
    }

    if (!currentFile || lineNumber === 0) continue

    if (line.startsWith('+')) {
      const fileRanges = ranges.get(currentFile)
      const last = fileRanges[fileRanges.length - 1]
      if (last && last[1] === lineNumber - 1) {
        last[1] = lineNumber
      } else {
        fileRanges.push([lineNumber, lineNumber])
      }
      lineNumber++
    } else if (line.startsWith('-')) {
      // Deleted line — doesn't exist in new file, don't advance line counter
    } else {
      lineNumber++
    }
  }

  return ranges
}
