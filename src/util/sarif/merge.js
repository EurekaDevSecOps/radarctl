/*
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const multitoolPath = require('@microsoft/sarif-multitool')
const path = require('node:path')
module.exports = {
  merge: async (outdir) => {
    const cmd = `${multitoolPath} merge ${path.join(outdir, '*.sarif')} --recurse false --output-directory=${outdir} --output-file=scan.sarif`
    const { stdout, stderr } = await exec(cmd)
  }
}
*/

const fs = require('node:fs')
const path = require('node:path')
module.exports = async (files, outfile) => {
  const sarif = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: []
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const scan = JSON.parse(content)
    for (const run of scan.runs) {
      const tool = {
        driver: {
          name: path.parse(file).name,
          semanticVersion: run.tool.driver.semanticVersion,
          informationUri: run.tool.driver.informationUri,
          properties: run.tool.driver.properties ?? {},
          rules: []
        }
      }

      tool.driver.properties.officialName = run.tool.driver.name

      const rules = new Map()
      for (const result of run.results) {
        rules.set(result.ruleId, true)
      }

      for (const rule of run.tool.driver.rules) {
        if (rules.has(rule.id)) {
          tool.driver.rules.push(rule)
        }
      }

      sarif.runs.push({ tool, invocations: run.invocations, results: run.results })
    }
  }

  fs.writeFileSync(outfile, JSON.stringify(sarif))
}
