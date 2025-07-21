module.exports = {
  transforms: {
    escalate: require('./transforms/escalate'),
    merge: require('./transforms/merge'),
    normalize: require('./transforms/normalize')
  },
  analysis: {
    load: require('./analysis/load'),
    summarize: require('./analysis/summarize')
  },
  visualizations: {
    display_findings: require('./visualizations/display_findings'),
    display_totals: require('./visualizations/display_totals')
  }
}
