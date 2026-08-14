import * as paymentService from '../services/payment.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createOrder = asyncHandler(async (req, res) => {
  const { holdId, userId } = req.body || {}

  const data = await paymentService.createPaymentOrder({
    holdId,
    userId,
  })

  const statusCode = data.reused ? 200 : 201
  return res.status(statusCode).json(data)
})

const verify = asyncHandler(async (req, res) => {
  const {
    paymentId,
    orderId,
    providerTxnId,
    providerSignature,
    // Explicitly ignored if present — never trusted
    amount: _ignoredAmount,
    status: _ignoredStatus,
    paymentStatus: _ignoredPaymentStatus,
  } = req.body || {}

  const data = await paymentService.verifyPayment({
    paymentId,
    orderId,
    providerTxnId,
    providerSignature,
  })

  return res.status(200).json(data)
})

export { createOrder, verify }
