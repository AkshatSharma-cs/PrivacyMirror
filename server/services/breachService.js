import { BREACH_POOL, PROFILES, generateFallback } from '../data/profiles.js'

const SEVERITY_WEIGHT = {
  clean: 0,
  low: 6,
  medium: 12,
  high: 18,
  critical: 26,
}

const DATA_TYPE_WEIGHT = {
  'password plaintext': 20,
  'password vault': 22,
  'mfa seeds': 20,
  ssn: 22,
  'ssn partial': 16,
  passport: 18,
  card: 18,
  'card partial': 12,
  'health records': 18,
  'health data': 14,
  'medical history': 18,
  'account passcode': 18,
  'account pin': 18,
  '2fa codes': 18,
  address: 10,
  dob: 8,
  phone: 6,
  'password hash': 10,
  email: 2,
}

export function getBreachPool() {
  const seen = new Set()
  return BREACH_POOL.filter(breach => {
    const key = `${breach.name.toLowerCase()}-${breach.year}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function calculateExposureScore(breaches) {
  if (!breaches?.length) return 0

  const raw = breaches.reduce((total, breach) => {
    const severity = SEVERITY_WEIGHT[breach.severity] || 8
    const dataTypes = breach.types.reduce((sum, type) => {
      return sum + (DATA_TYPE_WEIGHT[String(type).toLowerCase()] || 3)
    }, 0)
    return total + severity + Math.min(dataTypes, 42)
  }, 0)

  const breadth = Math.min(breaches.length * 4, 18)
  return Math.min(100, Math.round(raw * 0.72 + breadth))
}

export function scoreMetadata(score) {
  if (score === 0) {
    return {
      scoreLabel: 'CLEAN',
      scoreColor: 'var(--green)',
      headline: 'No simulated breach exposure detected.',
    }
  }
  if (score < 35) {
    return {
      scoreLabel: 'LOW EXPOSURE',
      scoreColor: 'var(--green)',
      headline: 'Limited exposure detected.',
    }
  }
  if (score < 65) {
    return {
      scoreLabel: 'MODERATE RISK',
      scoreColor: 'var(--yellow)',
      headline: 'Moderate footprint across platforms.',
    }
  }
  if (score < 85) {
    return {
      scoreLabel: 'HIGH RISK',
      scoreColor: 'var(--orange)',
      headline: 'Significant exposure. Action recommended.',
    }
  }
  return {
    scoreLabel: 'CRITICAL EXPOSURE',
    scoreColor: 'var(--red)',
    headline: 'Severely compromised across the web.',
  }
}

const DEFAULT_BREACH_LOOKUP_TIMEOUT_MS = 6000

function toRecordsLabel(count) {
  if (!Number.isFinite(count) || count <= 0) return 'unknown'
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(0)}b`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(0)}m`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`
  return String(count)
}

function hasDataClass(dataClasses, keyword) {
  return dataClasses.some(type => {
    const normalized = String(type).toLowerCase()
    const words = normalized.split(/[^a-z]+/).filter(Boolean)
    return words.some(word => word === keyword || word === `${keyword}s`)
  })
}

function toNormalizedTypes(dataClasses = []) {
  const classes = dataClasses.map(type => String(type).toLowerCase())
  const types = []

  const addType = (type, condition) => {
    if (condition && !types.includes(type)) {
      types.push(type)
    }
  }

  addType('Email', hasDataClass(classes, 'email'))
  addType('Password hash', hasDataClass(classes, 'password') || hasDataClass(classes, 'passphrase'))
  addType('Username', hasDataClass(classes, 'username'))
  addType('Phone', hasDataClass(classes, 'phone'))
  addType('Name', hasDataClass(classes, 'name'))
  addType('DOB', hasDataClass(classes, 'dob') || hasDataClass(classes, 'birth'))
  addType('Address', hasDataClass(classes, 'address'))
  addType('SSN', hasDataClass(classes, 'ssn') || hasDataClass(classes, 'social') || hasDataClass(classes, 'tax'))
  addType('Card', hasDataClass(classes, 'card') || hasDataClass(classes, 'credit'))
  addType('Health data', hasDataClass(classes, 'health'))
  addType('Passport', hasDataClass(classes, 'passport'))
  addType('IP address', hasDataClass(classes, 'ip'))

  return types
}

export function normalizeBreachMatches(matches = []) {
  return matches
    .filter(match => !match?.IsFabricated && !match?.IsSensitive)
    .map(match => {
      const breachDate = match?.BreachDate || match?.BreachDate || ''
      const year = Number.parseInt(String(breachDate).slice(0, 4), 10) || new Date().getFullYear()
      const dataClasses = Array.isArray(match?.DataClasses) ? match.DataClasses : []
      const types = toNormalizedTypes(dataClasses)
      const severity = match?.IsVerified ? 'high' : 'medium'

      return {
        name: match?.Title || 'Unknown breach',
        year,
        records: toRecordsLabel(Number(match?.PwnCount) || 0),
        types: types.length ? types : ['Email'],
        severity,
      }
    })
    .slice(0, 6)
}

async function lookupBreachMatches(email) {
  const apiKey = process.env.BREACH_DIRECTORY_API_KEY || process.env.RAPIDAPI_KEY || ''
  const endpoint = process.env.BREACH_DIRECTORY_ENDPOINT || 'https://breachdirectory.p.rapidapi.com/'
  const host = process.env.BREACH_DIRECTORY_HOST || 'breachdirectory.p.rapidapi.com'

  if (!apiKey || apiKey.includes('your-')) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_BREACH_LOOKUP_TIMEOUT_MS)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) return []
    const payload = await response.json()
    const matches = Array.isArray(payload) ? payload : payload?.result || []
    return normalizeBreachMatches(matches)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

export async function buildScanProfile(email) {
  const base = PROFILES[email] || generateFallback(email)
  const remoteBreaches = await lookupBreachMatches(email)
  const breaches = remoteBreaches.length ? remoteBreaches : base.breaches || []
  const creepyScore = calculateExposureScore(breaches)
  const metadata = scoreMetadata(creepyScore)

  return {
    ...base,
    ...metadata,
    creepyScore,
    breaches,
    source: remoteBreaches.length ? 'breach-directory' : 'local-profile',
  }
}
