import crypto from 'node:crypto'
import { PROMPT_VERSION, SYSTEM_PROMPTS } from '../constants/aiPrompts.js'
import { TtlCache } from '../utils/cache.js'
import { safeJsonParse } from '../utils/sanitize.js'

const cache = new TtlCache(15 * 60 * 1000, 500)

function cacheKey(kind, payload) {
  return crypto
    .createHash('sha256')
    .update(`${PROMPT_VERSION}:${kind}:${JSON.stringify(payload)}`)
    .digest('hex')
}

async function chatCompletion({ env, kind, userPrompt, maxTokens = 500 }) {
  if (!env.geminiApiKey) return null

  const key = cacheKey(kind, { model: env.aiModel, userPrompt })
  const cached = cache.get(key)
  if (cached) return { ...cached, cached: true }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.geminiApiKey}`,
    },
    body: JSON.stringify({
      model: env.aiModel,
      max_tokens: maxTokens,
      temperature: 0.25,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[kind] },
        { role: 'user', content: userPrompt },
      ],
    }),
  }).finally(() => clearTimeout(timeout))

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`AI provider failed with ${response.status}: ${detail.slice(0, 160)}`)
  }

  const json = await response.json()
  const text = json.choices?.[0]?.message?.content?.replace(/```json|```/g, '').trim() || ''
  return cache.set(key, {
    text,
    cached: false,
    model: json.model || env.aiModel,
    promptVersion: PROMPT_VERSION,
  })
}

function summarizeBreaches(breaches) {
  return breaches.length === 0
    ? 'No breaches found.'
    : breaches.map(b => `${b.name} (${b.year}, ${b.severity}): ${b.types.join(', ')}`).join('\n')
}

export async function generateProfileInference(env, { email, breaches, creepyScore, fallbackProfile }) {
  let result = null
  try {
    result = await chatCompletion({
      env,
      kind: 'profile',
      maxTokens: 300,
      userPrompt: `Email scanned: ${email}
Exposure score: ${creepyScore}/100
Breach metadata:
${summarizeBreaches(breaches)}

Write one 3-sentence paragraph. Mention uncertainty where inference is weak. Reference concrete breach/platform metadata when present. Plain text only.`,
    })
  } catch (error) {
    logAiFallback(`Profile AI fallback: ${error.message}`)
  }

  return {
    text: result?.text || fallbackProfile,
    model: result?.model || env.aiModel,
    cached: Boolean(result?.cached),
    promptVersion: PROMPT_VERSION,
  }
}

export async function generateThreatIntel(env, { email, breaches }) {
  let result = null
  try {
    result = await chatCompletion({
      env,
      kind: 'threatIntel',
      maxTokens: 500,
      userPrompt: `Email: ${email}
Known breach metadata:
${summarizeBreaches(breaches)}

Return ONLY this JSON shape:
{
  "darkWebMentions": <number 0-50 based on breach count/severity, simulated estimate only>,
  "dataForSale": <boolean based on sensitive data types>,
  "estimatedDataPrice": <string based on exposed data type sensitivity>,
  "activeThreats": [
    { "type": <string>, "likelihood": <"Low"|"Medium"|"High"|"Critical">, "detail": <string referencing breach names> }
  ],
  "compromisedServices": [<strings>],
  "recommendation": <string>
}`,
    })
  } catch (error) {
    logAiFallback(`Threat intel AI fallback: ${error.message}`)
  }

  return {
    data: safeJsonParse(result?.text) || buildDeterministicThreatIntel(breaches),
    model: result?.model || env.aiModel,
    cached: Boolean(result?.cached),
    promptVersion: PROMPT_VERSION,
  }
}

export async function analysePhishingUrl(env, input) {
  let result = null
  try {
    result = await chatCompletion({
      env,
      kind: 'phishing',
      maxTokens: 500,
      userPrompt: `URL: ${input.normalizedUrl}
Hostname: ${input.hostname}

Return ONLY this JSON shape:
{
  "riskScore": <0-100>,
  "verdict": <"Safe" | "Suspicious" | "Likely Phishing" | "Phishing">,
  "verdictColor": <"#00e676" | "#ffc847" | "#ff6b35" | "#ff2d55">,
  "indicators": [
    { "flag": <string>, "detail": <string>, "severity": <"low"|"medium"|"high"> }
  ],
  "legitimateSite": <null|string>,
  "recommendation": <string>
}`,
    })
  } catch (error) {
    logAiFallback(`Phishing AI fallback: ${error.message}`)
  }

  return {
    data: safeJsonParse(result?.text) || buildDeterministicUrlAnalysis(input.normalizedUrl),
    model: result?.model || env.aiModel,
    cached: Boolean(result?.cached),
    promptVersion: PROMPT_VERSION,
  }
}

function logAiFallback(message) {
  // Keep detached Windows dev processes alive even when stdout/stderr are unavailable.
  void message
}

function buildDeterministicThreatIntel(breaches) {
  const sensitive = ['Card', 'SSN', 'Password plaintext', 'Password hash', 'DOB', 'Health', 'Passport', 'Financial']
  const exposed = new Set(breaches.flatMap(b => b.types))
  const dataForSale = [...exposed].some(type => sensitive.some(s => type.toLowerCase().includes(s.toLowerCase())))
  const criticalCount = breaches.filter(b => b.severity === 'critical').length
  const darkWebMentions = Math.min(50, breaches.length * 4 + criticalCount * 8)

  return {
    darkWebMentions,
    dataForSale,
    estimatedDataPrice: dataForSale ? (criticalCount ? '$150.00+' : '$25.00') : '$2.30',
    activeThreats: breaches.length
      ? [{ type: 'Credential stuffing', likelihood: criticalCount ? 'Critical' : 'Medium', detail: `Risk is based on ${breaches.map(b => b.name).slice(0, 3).join(', ')} exposure.` }]
      : [],
    compromisedServices: [...exposed].some(type => String(type).toLowerCase().includes('password')) ? ['Email', 'Social accounts', 'Shopping accounts'] : ['Marketing lists'],
    recommendation: breaches.length ? 'Rotate passwords on affected services and enable app-based multi-factor authentication.' : 'Keep using unique aliases and monitor for future breach notifications.',
  }
}

function buildDeterministicUrlAnalysis(url) {
  const parsed = new URL(url)
  const host = parsed.hostname.toLowerCase()
  const indicators = []
  if (/\d+\.\d+\.\d+\.\d+/.test(host)) indicators.push({ flag: 'IP host', detail: 'The URL uses an IP address instead of a recognizable domain.', severity: 'high' })
  if (host.includes('xn--') || /[^\u0000-\u007f]/.test(host)) indicators.push({ flag: 'Homograph', detail: 'The domain may contain lookalike Unicode characters.', severity: 'high' })
  if ((host.match(/-/g) || []).length >= 2) indicators.push({ flag: 'Hyphenated domain', detail: 'Multiple hyphens can indicate brand impersonation.', severity: 'medium' })
  if (/(paypa1|g00gle|micros0ft|login|verify|secure)/.test(host + parsed.pathname)) indicators.push({ flag: 'Impersonation language', detail: 'The URL contains login or verification wording often used in phishing.', severity: 'medium' })

  const riskScore = Math.min(100, indicators.reduce((sum, item) => sum + (item.severity === 'high' ? 35 : 18), 5))
  const verdict = riskScore >= 75 ? 'Phishing' : riskScore >= 50 ? 'Likely Phishing' : riskScore >= 25 ? 'Suspicious' : 'Safe'
  const verdictColor = riskScore >= 75 ? '#ff2d55' : riskScore >= 50 ? '#ff6b35' : riskScore >= 25 ? '#ffc847' : '#00e676'

  return {
    riskScore,
    verdict,
    verdictColor,
    indicators,
    legitimateSite: host.includes('paypa1') ? 'paypal.com' : null,
    recommendation: riskScore >= 25 ? 'Do not enter credentials unless you can verify the destination independently.' : 'No obvious phishing indicators were detected, but still verify before entering sensitive data.',
  }
}
