const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g
const HTML_TAGS = /<[^>]*>/g

export function sanitizeText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(CONTROL_CHARS, '')
    .replace(HTML_TAGS, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeEmail(value) {
  return sanitizeText(value, 254).toLowerCase()
}

export function sanitizeUrl(value) {
  return sanitizeText(value, 2048)
}

export function safeJsonParse(text) {
  try {
    return JSON.parse(String(text || '').replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}
