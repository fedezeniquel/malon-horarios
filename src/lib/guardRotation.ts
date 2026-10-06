import type { SaturdayGuard } from '../types';

export const SATURDAY_ROTATION = [
  { id: 'gala', name: 'Gala', initials: 'GA' },
  { id: 'fede', name: 'Fede', initials: 'FE' },
  { id: 'sil', name: 'Sil', initials: 'SI' },
  { id: 'vicky', name: 'Vicky', initials: 'VI' },
  { id: 'gise', name: 'Gise', initials: 'GI' },
];

// Ancla de referencia: 2026-10-03 le corresponde a Gala (índice 0)
const ANCHOR_DATE = new Date(2026, 9, 3); // 3 de Octubre de 2026 (mes 9 = Octubre)
const ANCHOR_INDEX = 0; // Gala

/**
 * Obtiene todos los sábados correspondientes a un mes y año específicos
 */
export const getSaturdaysOfMonth = (year: number, month: number): string[] => {
  const saturdays: string[] = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    if (date.getDay() === 6) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      saturdays.push(`${y}-${m}-${d}`);
    }
    date.setDate(date.getDate() + 1);
  }

  return saturdays;
};

/**
 * Calcula qué persona le corresponde a un sábado determinado según la rotación de 5 personas
 */
export const getProjectedCoachForDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);

  // Diferencia en milisegundos y semanas respecto al ancla
  const diffTime = targetDate.getTime() - ANCHOR_DATE.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

  const rotationLength = SATURDAY_ROTATION.length;
  const targetIndex = ((ANCHOR_INDEX + diffWeeks) % rotationLength + rotationLength) % rotationLength;

  return SATURDAY_ROTATION[targetIndex];
};

/**
 * Retorna las guardias completas del mes (fusionando cambios guardados con la rotación proyectada)
 */
export const getMonthlyGuards = (
  year: number,
  month: number,
  savedGuards: SaturdayGuard[]
): SaturdayGuard[] => {
  const monthSaturdays = getSaturdaysOfMonth(year, month);

  return monthSaturdays.map(dateStr => {
    // Si hay una asignación guardada o modificada por PIN, la respetamos
    const existing = savedGuards.find(g => g.date === dateStr);
    if (existing) {
      return existing;
    }

    // De lo contrario, calculamos según la rotación automática
    const coach = getProjectedCoachForDate(dateStr);
    return {
      id: `sg-${dateStr}`,
      date: dateStr,
      start_time: '11:00',
      end_time: '14:00',
      coach_id: coach.id,
      coach_name: coach.name,
      status: 'scheduled',
    };
  });
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
