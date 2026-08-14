function requestLogger(req, res, next) {
  const startedAt = Date.now()
  const { method, originalUrl, ip } = req

  const safeBody = sanitizeBody(req.body)

  console.log(
    `[REQ] ${method} ${originalUrl} | ip=${ip || '-'} | query=${JSON.stringify(req.query)} | body=${JSON.stringify(safeBody)}`,
  )

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    console.log(
      `[RES] ${method} ${originalUrl} | status=${res.statusCode} | ${durationMs}ms`,
    )
  })

  next()
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body

  const clone = { ...body }
  for (const key of Object.keys(clone)) {
    if (/password/i.test(key)) {
      clone[key] = '[REDACTED]'
    }
  }
  return clone
}

export default requestLogger