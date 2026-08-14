/** Mirrors backend refund policy for preview only. */
export function estimateRefund(totalFare, journeyDate) {
  const fare = Math.max(Number(totalFare) || 0, 0)
  if (!journeyDate) {
    return { allowed: false, refundAmount: 0, refundPercent: 0, policy: 'UNKNOWN' }
  }

  const journey = new Date(`${String(journeyDate).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(journey.getTime())) {
    return { allowed: false, refundAmount: 0, refundPercent: 0, policy: 'UNKNOWN' }
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (journey < startOfToday) {
    return {
      allowed: false,
      refundAmount: 0,
      refundPercent: 0,
      policy: 'JOURNEY_STARTED',
      label: 'Journey date has passed — cancel not allowed',
    }
  }

  const hoursUntil = (journey.getTime() - now.getTime()) / (1000 * 60 * 60)
  let refundPercent = 0
  let policy = 'WITHIN_4H'
  let label = 'Less than 4 hours — no refund'

  if (hoursUntil >= 48) {
    refundPercent = 100
    policy = 'GE_48H'
    label = '48+ hours before journey — 100% refund'
  } else if (hoursUntil >= 12) {
    refundPercent = 75
    policy = 'GE_12H'
    label = '12–48 hours before journey — 75% refund'
  } else if (hoursUntil >= 4) {
    refundPercent = 50
    policy = 'GE_4H'
    label = '4–12 hours before journey — 50% refund'
  }

  return {
    allowed: true,
    refundAmount: Math.round(((fare * refundPercent) / 100) * 100) / 100,
    refundPercent,
    policy,
    hoursUntil: Math.round(hoursUntil * 10) / 10,
    label,
  }
}
