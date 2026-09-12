import test from 'node:test'
import assert from 'node:assert/strict'
import { buildScanProfile, normalizeBreachMatches } from './breachService.js'

test('normalizes real breach directory data into internal breach objects (HIBP schema)', () => {
  const matches = [
    {
      Title: 'Adobe',
      BreachDate: '2013-10-04',
      PwnCount: 153000000,
      DataClasses: ['Email addresses', 'Passwords', 'Usernames'],
      IsVerified: true,
      IsSensitive: false,
      IsFabricated: false,
    },
  ]

  const normalized = normalizeBreachMatches(matches)

  assert.deepEqual(normalized, [
    {
      name: 'Adobe',
      year: 2013,
      records: '153m',
      types: ['Email', 'Password hash', 'Username'],
      severity: 'high',
    },
  ])
})

test('normalizes RapidAPI BreachDirectory format objects correctly (string and array sources, year null)', () => {
  const matches = [
    {
      email: 'test@example.com',
      sources: 'saveonlens.com',
      hash_password: true,
      password: '0844',
      sha1: '5dbadc80815bb1554e48667c816d8628f6b80541',
    },
    {
      email: 'test@example.com',
      sources: ['dropbox.com', 'other.com'],
      hash_password: true,
      sha1: 'abc123456',
    },
  ]

  const normalized = normalizeBreachMatches(matches)

  assert.equal(normalized.length, 2)
  assert.equal(normalized[0].name, 'Saveonlens')
  assert.equal(normalized[0].year, null)
  assert.ok(normalized[0].types.includes('Password plaintext'))
  assert.equal(normalized[0].severity, 'critical')

  assert.equal(normalized[1].name, 'Dropbox')
  assert.equal(normalized[1].year, null)
  assert.ok(!normalized[1].types.includes('Password plaintext'))
  assert.ok(normalized[1].types.includes('Password hash'))
  assert.equal(normalized[1].severity, 'high')
})

test('returns a neutral clean profile when a fresh email has no live breach matches', async () => {
  const originalFetch = global.fetch
  const originalApiKey = process.env.BREACH_DIRECTORY_API_KEY
  process.env.BREACH_DIRECTORY_API_KEY = 'test-key'
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ success: true, found: 0, result: [] }),
  })

  try {
    const profile = await buildScanProfile('fresh@example.com')

    assert.equal(profile.creepyScore, 0)
    assert.equal(profile.scoreLabel, 'CLEAN')
    assert.equal(profile.breaches.length, 0)
    assert.match(profile.profile, /No live breach matches were found/)
  } finally {
    global.fetch = originalFetch
    if (originalApiKey === undefined) {
      delete process.env.BREACH_DIRECTORY_API_KEY
    } else {
      process.env.BREACH_DIRECTORY_API_KEY = originalApiKey
    }
  }
})

test('falls back to a local profile when BreachDirectory is unavailable', async () => {
  const originalFetch = global.fetch
  const originalApiKey = process.env.BREACH_DIRECTORY_API_KEY
  process.env.BREACH_DIRECTORY_API_KEY = 'test-key'
  global.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ message: 'rate limited' }),
  })

  try {
    const profile = await buildScanProfile('fresh@example.com')

    assert.equal(profile.source, 'local-profile')
    assert.equal(profile.lookupUnavailable, true)
    assert.ok(profile.breaches.length > 0)
  } finally {
    global.fetch = originalFetch
    if (originalApiKey === undefined) {
      delete process.env.BREACH_DIRECTORY_API_KEY
    } else {
      process.env.BREACH_DIRECTORY_API_KEY = originalApiKey
    }
  }
})
