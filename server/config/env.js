const DEFAULT_TRUSTED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function getEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const port = Number(process.env.PORT || 3001)
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || ''
  const trustedOrigins = (process.env.TRUSTED_ORIGINS || DEFAULT_TRUSTED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.')
  }

  if (!geminiApiKey && nodeEnv === 'production') {
    throw new Error('GEMINI_API_KEY is required in production.')
  }

  return {
    nodeEnv,
    port,
    geminiApiKey,
    trustedOrigins,
    aiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  }
}
