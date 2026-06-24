import { useState } from 'react'
import { analysePassword } from '../../../services/apiClient'
import { useAsyncData } from '../../../hooks/useAsyncData'
import styles from './PasswordChecker.module.css'

export default function PasswordChecker() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const { data: result, error, loading, execute, reset } = useAsyncData(
    ({ signal }, value) => analysePassword(value, signal),
    { retries: 2, baseDelay: 250 }
  )

  function handleCheck() {
    if (password.trim()) execute(password)
  }

  const scoreColor = result
    ? result.score >= 80 ? 'var(--green)'
    : result.score >= 60 ? 'var(--yellow)'
    : result.score >= 40 ? 'var(--orange)'
    : 'var(--red)'
    : 'var(--text-dim)'

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            type={show ? 'text' : 'password'}
            placeholder="Enter a password to analyse..."
            value={password}
            onChange={event => { setPassword(event.target.value); reset() }}
            onKeyDown={event => event.key === 'Enter' && handleCheck()}
            aria-label="Password to analyse"
            spellCheck={false}
          />
          <button className={styles.showBtn} onClick={() => setShow(current => !current)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? 'HIDE' : 'SHOW'}
          </button>
        </div>
        <button className={styles.analyseBtn} onClick={handleCheck} disabled={loading || !password.trim()}>
          {loading ? 'Scanning...' : 'Analyse'}
        </button>
      </div>

      {loading && (
        <div className={styles.scanBox} aria-live="polite">
          <div className={styles.scanHeader}>
            <span className={styles.scanPulse} />
            Analysing password...
          </div>
          <div className={styles.scanLineVisible}>Checking entropy, patterns, and crack-time estimate.</div>
          <div className={styles.scanProgress}>
            <div className={styles.scanProgressFill} style={{ width: '72%' }} />
          </div>
        </div>
      )}

      {error && <div className={styles.error} role="alert">{error.message}</div>}

      {result && (
        <div className={styles.result}>
          <div className={styles.scoreRow}>
            <div className={styles.scoreBar} aria-label={`Password score ${result.score} out of 100`}>
              <div className={styles.scoreBarFill} style={{ width: `${result.score}%`, background: scoreColor }} />
            </div>
            <span className={styles.scoreStrength} style={{ color: scoreColor }}>{result.strength}</span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Crack time</span>
              <span className={styles.statValue} style={{ color: scoreColor }}>{result.crackTime}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Entropy</span>
              <span className={styles.statValue}>{result.entropy} bits</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Commonly pwned</span>
              <span className={styles.statValue} style={{ color: result.pwnedLikely ? 'var(--red)' : 'var(--green)' }}>
                {result.pwnedLikely ? 'YES' : 'No'}
              </span>
            </div>
          </div>

          {result.issues?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Issues found</div>
              {result.issues.map(issue => (
                <div key={issue} className={styles.issue}>
                  <span className={styles.issueIcon} aria-hidden="true">x</span> {issue}
                </div>
              ))}
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Suggestions</div>
              {result.suggestions.map(suggestion => (
                <div key={suggestion} className={styles.suggestion}>
                  <span className={styles.suggIcon} aria-hidden="true">-</span> {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
