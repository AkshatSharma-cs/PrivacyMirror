import { useCallback, useEffect, useRef, useState } from 'react'

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useAsyncData(asyncFn, { immediate = false, retries = 2, baseDelay = 300 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: false })
  const abortRef = useRef(null)

  const execute = useCallback(async (...args) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState(prev => ({ ...prev, loading: true, error: null }))

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const data = await asyncFn({ signal: controller.signal, attempt }, ...args)
        if (!controller.signal.aborted) {
          setState({ data, error: null, loading: false })
        }
        return data
      } catch (error) {
        if (controller.signal.aborted) return null
        if (attempt === retries) {
          setState({ data: null, error, loading: false })
          throw error
        }
        await wait(baseDelay * 2 ** attempt)
      }
    }

    return null
  }, [asyncFn, baseDelay, retries])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ data: null, error: null, loading: false })
  }, [])

  useEffect(() => {
    if (immediate) execute()
  }, [immediate])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return { ...state, execute, reset }
}
