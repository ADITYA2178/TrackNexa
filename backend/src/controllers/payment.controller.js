const paymentService = require('../services/payment.service')

async function createOrder(req, res) {
  try {
    const { holdId, userId } = req.body || {}

    const data = await paymentService.createPaymentOrder({
      holdId,
      userId,
    })

    const statusCode = data.reused ? 200 : 201
    return res.status(statusCode).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
      ...(err.pnr ? { pnr: err.pnr } : {}),
      ...(err.bookingId ? { bookingId: err.bookingId } : {}),
      ...(err.paymentId ? { paymentId: err.paymentId } : {}),
      ...(err.orderId ? { orderId: err.orderId } : {}),
    })
  }
}

async function verify(req, res) {
  try {
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
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
      ...(err.paymentStatus ? { paymentStatus: err.paymentStatus } : {}),
      ...(err.bookingStatus ? { bookingStatus: err.bookingStatus } : {}),
      ...(err.paymentId ? { paymentId: err.paymentId } : {}),
      ...(err.orderId ? { orderId: err.orderId } : {}),
    })
  }
}

module.exports = {
  createOrder,
  verify,
}
