import { useState } from 'react'
import styles from './LandingScreen.module.css'

const LOW_EMAILS  = ['safe@protonmail.com', 'newuser@outlook.com', 'privacy@tutanota.com']
const HIGH_EMAILS = ['john.smith@gmail.com', 'sarah.jones@hotmail.com', 'mike.wilson@yahoo.com']

export default function LandingScreen({ onScan, serverError = '' }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleScan() {
    const trimmed = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    onScan(trimmed)
  }

  function fillEmail(e) {
    setEmail(e)
    setError('')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.grid} />

      <header className={styles.header}>
        <div className={styles.eyebrow}>AMD Slingshot · AI + Cybersecurity</div>
        <h1 className={styles.title}>
          <span className={styles.titleMain}>PRIVACY</span>
          <span className={styles.titleAccent}>MIRROR</span>
        </h1>
        <p className={styles.sub}>
          Enter an email address. Watch AI reconstruct your digital identity in real time.
        </p>
      </header>

      <div className={styles.inputBlock}>
        <label className={styles.label} htmlFor="email-scan">Target email address</label>
        <div className={styles.inputRow}>
          <input
            id="email-scan"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            aria-invalid={Boolean(error || serverError)}
            aria-describedby={error || serverError ? 'scan-error' : undefined}
            autoFocus
            spellCheck={false}
          />
          <button className={styles.btn} onClick={handleScan} disabled={!email.trim()} aria-label="Scan email address">
            <span>SCAN</span>
            <span className={styles.btnArrow}>→</span>
          </button>
        </div>
        {(error || serverError) && <div id="scan-error" className={styles.error} role="alert">{error || serverError}</div>}
      </div>

      <div className={styles.demoPanel}>
        <div className={styles.demoPanelHeader}>Try these emails</div>
        <div className={styles.demoGroup}>
          <div className={styles.demoGroupLabel} data-risk="low">LOW RISK</div>
          <div className={styles.demoEmails}>
            {LOW_EMAILS.map(e => (
              <button key={e} className={styles.demoEmail} data-risk="low" onClick={() => fillEmail(e)} aria-label={`Use demo email ${e}`}>{e}</button>
            ))}
          </div>
        </div>
        <div className={styles.demoGroup}>
          <div className={styles.demoGroupLabel} data-risk="high">CRITICAL</div>
          <div className={styles.demoEmails}>
            {HIGH_EMAILS.map(e => (
              <button key={e} className={styles.demoEmail} data-risk="high" onClick={() => fillEmail(e)} aria-label={`Use demo email ${e}`}>{e}</button>
            ))}
          </div>
        </div>
        <div className={styles.demoNote}>Any other email generates a unique randomised result.</div>
      </div>
    </div>
  )
}
