import crypto from "crypto"
const generateHoldId = () => {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `HLD-${stamp}-${rand}`
}

const generatePnr = () => {
  // Unique 10-digit PNR (leading digit 1–9)
  return String(crypto.randomInt(1_000_000_000, 10_000_000_000))
}

export { generateHoldId, generatePnr }