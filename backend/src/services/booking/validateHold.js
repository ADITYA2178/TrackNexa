import { createError } from "../../utils/httpError.js"
import { isValidDate } from "../../utils/dates.js"
import {
  ALLOWED_CLASSES,
  ALLOWED_GENDERS,
  BERTH_PREFS,
} from "./constants.js"
import { normalizeGender, normalizePreference } from "./normalize.js"
/**
 * Validate + normalize createSeatHold inputs (pure, throws).
 */
const validateHoldInput = ({
  trainId,
  journeyDate,
  sourceStation,
  destinationStation,
  classCode,
  passengers,
}) => {
  if (
    !trainId ||
    !journeyDate ||
    !sourceStation ||
    !destinationStation ||
    !classCode ||
    !Array.isArray(passengers) ||
    passengers.length === 0
  ) {
    throw createError(
      'trainId, journeyDate, sourceStation, destinationStation, classCode, and passengers[] are required',
      400,
    )
  }

  if (!isValidDate(journeyDate)) {
    throw createError('journeyDate must be in YYYY-MM-DD format', 400)
  }

  const normalizedClass = String(classCode).trim().toUpperCase()
  if (!ALLOWED_CLASSES.has(normalizedClass)) {
    throw createError(
      `Invalid classCode. Allowed: ${[...ALLOWED_CLASSES].join(', ')}`,
      400,
    )
  }

  if (passengers.length > 6) {
    throw createError('Maximum 6 passengers allowed per hold', 400)
  }

  const normalizedPassengers = passengers.map((p, idx) => {
    const fullName = String(p.fullName || p.name || '').trim()
    const age = Number(p.age)
    const gender = normalizeGender(p.gender)
    const berthPreference = normalizePreference(p.berthPreference)

    if (!fullName) {
      throw createError(`Passenger ${idx + 1}: name is required`, 400)
    }
    if (!Number.isInteger(age) || age <= 0 || age >= 130) {
      throw createError(`Passenger ${idx + 1}: valid age is required`, 400)
    }
    if (!ALLOWED_GENDERS.has(gender) && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      throw createError(
        `Passenger ${idx + 1}: gender must be MALE, FEMALE, or OTHER`,
        400,
      )
    }
    if (!BERTH_PREFS.has(berthPreference)) {
      throw createError(
        `Passenger ${idx + 1}: invalid berthPreference`,
        400,
      )
    }

    return {
      fullName,
      age,
      gender,
      berthPreference,
      seq: idx + 1,
    }
  })

  const trainNo = String(trainId).trim()
  const source = String(sourceStation).trim()
  const destination = String(destinationStation).trim()

  if (source.toUpperCase() === destination.toUpperCase()) {
    throw createError('sourceStation and destinationStation must be different', 400)
  }

  return {
    trainNo,
    journeyDate,
    source,
    destination,
    normalizedClass,
    normalizedPassengers,
  }
}

export { validateHoldInput }