const DEFAULT_MODEL = 'gemini-2.0-flash'

export async function askClaude(prompt, { model = DEFAULT_MODEL, signal } = {}) {
  const response = await fetch('/api/scan', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: prompt }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || 'AI request failed')
  }

  return response.json()
}

export async function askClaudeText(prompt, options = {}) {
  const result = await askClaude(prompt, options)
  return result?.data?.profile || result?.data?.threatIntel || result
}
