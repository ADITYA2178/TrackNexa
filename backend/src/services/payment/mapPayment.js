function mapPaymentRow(row) {
  return {
    paymentId: row.payment_id,
    orderId: row.order_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    holdId: row.hold_id,
    bookingId: Number(row.booking_id),
    providerTxnId: row.provider_txn_id || null,
    paidAt: row.paid_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatAmount(amount) {
  return Number(amount).toFixed(2)
}

export { mapPaymentRow, formatAmount }