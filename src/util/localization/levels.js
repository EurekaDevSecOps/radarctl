module.exports = {
  sarif: {
    single: {
      error: 'error',
      warning: 'warning',
      note: 'note',
      suffix: ''
    },
    total: {
      issue: 'vulnerability',
      issues: 'vulnerabilities',
      error: 'error(s)',
      warning: 'warning(s)',
      note: 'note(s)'
    }
  },
  security: {
    single: {
      error: 'high',
      warning: 'moderate',
      note: 'low',
      suffix: ' severity'
    },
    total: {
      issue: 'vulnerability',
      issues: 'vulnerabilities',
      error: 'high',
      warning: 'moderate',
      note: 'low'
    }
  }
}
