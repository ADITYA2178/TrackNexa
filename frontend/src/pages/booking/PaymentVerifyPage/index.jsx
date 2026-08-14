import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { getStoredActiveHold } from '../../../api/bookings'
import {
  buildProviderSignature,
  clearPendingPayment,
  generateProviderTxnId,
  getStoredPendingPayment,
  hasPaymentHmacSecret,
  storeConfirmedBooking,
  verifyPayment,
} from '../../../api/payments'
import MissingPaymentState from './MissingPaymentState'
import PaymentMethodForm from './PaymentMethodForm'
import VerifySuccessView from './VerifySuccessView'

export default function PaymentVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const hold = location.state?.hold ?? getStoredActiveHold()
  const payment =
    location.state?.payment ??
    (() => {
      const stored = getStoredPendingPayment()
      if (stored?.holdId && hold?.holdId && stored.holdId !== hold.holdId) return null
      return stored
    })()

  const [method, setMethod] = useState('upi')
  const [result, setResult] = useState(null)
  const hmacReady = hasPaymentHmacSecret()
  const amount = payment?.amount ?? hold?.fare?.totalFare

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!payment?.paymentId || !payment?.orderId) {
        throw new Error('Missing payment order. Go back and create one first.')
      }

      const providerTxnId = generateProviderTxnId()
      const providerSignature = await buildProviderSignature({
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        providerTxnId,
      })

      return verifyPayment({
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        providerTxnId,
        providerSignature,
      })
    },
    onSuccess: (data) => {
      storeConfirmedBooking(data)
      clearPendingPayment()
      setResult(data)
      toast.success(data?.message ?? 'Payment verified')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const sourceLabel =
    hold?.sourceStation?.code ?? hold?.sourceStation?.name ?? hold?.sourceStation
  const destLabel =
    hold?.destinationStation?.code ??
    hold?.destinationStation?.name ??
    hold?.destinationStation

  const pnr = result?.booking?.pnr ?? result?.ticket?.pnr
  const ticketPassengers = useMemo(
    () => result?.ticket?.passengers ?? result?.booking?.passengers ?? hold?.passengers ?? [],
    [result, hold],
  )

  if (!payment?.paymentId || !payment?.orderId) {
    return (
      <MissingPaymentState onGoToOrder={() => navigate('/booking/payment')} />
    )
  }

  if (result) {
    return (
      <VerifySuccessView
        result={result}
        pnr={pnr}
        amount={amount}
        hold={hold}
        ticketPassengers={ticketPassengers}
        onViewTicket={() => navigate(`/booking/ticket/${pnr}`)}
        onHome={() => navigate('/home')}
      />
    )
  }

  return (
    <PaymentMethodForm
      hold={hold}
      payment={payment}
      amount={amount}
      method={method}
      onMethodChange={setMethod}
      hmacReady={hmacReady}
      verifying={verifyMutation.isPending}
      sourceLabel={sourceLabel}
      destLabel={destLabel}
      onBack={() => navigate('/booking/payment', { state: { hold } })}
      onPay={() => verifyMutation.mutate()}
    />
  )
}
