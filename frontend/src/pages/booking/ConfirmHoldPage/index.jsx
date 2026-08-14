import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  confirmSeatHold,
  getStoredActiveHold,
  getStoredAuthUser,
} from '../../../api/bookings'
import { storeConfirmedBooking } from '../../../api/payments'
import useHoldCountdown from '../../../hooks/useHoldCountdown'
import ConfirmForm from './ConfirmForm'
import ConfirmSuccessView from './ConfirmSuccessView'
import { resolveHoldSummary } from './holdSummary'

export default function ConfirmHoldPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const storedHold = getStoredActiveHold()
  const holdFromState = location.state?.hold
  const holdIdFromQuery = searchParams.get('holdId')

  const [holdIdInput, setHoldIdInput] = useState(
    holdFromState?.holdId || storedHold?.holdId || holdIdFromQuery || '',
  )
  const [acknowledged, setAcknowledged] = useState(false)
  const [result, setResult] = useState(null)

  const activeHold = resolveHoldSummary(holdIdInput, holdFromState, storedHold)
  const countdown = useHoldCountdown(activeHold?.heldUntil)

  const confirmMutation = useMutation({
    mutationFn: confirmSeatHold,
    onSuccess: (data) => {
      storeConfirmedBooking({ ticket: data, booking: { pnr: data.pnr, status: data.status } })
      setResult(data)
      toast.success(data?.message ?? 'Booking confirmed')
    },
    onError: (error) => {
      if (error.code === 'ALREADY_CONFIRMED' && error.pnr) {
        toast.error(`Already confirmed · PNR ${error.pnr}`)
        return
      }
      toast.error(error.message)
    },
  })

  const handleConfirm = () => {
    const holdId = holdIdInput.trim()
    if (!holdId) {
      toast.error('Enter a hold ID')
      return
    }
    if (!acknowledged) {
      toast.error('Confirm you understand this skips payment')
      return
    }
    if (countdown?.expired) {
      toast.error('This hold has expired')
      return
    }

    const authUser = getStoredAuthUser()
    confirmMutation.mutate({
      holdId,
      userId: authUser?.id ?? null,
    })
  }

  if (result) {
    const pnr = result.pnr
    return (
      <ConfirmSuccessView
        result={result}
        onViewTicket={() => navigate(`/booking/ticket/${pnr}`)}
        onViewDetails={() => navigate(`/booking/pnr/${pnr}`)}
        onHome={() => navigate('/home')}
      />
    )
  }

  return (
    <ConfirmForm
      holdIdInput={holdIdInput}
      onHoldIdChange={setHoldIdInput}
      activeHold={activeHold}
      countdown={countdown}
      acknowledged={acknowledged}
      onAcknowledgedChange={setAcknowledged}
      confirming={confirmMutation.isPending}
      onBack={() => navigate('/booking/hold')}
      onPayInstead={() =>
        navigate('/booking/payment', {
          state: { hold: activeHold || { holdId: holdIdInput.trim() } },
        })
      }
      onConfirm={handleConfirm}
    />
  )
}
