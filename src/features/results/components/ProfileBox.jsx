import { useTyping } from '../../../hooks/useTyping'
import styles from './ProfileBox.module.css'

export default function ProfileBox({ profile, model, promptVersion }) {
  const { displayed } = useTyping(profile, 10, 100)

  return (
    <div className={styles.box}>
      <div className={styles.badge}>
        AI INFERRED - {model}{promptVersion ? ` - ${promptVersion}` : ''}
      </div>
      <p className={styles.text}>
        {displayed}
        {displayed.length < profile.length && <span className={styles.cursor} />}
      </p>
    </div>
  )
}
