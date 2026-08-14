const CLASS_DEFS = [
  {
    class_code: '1A',
    class_name: 'First AC',
    capacity: 24,
    berth_cycle: ['LB', 'UB'],
    is_seating: false,
  },
  {
    class_code: '2A',
    class_name: 'AC 2 Tier',
    capacity: 52,
    berth_cycle: ['LB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: '3A',
    class_name: 'AC 3 Tier',
    capacity: 72,
    berth_cycle: ['LB', 'MB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: '3E',
    class_name: 'AC 3 Tier Economy',
    capacity: 83,
    berth_cycle: ['LB', 'MB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: 'SL',
    class_name: 'Sleeper',
    capacity: 80,
    berth_cycle: ['LB', 'MB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: 'CC',
    class_name: 'AC Chair Car',
    capacity: 78,
    berth_cycle: ['WS', 'AS'],
    is_seating: true,
  },
  {
    class_code: 'EC',
    class_name: 'Executive Chair Car',
    capacity: 56,
    berth_cycle: ['SEAT'],
    is_seating: true,
  },
  {
    class_code: '2S',
    class_name: 'Second Sitting',
    capacity: 108,
    berth_cycle: ['SEAT'],
    is_seating: true,
  },
]

const DEFAULT_TEMPLATE = [
  { position_seq: 1, coach_number: 'H1', class_code: '1A' },
  { position_seq: 2, coach_number: 'A1', class_code: '2A' },
  { position_seq: 3, coach_number: 'A2', class_code: '2A' },
  { position_seq: 4, coach_number: 'B1', class_code: '3A' },
  { position_seq: 5, coach_number: 'B2', class_code: '3A' },
  { position_seq: 6, coach_number: 'B3', class_code: '3A' },
  { position_seq: 7, coach_number: 'M1', class_code: '3E' },
  { position_seq: 8, coach_number: 'S1', class_code: 'SL' },
  { position_seq: 9, coach_number: 'S2', class_code: 'SL' },
  { position_seq: 10, coach_number: 'S3', class_code: 'SL' },
  { position_seq: 11, coach_number: 'S4', class_code: 'SL' },
  { position_seq: 12, coach_number: 'C1', class_code: 'CC' },
  { position_seq: 13, coach_number: 'E1', class_code: 'EC' },
  { position_seq: 14, coach_number: 'D1', class_code: '2S' },
  { position_seq: 15, coach_number: 'D2', class_code: '2S' },
]

export { CLASS_DEFS, DEFAULT_TEMPLATE }