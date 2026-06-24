import { useState } from 'react'
import { analyseURL } from '../../../services/apiClient'
import { useAsyncData } from '../../../hooks/useAsyncData'
import styles from './PhishingDetector.module.css'

const SEVERITY_COLOR = { low: 'var(--text-dim)', medium: 'var(--yellow)', high: 'var(--red)' }

export default function PhishingDetector() {
  const [url, setUrl] = useState('')
  const { data: result, error, loading, execute, reset } = useAsyncData(
    ({ signal }, value) => analyseURL(value, signal),
    { retries: 2, baseDelay: 300 }
  )

  function handleAnalyse() {
    if (url.trim()) execute(url.trim())
  }

  function useExample(value) {
    setUrl(value)
    reset()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Paste a suspicious URL to analyse..."
          value={url}
          onChange={event => { setUrl(event.target.value); reset() }}
          onKeyDown={event => event.key === 'Enter' && handleAnalyse()}
          aria-label="URL to analyse"
          spellCheck={false}
        />
        <button className={styles.btn} onClick={handleAnalyse} disabled={loading || !url.trim()}>
          {loading ? 'Scanning...' : 'Analyse'}
        </button>
      </div>

      <div className={styles.examples}>
        Try:
        <button type="button" onClick={() => useExample('paypa1-secure-login.com/account/verify')}>paypa1-secure-login.com</button>
        <button type="button" onClick={() => useExample('https://google.com')}>google.com</button>
        <button type="button" onClick={() => useExample('http://amazon.com.login-verify.ru/secure')}>amazon.com.login-verify.ru</button>
      </div>

      {loading && (
        <div className={styles.scanBox} aria-live="polite">
          <div className={styles.scanHeader}>
            <span className={styles.scanPulse} />
            Scanning URL...
          </div>
          <div className={styles.urlPreview}>{url}</div>
          <div className={styles.scanLineVisible}>Checking structure, domain deception, and phishing indicators.</div>
          <div className={styles.scanProgress}>
            <div className={styles.scanProgressFill} style={{ width: '72%' }} />
          </div>
        </div>
      )}

      {error && <div className={styles.error} role="alert">{error.message}</div>}

      {result && (
        <div className={styles.result}>
          <div className={styles.verdict} style={{ borderLeftColor: result.verdictColor }}>
            <div className={styles.verdictScore} style={{ color: result.verdictColor }}>
              {result.riskScore}<span className={styles.verdictSlash}>/100</span>
            </div>
            <div>
              <div className={styles.verdictLabel} style={{ color: result.verdictColor }}>{result.verdict}</div>
              {result.legitimateSite && (
                <div className={styles.impersonating}>
                  Impersonating: <strong>{result.legitimateSite}</strong>
                </div>
              )}
              <div className={styles.recommendation}>{result.recommendation}</div>
            </div>
          </div>

          {result.indicators?.length > 0 && (
            <div className={styles.indicators}>
              <div className={styles.indicatorsLabel}>Indicators detected</div>
              {result.indicators.map(indicator => (
                <div key={`${indicator.flag}-${indicator.detail}`} className={styles.indicator}>
                  <span className={styles.indicatorFlag} style={{ color: SEVERITY_COLOR[indicator.severity] }}>
                    [{indicator.flag}]
                  </span>
                  <span className={styles.indicatorDetail}>{indicator.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
