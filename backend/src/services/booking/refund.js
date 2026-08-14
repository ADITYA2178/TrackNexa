import { formatPgDate } from "../../utils/dates.js"
/**
 * Refund policy (based on hours until journey date start of day):
 *  >= 48h  → 100%
 *  >= 12h  → 75%
 *  >= 4h   → 50%
 *  else    → 0% (still allow cancel before journey day ends)
 * Past journey date → cannot cancel
 */
const calculateRefund = (totalFare, journeyDate) => {
  const fare = Math.max(Number(totalFare) || 0, 0)
  const journey = journeyDate instanceof Date
    ? new Date(journeyDate.getFullYear(), journeyDate.getMonth(), journeyDate.getDate())
    : new Date(`${formatPgDate(journeyDate)}T00:00:00`)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (journey < startOfToday) {
    return {
      allowed: false,
      refundAmount: 0,
      refundPercent: 0,
      policy: 'JOURNEY_STARTED',
    }
  }

  const hoursUntil = (journey.getTime() - now.getTime()) / (1000 * 60 * 60)
  let refundPercent = 0
  let policy = 'WITHIN_4H'

  if (hoursUntil >= 48) {
    refundPercent = 100
    policy = 'GE_48H'
  } else if (hoursUntil >= 12) {
    refundPercent = 75
    policy = 'GE_12H'
  } else if (hoursUntil >= 4) {
    refundPercent = 50
    policy = 'GE_4H'
  }

  const refundAmount = Math.round(((fare * refundPercent) / 100) * 100) / 100

  return {
    allowed: true,
    refundAmount,
    refundPercent,
    policy,
    hoursUntil: Math.round(hoursUntil * 10) / 10,
  }
}

export { calculateRefund }