const COMMON_PATTERNS = [
  /password/i,
  /qwerty/i,
  /admin/i,
  /letmein/i,
  /welcome/i,
  /123456/,
]

export function analysePasswordStrength(password) {
  const charset =
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/\d/.test(password) ? 10 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 33 : 0)

  const entropy = Math.max(0, Math.round(password.length * Math.log2(Math.max(charset, 1))))
  const issues = []
  const suggestions = []

  if (password.length < 12) {
    issues.push('Password is shorter than the current 12-character minimum recommendation.')
    suggestions.push('Use at least 14 characters, preferably a generated passphrase.')
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    issues.push('Password does not mix upper and lower case letters.')
  }
  if (!/\d/.test(password)) issues.push('Password has no numbers.')
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Password has no symbols.')
  if (COMMON_PATTERNS.some(pattern => pattern.test(password))) {
    issues.push('Password contains a common breached pattern.')
    suggestions.push('Avoid dictionary words, keyboard walks, names, and predictable substitutions.')
  }
  if (/(.)\1{2,}/.test(password)) {
    issues.push('Password contains repeated characters.')
  }
  if (suggestions.length < 3) suggestions.push('Use a password manager to generate unique credentials for every service.')
  if (suggestions.length < 3) suggestions.push('Enable multi-factor authentication for accounts that support it.')

  const penalty = issues.length * 8 + (COMMON_PATTERNS.some(pattern => pattern.test(password)) ? 18 : 0)
  const score = Math.max(0, Math.min(100, entropy + password.length * 2 - penalty))
  const strength = score >= 85 ? 'Very Strong' : score >= 70 ? 'Strong' : score >= 50 ? 'Fair' : score >= 30 ? 'Weak' : 'Very Weak'

  return {
    score,
    strength,
    crackTime: estimateCrackTime(entropy),
    issues: issues.slice(0, 4),
    suggestions: suggestions.slice(0, 3),
    entropy,
    pwnedLikely: score < 45 || COMMON_PATTERNS.some(pattern => pattern.test(password)),
  }
}

function estimateCrackTime(entropy) {
  const guessesPerSecond = 100_000_000_000
  const seconds = Math.pow(2, entropy) / guessesPerSecond
  if (seconds < 1) return 'less than 1 second'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`
  return 'centuries'
}
