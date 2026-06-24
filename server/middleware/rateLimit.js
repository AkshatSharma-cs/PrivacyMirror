export function createRateLimiter({ windowMs, max, message }) {
  const buckets = new Map()

  return function rateLimiter(req, res, next) {
    const now = Date.now()
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const bucket = buckets.get(key)

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    bucket.count += 1
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(max - bucket.count, 0)))
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

    if (bucket.count > max) {
      return res.status(429).json({ error: message || 'Too many requests. Please wait and retry.' })
    }

    next()
  }
}
