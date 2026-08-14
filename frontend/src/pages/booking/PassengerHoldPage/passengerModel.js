export function emptyPassenger() {
  return {
    fullName: '',
    age: '',
    gender: 'MALE',
    berthPreference: 'ANY',
  }
}

export function validatePassengers(passengers, toast) {
  for (let i = 0; i < passengers.length; i += 1) {
    const passenger = passengers[i]
    const name = passenger.fullName.trim()
    const age = Number(passenger.age)

    if (!name) {
      toast.error(`Passenger ${i + 1}: enter full name`)
      return false
    }
    if (!Number.isInteger(age) || age <= 0 || age >= 130) {
      toast.error(`Passenger ${i + 1}: enter a valid age`)
      return false
    }
    if (!passenger.gender) {
      toast.error(`Passenger ${i + 1}: select gender`)
      return false
    }
  }
  return true
}

export function toHoldPayload(passengers) {
  return passengers.map((passenger) => ({
    fullName: passenger.fullName.trim(),
    age: Number(passenger.age),
    gender: passenger.gender,
    berthPreference: passenger.berthPreference || 'ANY',
  }))
}

export function updatePassengerAt(passengers, index, key, value) {
  return passengers.map((passenger, i) =>
    i === index ? { ...passenger, [key]: value } : passenger,
  )
}
