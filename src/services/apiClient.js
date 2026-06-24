import { API_BASE_URL } from '../constants/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  const abortFromCaller = () => controller.abort()
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('The service is warming up or taking too long. Please retry.', 408)
    }
    throw error
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(payload?.error || 'Service temporarily unavailable.', response.status)
  }

  return payload
}

export function scanEmail(email, signal) {
  return request('/api/scan', {
    method: 'POST',
    signal,
    body: JSON.stringify({ email }),
  })
}

export function analysePassword(password, signal) {
  return request('/api/password', {
    method: 'POST',
    signal,
    body: JSON.stringify({ password }),
  }).then(payload => payload.data)
}

export function analyseURL(url, signal) {
  return request('/api/phishing', {
    method: 'POST',
    signal,
    body: JSON.stringify({ url }),
  }).then(payload => payload.data)
}
