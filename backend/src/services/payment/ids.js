import crypto from "crypto"
function generatePaymentId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `PAY-${stamp}-${rand}`
}

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `ORD-${stamp}-${rand}`
}

export { generatePaymentId, generateOrderId }