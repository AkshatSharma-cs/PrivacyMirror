import { useState } from 'react'
import LandingScreen from './features/scan/components/LandingScreen'
import ScanScreen from './features/scan/components/ScanScreen'
import ResultsScreen from './features/results/components/ResultsScreen'
import { scanEmail } from './services/apiClient'
import { useAsyncData } from './hooks/useAsyncData'

export default function App() {
  const [phase, setPhase] = useState('landing')
  const [email, setEmail] = useState('')
  const [data, setData] = useState(null)
  const [scanError, setScanError] = useState('')
  const scanRequest = useAsyncData(
    ({ signal }, value) => scanEmail(value, signal),
    { retries: 3, baseDelay: 500 }
  )

  async function handleScan(inputEmail) {
    setEmail(inputEmail)
    setData(null)
    setScanError('')
    setPhase('scanning')

    try {
      const result = await scanRequest.execute(inputEmail)
      if (result?.data) {
        setData(result.data)
        setPhase('results')
      }
    } catch (error) {
      setScanError(error.message || 'Scan failed. Please retry.')
      setPhase('landing')
    }
  }

  function handleReset() {
    setPhase('landing')
    setEmail('')
    setData(null)
    setScanError('')
    scanRequest.reset()
  }

  return (
    <>
      {phase === 'landing' && <LandingScreen onScan={handleScan} serverError={scanError} />}
      {phase === 'scanning' && <ScanScreen email={email} />}
      {phase === 'results' && data && (
        <ResultsScreen email={email} data={data} onReset={handleReset} />
      )}
    </>
  )
}
