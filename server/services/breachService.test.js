import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBreachMatches } from './breachService.js'

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
