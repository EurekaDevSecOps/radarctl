const humanizeDuration = require('humanize-duration')

const humanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms'
    }
  }
})

module.exports = {
  duration: (duration) => {
    return humanizer(duration, { units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'], round: true, spacer: '', delimiter: ' ' })
  }
}
