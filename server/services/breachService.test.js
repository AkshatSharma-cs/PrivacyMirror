import test from 'node:test'
import assert from 'node:assert/strict'
import { buildScanProfile, normalizeBreachMatches } from './breachService.js'

test('normalizes real breach directory data into internal breach objects', () => {
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

test('returns a neutral clean profile when a fresh email has no live breach matches', async () => {
  const originalFetch = global.fetch
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
  }
})
