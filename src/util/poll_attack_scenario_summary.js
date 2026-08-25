const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

module.exports = async ({ receiveSummary, onPoll, intervalMs = POLL_INTERVAL_MS, timeoutMs = POLL_TIMEOUT_MS }) => {
  const startedAt = Date.now()
  let attempt = 1

  while (true) {
    const response = await receiveSummary()

    if (response?.status === 'completed') {
      onPoll?.({ attempt, status: 'completed' })
      return response.summary
    }

    if (response?.status !== 'pending') {
      throw new Error('Received an invalid attack scenario summary polling response')
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(`Timed out waiting for attack scenario summary after ${timeoutMs}ms`)
    }

    onPoll?.({ attempt, intervalMs, status: 'pending' })
    await wait(intervalMs)
    attempt++
  }
}
