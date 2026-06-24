import styles from './ThreatIntel.module.css'

const LIKELIHOOD_COLOR = {
  Low: 'var(--text-dim)',
  Medium: 'var(--yellow)',
  High: 'var(--orange)',
  Critical: 'var(--red)',
}

export default function ThreatIntel({ data }) {
  if (!data) {
    return <div className={styles.error}>Threat intelligence unavailable. Please retry the scan.</div>
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: data.darkWebMentions > 10 ? 'var(--red)' : 'var(--orange)' }}>
            {data.darkWebMentions}
          </span>
          <span className={styles.statLabel}>Simulated mentions</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: data.dataForSale ? 'var(--red)' : 'var(--green)' }}>
            {data.dataForSale ? 'YES' : 'NO'}
          </span>
          <span className={styles.statLabel}>Data likely tradable</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: 'var(--orange)' }}>{data.estimatedDataPrice}</span>
          <span className={styles.statLabel}>Estimated value</span>
        </div>
      </div>

      {data.activeThreats?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Active threat vectors</div>
          {data.activeThreats.map((threat, index) => (
            <div key={`${threat.type}-${index}`} className={styles.threat}>
              <div className={styles.threatHeader}>
                <span className={styles.threatType}>{threat.type}</span>
                <span className={styles.threatLikelihood} style={{ color: LIKELIHOOD_COLOR[threat.likelihood] }}>
                  {threat.likelihood}
                </span>
              </div>
              <div className={styles.threatDetail}>{threat.detail}</div>
            </div>
          ))}
        </div>
      )}

      {data.compromisedServices?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Services at risk from credential reuse</div>
          <div className={styles.serviceList}>
            {data.compromisedServices.map(service => (
              <span key={service} className={styles.serviceTag}>{service}</span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.urgent}>
        <span className={styles.urgentIcon} aria-hidden="true">!</span>
        <span>{data.recommendation}</span>
      </div>
    </div>
  )
}
