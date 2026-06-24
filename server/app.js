import express from 'express'
import cors from 'cors'
import { requestLogger } from './middleware/requestLogger.js'
import { createRateLimiter } from './middleware/rateLimit.js'
import { createApiRouter } from './routes/api.js'

export function createApp(env) {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  function isAllowedOrigin(origin) {
    if (!origin) return true
    if (env.trustedOrigins.includes(origin)) return true

    try {
      const { hostname, protocol } = new URL(origin)
      const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
      if ((protocol === 'http:' || protocol === 'https:') && localHosts.has(hostname)) {
        return true
      }
    } catch {
      // Ignore malformed origins and fall back to rejection.
    }

    return false
  }

  app.use(requestLogger)
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true)
      callback(new Error('Origin is not allowed by CORS.'))
    },
  }))
  app.use(express.json({ limit: '16kb', strict: true }))

  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'privacy-mirror-api',
      model: env.aiModel,
      aiConfigured: Boolean(env.geminiApiKey),
    })
  })

  app.use('/api', createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests. Please wait before scanning again.',
  }))
  app.use('/api', createApiRouter(env))

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' })
  })

  app.use((error, req, res, next) => {
    console.error(error.message)
    if (error.message.includes('CORS')) {
      return res.status(403).json({ error: 'Origin not allowed.' })
    }
    res.status(500).json({ error: 'Service temporarily unavailable. Please retry.' })
  })

  return app
}
