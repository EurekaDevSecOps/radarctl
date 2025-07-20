module.exports = (file) => {
  // Load the given SARIF file into a JS object.
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
