import type { StaffMember, Shift, SaturdayGuard, ShiftChangeRequest } from '../types';

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'patri', name: 'Patri', role: 'admin', initials: 'PA', phone: '+5491100000001' },
  { id: 'fede', name: 'Fede', role: 'coach_admin', initials: 'FE', phone: '+5491100000002' },
  { id: 'vicky', name: 'Vicky', role: 'coach_admin', initials: 'VI', phone: '+5491100000003' },
  { id: 'cristian', name: 'Cristian', role: 'coach', initials: 'CR', phone: '+5491100000004' },
  { id: 'gala', name: 'Gala', role: 'coach', initials: 'GA', phone: '+5491100000005' },
  { id: 'javi', name: 'Javi', role: 'coach', initials: 'JA', phone: '+5491100000006' },
  { id: 'ema', name: 'Ema', role: 'coach', initials: 'EM', phone: '+5491100000007' },
  { id: 'lucas', name: 'Lucas', role: 'coach', initials: 'LU', phone: '+5491100000008' },
  { id: 'gise', name: 'Gise', role: 'coach', initials: 'GI', phone: '+5491100000009' },
  { id: 'sil', name: 'Sil', role: 'coach', initials: 'SI', phone: '+5491100000010' },
];

// Días hábiles de Lunes (1) a Viernes (5)
const WEEKDAYS = [1, 2, 3, 4, 5];

export const INITIAL_SHIFTS: Shift[] = [
  // ==========================================
  // 1. FRANJA MAÑANA (07:00 a 13:00)
  // ==========================================

  // 07:00 a 09:00 - Doble cobertura diaria: Patri + Cristian (Lun a Vie)
  ...WEEKDAYS.flatMap(day => [
    {
      id: `m-pc1-${day}`,
      day_of_week: day,
      start_time: '07:00',
      end_time: '09:00',
      duration_hours: 2,
      franja: 'manana' as const,
      coach_id: 'patri',
      coach_name: 'Patri',
      is_double_coverage: true,
      partner_name: 'Cristian',
      notes: 'Apertura de sala con doble cobertura',
    },
    {
      id: `m-pc2-${day}`,
      day_of_week: day,
      start_time: '07:00',
      end_time: '09:00',
      duration_hours: 2,
      franja: 'manana' as const,
      coach_id: 'cristian',
      coach_name: 'Cristian',
      is_double_coverage: true,
      partner_name: 'Patri',
      notes: 'Apertura de sala con doble cobertura',
    },
    // 09:00 a 13:00 - Bloque Individual: Fede (Lun a Vie, 4 horas)
    {
      id: `m-fe-${day}`,
      day_of_week: day,
      start_time: '09:00',
      end_time: '13:00',
      duration_hours: 4,
      franja: 'manana' as const,
      coach_id: 'fede',
      coach_name: 'Fede',
      is_double_coverage: false,
      notes: 'Bloque individual matutino',
    },
  ]),

  // ==========================================
  // 2. FRANJA TARDE (13:00 a 18:00)
  // Distribución exacta según Google Sheet:
  // ==========================================

  // LUNES (1)
  // 13:00 a 15:00 - Sil (2 hs)
  {
    id: 't-sil-1',
    day_of_week: 1,
    start_time: '13:00',
    end_time: '15:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'sil',
    coach_name: 'Sil',
    is_double_coverage: false,
  },
  // 15:00 a 17:00 - Gise (2 hs)
  {
    id: 't-gise-1',
    day_of_week: 1,
    start_time: '15:00',
    end_time: '17:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gise',
    coach_name: 'Gise',
    is_double_coverage: false,
  },
  // 17:00 a 18:00 - Javi (1 h)
  {
    id: 't-javi-1',
    day_of_week: 1,
    start_time: '17:00',
    end_time: '18:00',
    duration_hours: 1,
    franja: 'tarde',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: false,
  },

  // MARTES (2)
  // 13:00 a 15:00 - Gala (2 hs)
  {
    id: 't-gala-2',
    day_of_week: 2,
    start_time: '13:00',
    end_time: '15:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: false,
  },
  // 15:00 a 17:00 - Gise (2 hs)
  {
    id: 't-gise-2',
    day_of_week: 2,
    start_time: '15:00',
    end_time: '17:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gise',
    coach_name: 'Gise',
    is_double_coverage: false,
  },
  // 17:00 a 18:00 - Vicky (1 h)
  {
    id: 't-vicky-2',
    day_of_week: 2,
    start_time: '17:00',
    end_time: '18:00',
    duration_hours: 1,
    franja: 'tarde',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: false,
  },

  // MIÉRCOLES (3)
  // 13:00 a 15:00 - Gala (2 hs)
  {
    id: 't-gala-3',
    day_of_week: 3,
    start_time: '13:00',
    end_time: '15:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: false,
  },
  // 15:00 a 17:00 - Gise (2 hs)
  {
    id: 't-gise-3',
    day_of_week: 3,
    start_time: '15:00',
    end_time: '17:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gise',
    coach_name: 'Gise',
    is_double_coverage: false,
  },
  // 17:00 a 18:00 - Javi (1 h)
  {
    id: 't-javi-3',
    day_of_week: 3,
    start_time: '17:00',
    end_time: '18:00',
    duration_hours: 1,
    franja: 'tarde',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: false,
  },

  // JUEVES (4)
  // 13:00 a 14:00 - Gala (1 h)
  {
    id: 't-gala-4',
    day_of_week: 4,
    start_time: '13:00',
    end_time: '14:00',
    duration_hours: 1,
    franja: 'tarde',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: false,
  },
  // 14:00 a 17:00 - Javi (3 hs: 14, 15 y 16 hs)
  {
    id: 't-javi-4',
    day_of_week: 4,
    start_time: '14:00',
    end_time: '17:00',
    duration_hours: 3,
    franja: 'tarde',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: false,
  },
  // 17:00 a 18:00 - Vicky (1 h)
  {
    id: 't-vicky-4',
    day_of_week: 4,
    start_time: '17:00',
    end_time: '18:00',
    duration_hours: 1,
    franja: 'tarde',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: false,
  },

  // VIERNES (5)
  // 13:00 a 15:00 - Gala (2 hs)
  {
    id: 't-gala-5',
    day_of_week: 5,
    start_time: '13:00',
    end_time: '15:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: false,
  },
  // 15:00 a 17:00 - Gise (2 hs)
  {
    id: 't-gise-5',
    day_of_week: 5,
    start_time: '15:00',
    end_time: '17:00',
    duration_hours: 2,
    franja: 'tarde',
    coach_id: 'gise',
    coach_name: 'Gise',
    is_double_coverage: false,
  },
  // 17:00 a 18:00 - Vicky (1 h)
  {
    id: 't-vicky-5',
    day_of_week: 5,
    start_time: '17:00',
    end_time: '18:00',
    duration_hours: 1,
    franja: 'tarde',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: false,
  },

  // ==========================================
  // 3. FRANJA NOCHE (18:00 a 21:00)
  // Dobles coberturas exactas según Google Sheet:
  // ==========================================

  // LUNES NOCHE (1)
  // 18:00 a 19:00: Javi + Ema
  {
    id: 'n-javi-ema-18-1',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: true,
    partner_name: 'Ema',
  },
  {
    id: 'n-ema-javi-18-1',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'ema',
    coach_name: 'Ema',
    is_double_coverage: true,
    partner_name: 'Javi',
  },
  // 19:00 a 21:00: Lucas + Ema
  {
    id: 'n-lucas-ema-19-1',
    day_of_week: 1,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'lucas',
    coach_name: 'Lucas',
    is_double_coverage: true,
    partner_name: 'Ema',
  },
  {
    id: 'n-ema-lucas-19-1',
    day_of_week: 1,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'ema',
    coach_name: 'Ema',
    is_double_coverage: true,
    partner_name: 'Lucas',
  },

  // MARTES NOCHE (2)
  // 18:00 a 19:00: Vicky + Ema
  {
    id: 'n-vicky-ema-18-2',
    day_of_week: 2,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: true,
    partner_name: 'Ema',
  },
  {
    id: 'n-ema-vicky-18-2',
    day_of_week: 2,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'ema',
    coach_name: 'Ema',
    is_double_coverage: true,
    partner_name: 'Vicky',
  },
  // 19:00 a 21:00: Javi + Lucas
  {
    id: 'n-javi-lucas-19-2',
    day_of_week: 2,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: true,
    partner_name: 'Lucas',
  },
  {
    id: 'n-lucas-javi-19-2',
    day_of_week: 2,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'lucas',
    coach_name: 'Lucas',
    is_double_coverage: true,
    partner_name: 'Javi',
  },

  // MIÉRCOLES NOCHE (3)
  // 18:00 a 19:00: Javi + Ema
  {
    id: 'n-javi-ema-18-3',
    day_of_week: 3,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: true,
    partner_name: 'Ema',
  },
  {
    id: 'n-ema-javi-18-3',
    day_of_week: 3,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'ema',
    coach_name: 'Ema',
    is_double_coverage: true,
    partner_name: 'Javi',
  },
  // 19:00 a 20:00: Ema + Lucas
  {
    id: 'n-ema-lucas-19-3',
    day_of_week: 3,
    start_time: '19:00',
    end_time: '20:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'ema',
    coach_name: 'Ema',
    is_double_coverage: true,
    partner_name: 'Lucas',
  },
  {
    id: 'n-lucas-ema-19-3',
    day_of_week: 3,
    start_time: '19:00',
    end_time: '20:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'lucas',
    coach_name: 'Lucas',
    is_double_coverage: true,
    partner_name: 'Ema',
  },
  // 20:00 a 21:00: Gala + Lucas
  {
    id: 'n-gala-lucas-20-3',
    day_of_week: 3,
    start_time: '20:00',
    end_time: '21:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: true,
    partner_name: 'Lucas',
  },
  {
    id: 'n-lucas-gala-20-3',
    day_of_week: 3,
    start_time: '20:00',
    end_time: '21:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'lucas',
    coach_name: 'Lucas',
    is_double_coverage: true,
    partner_name: 'Gala',
  },

  // JUEVES NOCHE (4)
  // 18:00 a 19:00: Vicky + Gala
  {
    id: 'n-vicky-gala-18-4',
    day_of_week: 4,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: true,
    partner_name: 'Gala',
  },
  {
    id: 'n-gala-vicky-18-4',
    day_of_week: 4,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: true,
    partner_name: 'Vicky',
  },
  // 19:00 a 21:00: Sil + Lucas
  {
    id: 'n-sil-lucas-19-4',
    day_of_week: 4,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'sil',
    coach_name: 'Sil',
    is_double_coverage: true,
    partner_name: 'Lucas',
  },
  {
    id: 'n-lucas-sil-19-4',
    day_of_week: 4,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'lucas',
    coach_name: 'Lucas',
    is_double_coverage: true,
    partner_name: 'Sil',
  },

  // VIERNES NOCHE (5)
  // 18:00 a 19:00: Vicky + Javi
  {
    id: 'n-vicky-javi-18-5',
    day_of_week: 5,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: true,
    partner_name: 'Javi',
  },
  {
    id: 'n-javi-vicky-18-5',
    day_of_week: 5,
    start_time: '18:00',
    end_time: '19:00',
    duration_hours: 1,
    franja: 'noche',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: true,
    partner_name: 'Vicky',
  },
  // 19:00 a 21:00: Javi + Ema
  {
    id: 'n-javi-ema-19-5',
    day_of_week: 5,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: true,
    partner_name: 'Ema',
  },
  {
    id: 'n-ema-javi-19-5',
    day_of_week: 5,
    start_time: '19:00',
    end_time: '21:00',
    duration_hours: 2,
    franja: 'noche',
    coach_id: 'ema',
    coach_name: 'Ema',
    is_double_coverage: true,
    partner_name: 'Javi',
  },
];

// ==========================================
// 4. GUARDIAS DE SÁBADO (11:00 a 14:00 hs)
// Cronograma rotativo exacto de Google Sheet:
// Gala -> Fede -> Sil -> Vicky -> Gise
// ==========================================
export const INITIAL_SATURDAY_GUARDS: SaturdayGuard[] = [
  // Ciclo 1 (Mayo - Julio)
  { id: 'sg-2026-05-30', date: '2026-05-30', start_time: '11:00', end_time: '14:00', coach_id: 'gala', coach_name: 'Gala', status: 'completed' },
  { id: 'sg-2026-06-13', date: '2026-06-13', start_time: '11:00', end_time: '14:00', coach_id: 'fede', coach_name: 'Fede', status: 'completed' },
  { id: 'sg-2026-06-27', date: '2026-06-27', start_time: '11:00', end_time: '14:00', coach_id: 'sil', coach_name: 'Sil', status: 'completed' },
  { id: 'sg-2026-07-04', date: '2026-07-04', start_time: '11:00', end_time: '14:00', coach_id: 'vicky', coach_name: 'Vicky', status: 'completed' },
  { id: 'sg-2026-07-11', date: '2026-07-11', start_time: '11:00', end_time: '14:00', coach_id: 'gise', coach_name: 'Gise', status: 'completed' },

  // Ciclo 2 (Julio - Agosto)
  { id: 'sg-2026-07-18', date: '2026-07-18', start_time: '11:00', end_time: '14:00', coach_id: 'gala', coach_name: 'Gala', status: 'completed' },
  { id: 'sg-2026-08-01', date: '2026-08-01', start_time: '11:00', end_time: '14:00', coach_id: 'fede', coach_name: 'Fede', status: 'completed' },
  { id: 'sg-2026-08-08', date: '2026-08-08', start_time: '11:00', end_time: '14:00', coach_id: 'sil', coach_name: 'Sil', status: 'completed' },
  { id: 'sg-2026-08-15', date: '2026-08-15', start_time: '11:00', end_time: '14:00', coach_id: 'vicky', coach_name: 'Vicky', status: 'completed' },
  { id: 'sg-2026-08-22', date: '2026-08-22', start_time: '11:00', end_time: '14:00', coach_id: 'gise', coach_name: 'Gise', status: 'completed' },

  // Ciclo 3 (Agosto - Septiembre)
  { id: 'sg-2026-08-29', date: '2026-08-29', start_time: '11:00', end_time: '14:00', coach_id: 'gala', coach_name: 'Gala', status: 'completed' },
  { id: 'sg-2026-09-05', date: '2026-09-05', start_time: '11:00', end_time: '14:00', coach_id: 'fede', coach_name: 'Fede', status: 'completed' },
  { id: 'sg-2026-09-12', date: '2026-09-12', start_time: '11:00', end_time: '14:00', coach_id: 'sil', coach_name: 'Sil', status: 'completed' },
  { id: 'sg-2026-09-19', date: '2026-09-19', start_time: '11:00', end_time: '14:00', coach_id: 'vicky', coach_name: 'Vicky', status: 'completed' },
  { id: 'sg-2026-09-26', date: '2026-09-26', start_time: '11:00', end_time: '14:00', coach_id: 'gise', coach_name: 'Gise', status: 'completed' },

  // Ciclo 4 (Octubre 2026 - Actual y próximos)
  { id: 'sg-2026-10-03', date: '2026-10-03', start_time: '11:00', end_time: '14:00', coach_id: 'gala', coach_name: 'Gala', status: 'completed' },
  { id: 'sg-2026-10-10', date: '2026-10-10', start_time: '11:00', end_time: '14:00', coach_id: 'fede', coach_name: 'Fede', status: 'scheduled' },
  { id: 'sg-2026-10-17', date: '2026-10-17', start_time: '11:00', end_time: '14:00', coach_id: 'sil', coach_name: 'Sil', status: 'scheduled' },
  { id: 'sg-2026-10-24', date: '2026-10-24', start_time: '11:00', end_time: '14:00', coach_id: 'vicky', coach_name: 'Vicky', status: 'scheduled' },
  { id: 'sg-2026-10-31', date: '2026-10-31', start_time: '11:00', end_time: '14:00', coach_id: 'gise', coach_name: 'Gise', status: 'scheduled' },
];

// Pedidos de cambio iniciales (limpio para producción)
export const INITIAL_SHIFT_CHANGES: ShiftChangeRequest[] = [];

