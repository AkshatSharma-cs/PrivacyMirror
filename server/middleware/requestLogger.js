import fs from 'node:fs'
import path from 'node:path'

const logFile = path.join(process.cwd(), 'server-requests.log')

export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\n`
    fs.appendFile(logFile, line, () => {})
  })
  next()
}
