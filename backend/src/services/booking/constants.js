const HOLD_MINUTES = 10

const ALLOWED_CLASSES = new Set([
  '1A',
  '2A',
  '3A',
  '3E',
  'SL',
  'CC',
  'EC',
  '2S',
])

const ALLOWED_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER', 'M', 'F', 'O'])

const BERTH_PREFS = new Set([
  'LB',
  'MB',
  'UB',
  'SL',
  'SU',
  'WS',
  'AS',
  'SEAT',
  'ANY',
  'NONE',
])

export { HOLD_MINUTES, ALLOWED_CLASSES, ALLOWED_GENDERS, BERTH_PREFS }