import { StaffMember, Shift, SaturdayGuard, ShiftChangeRequest } from '../types';

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
  // MAÑANA 07:00 a 09:00 - Doble cobertura: Patri + Cristian
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
      notes: 'Doble cobertura de apertura',
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
      notes: 'Doble cobertura de apertura',
    },
    // MAÑANA 09:00 a 13:00 - Individual: Fede
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

  // TARDE 13:00 a 18:00 - Bloques individuales (Sil, Gala, Gise, Javi, Vicky)
  {
    id: 't-sil-1',
    day_of_week: 1, // Lunes
    start_time: '13:00',
    end_time: '18:00',
    duration_hours: 5,
    franja: 'tarde',
    coach_id: 'sil',
    coach_name: 'Sil',
    is_double_coverage: false,
  },
  {
    id: 't-gala-2',
    day_of_week: 2, // Martes
    start_time: '13:00',
    end_time: '18:00',
    duration_hours: 5,
    franja: 'tarde',
    coach_id: 'gala',
    coach_name: 'Gala',
    is_double_coverage: false,
  },
  {
    id: 't-gise-3',
    day_of_week: 3, // Miércoles
    start_time: '13:00',
    end_time: '18:00',
    duration_hours: 5,
    franja: 'tarde',
    coach_id: 'gise',
    coach_name: 'Gise',
    is_double_coverage: false,
  },
  {
    id: 't-javi-4',
    day_of_week: 4, // Jueves
    start_time: '13:00',
    end_time: '18:00',
    duration_hours: 5,
    franja: 'tarde',
    coach_id: 'javi',
    coach_name: 'Javi',
    is_double_coverage: false,
  },
  {
    id: 't-vicky-5',
    day_of_week: 5, // Viernes
    start_time: '13:00',
    end_time: '18:00',
    duration_hours: 5,
    franja: 'tarde',
    coach_id: 'vicky',
    coach_name: 'Vicky',
    is_double_coverage: false,
  },

  // NOCHE 18:00 a 21:00 - Doble cobertura simultánea (Javi, Ema, Lucas)
  ...WEEKDAYS.flatMap(day => {
    // Distribuimos la doble cobertura nocturna entre Javi, Ema y Lucas
    const pairs: [string, string, string, string][] = [
      ['javi', 'Javi', 'ema', 'Ema'],
      ['ema', 'Ema', 'lucas', 'Lucas'],
      ['lucas', 'Lucas', 'javi', 'Javi'],
      ['javi', 'Javi', 'ema', 'Ema'],
      ['ema', 'Ema', 'lucas', 'Lucas'],
    ];
    const [c1Id, c1Name, c2Id, c2Name] = pairs[day - 1];
    return [
      {
        id: `n-1-${day}`,
        day_of_week: day,
        start_time: '18:00',
        end_time: '21:00',
        duration_hours: 3,
        franja: 'noche' as const,
        coach_id: c1Id,
        coach_name: c1Name,
        is_double_coverage: true,
        partner_name: c2Name,
        notes: 'Doble cobertura nocturna',
      },
      {
        id: `n-2-${day}`,
        day_of_week: day,
        start_time: '18:00',
        end_time: '21:00',
        duration_hours: 3,
        franja: 'noche' as const,
        coach_id: c2Id,
        coach_name: c2Name,
        is_double_coverage: true,
        partner_name: c1Name,
        notes: 'Doble cobertura nocturna',
      },
    ];
  }),
];

// Próximas guardias de sábado (11:00 a 14:00)
export const INITIAL_SATURDAY_GUARDS: SaturdayGuard[] = [
  {
    id: 'sg-1',
    date: '2026-10-10',
    start_time: '11:00',
    end_time: '14:00',
    coach_id: 'cristian',
    coach_name: 'Cristian',
    status: 'scheduled',
  },
  {
    id: 'sg-2',
    date: '2026-10-17',
    start_time: '11:00',
    end_time: '14:00',
    coach_id: 'gala',
    coach_name: 'Gala',
    status: 'scheduled',
  },
  {
    id: 'sg-3',
    date: '2026-10-24',
    start_time: '11:00',
    end_time: '14:00',
    coach_id: 'ema',
    coach_name: 'Ema',
    status: 'scheduled',
  },
  {
    id: 'sg-4',
    date: '2026-10-31',
    start_time: '11:00',
    end_time: '14:00',
    coach_id: 'fede',
    coach_name: 'Fede',
    status: 'scheduled',
  },
];

// Pedidos de cambio iniciales en la bolsa comunitaria
export const INITIAL_SHIFT_CHANGES: ShiftChangeRequest[] = [
  {
    id: 'ch-1',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    requester_id: 'cristian',
    requester_name: 'Cristian',
    target_date: '2026-10-08',
    day_name: 'Jueves',
    start_time: '07:00',
    end_time: '08:00',
    type: 'single_hour',
    franja: 'manana',
    reason: 'Trámite médico a primera hora',
    status: 'open',
  },
  {
    id: 'ch-2',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    requester_id: 'sil',
    requester_name: 'Sil',
    target_date: '2026-10-12',
    day_name: 'Lunes',
    start_time: '13:00',
    end_time: '18:00',
    type: 'full_shift',
    franja: 'tarde',
    reason: 'Viaje formativo',
    status: 'open',
  },
  {
    id: 'ch-3',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    requester_id: 'lucas',
    requester_name: 'Lucas',
    target_date: '2026-10-09',
    day_name: 'Viernes',
    start_time: '18:00',
    end_time: '20:00',
    type: 'multiple_hours',
    franja: 'noche',
    reason: 'Compromiso académico',
    status: 'claimed',
    claimed_by_id: 'javi',
    claimed_by_name: 'Javi',
    claimed_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];
