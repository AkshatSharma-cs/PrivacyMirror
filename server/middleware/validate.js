import { sanitizeEmail, sanitizeText, sanitizeUrl } from '../utils/sanitize.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateScan(req, res, next) {
  const email = sanitizeEmail(req.body?.email)
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' })
  }
  req.validated = { email }
  next()
}

export function validatePassword(req, res, next) {
  const password = sanitizeText(req.body?.password, 256)
  if (password.length < 1 || password.length > 256) {
    return res.status(400).json({ error: 'Password must be between 1 and 256 characters.' })
  }
  req.validated = { password }
  next()
}

export function validateUrl(req, res, next) {
  const candidate = sanitizeUrl(req.body?.url)
  if (!candidate || candidate.length > 2048) {
    return res.status(400).json({ error: 'A URL is required.' })
  }

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`

  try {
    const parsed = new URL(withProtocol)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
    req.validated = { url: candidate, normalizedUrl: parsed.toString(), hostname: parsed.hostname }
    next()
  } catch {
    res.status(400).json({ error: 'Enter a valid HTTP or HTTPS URL.' })
  }
}
