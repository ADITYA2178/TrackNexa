import { useEffect, useMemo, useState } from 'react'

export default function useHoldCountdown(heldUntil) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!heldUntil) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [heldUntil])

  return useMemo(() => {
    if (!heldUntil) return null
    const end = new Date(heldUntil).getTime()
    if (Number.isNaN(end)) return null
    const remainingMs = Math.max(0, end - now)
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return {
      expired: remainingMs <= 0,
      label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      remainingMs,
    }
  }, [heldUntil, now])
}
