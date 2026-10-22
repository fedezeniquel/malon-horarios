import type { StaffMember, Shift, SaturdayGuard, ShiftChangeRequest, HolidaySchedule, Franja } from '../types';
import { getMonthlyGuards } from './guardRotation';

// Horas operativas del gimnasio Malón en Movimiento (24hs)
export const WORKING_HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
];

// Opciones disponibles para horario de inicio (el gimnasio cierra a las 21:00)
export const START_HOURS = WORKING_HOURS.slice(0, -1); // 07:00 a 20:00

/**
 * Retorna la franja correspondiente según el horario de inicio:
 * - Turno Mañana: 07:00 a 13:00
 * - Turno Siesta: 13:00 a 17:00
 * - Turno Tarde: 17:00 a 19:00
 * - Turno Noche: 19:00 a 21:00
 */
export const getFranjaFromTime = (startTime: string): Franja => {
  if (startTime < '13:00') return 'manana';
  if (startTime < '17:00') return 'siesta';
  if (startTime < '19:00') return 'tarde';
  return 'noche';
};

/**
 * Calcula la duración en horas entre dos horarios en formato 24hs (HH:mm)
 */
export const calculateDurationHours = (start: string, end: string): number => {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const diffMinutes = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
  if (diffMinutes <= 0) return 0;
  return parseFloat((diffMinutes / 60).toFixed(1));
};

/**
 * Retorna las opciones de fin válidas estrictamente posteriores al inicio
 */
export const getAvailableEndHours = (startTime: string): string[] => {
  return WORKING_HOURS.filter(h => h > startTime);
};

/**
 * Retorna todos los intervalos en horas en punto entre un inicio y un fin (ej. 09:00 a 13:00 -> [09:00, 10:00, 11:00, 12:00, 13:00])
 */
export const getHoursBetween = (start: string, end: string): string[] => {
  const [h1] = start.split(':').map(Number);
  const [h2] = end.split(':').map(Number);
  const hours: string[] = [];
  for (let h = h1; h <= h2; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }
  return hours;
};

/**
 * Agrupa horas seleccionadas en intervalos/turnos continuos (ej: ["08:00", "13:00", "18:00"] -> 3 turnos de 1h)
 */
export interface ComputedHourRange {
  start_time: string;
  end_time: string;
  duration_hours: number;
  hours: string[];
  time_display: string;
}

export const groupHoursIntoRanges = (selectedHours: string[]): ComputedHourRange[] => {
  if (selectedHours.length === 0) return [];
  const sorted = [...selectedHours].sort().map(s => parseInt(s.split(':')[0], 10));
  const ranges: { start: number; end: number; hours: string[] }[] = [];

  let rangeStart = sorted[0];
  let prevHour = sorted[0];
  let currentHours: string[] = [`${String(sorted[0]).padStart(2, '0')}:00`];

  for (let i = 1; i < sorted.length; i++) {
    const curHour = sorted[i];
    const hourStr = `${String(curHour).padStart(2, '0')}:00`;
    if (curHour === prevHour + 1) {
      prevHour = curHour;
      currentHours.push(hourStr);
    } else {
      ranges.push({
        start: rangeStart,
        end: prevHour + 1,
        hours: currentHours,
      });
      rangeStart = curHour;
      prevHour = curHour;
      currentHours = [hourStr];
    }
  }
  ranges.push({
    start: rangeStart,
    end: prevHour + 1,
    hours: currentHours,
  });

  return ranges.map(r => {
    const start_time = `${String(r.start).padStart(2, '0')}:00`;
    const end_time = `${String(r.end).padStart(2, '0')}:00`;
    const duration = r.end - r.start;
    return {
      start_time,
      end_time,
      duration_hours: duration,
      hours: r.hours,
      time_display: `${start_time} a ${end_time} hs`,
    };
  });
};

/**
 * Convierte un array de horas seleccionadas en un resumen legible de texto continuo
 */
export const formatSelectedHoursDisplay = (selected: string[]): string => {
  const ranges = groupHoursIntoRanges(selected);
  if (ranges.length === 0) return 'Sin horarios seleccionados';
  return ranges.map(r => `${r.start_time} a ${r.end_time}`).join(' y ') + ' hs';
};

export interface CoachMonthlyAudit {
  coachId: string;
  coachName: string;
  initials: string;
  role: string;
  weeklyHours: number;
  regularMonthlyHours: number;
  saturdayMonthlyHours: number;
  holidayMonthlyHours: number;
  shiftChangesDelta: number;
  totalMonthlyHours: number;
  saturdayDates: string[];
  holidayNames: string[];
}

/**
 * Cuenta cuántas veces se repite cada día de la semana (1: Lun, 2: Mar, ..., 6: Sáb) en un mes específico
 */
export const getWeekdayOccurrencesInMonth = (year: number, month: number): Record<number, number> => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay(); // 0: Dom, 1: Lun, ..., 6: Sáb
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      counts[dayOfWeek] = (counts[dayOfWeek] || 0) + 1;
    }
  }

  return counts;
};

/**
 * Calcula la auditoría mensual completa para todo el staff en un mes y año dados
 */
export const calculateMonthlyAudit = (
  year: number,
  month: number,
  staff: StaffMember[],
  shifts: Shift[],
  saturdayGuards: SaturdayGuard[],
  shiftChanges: ShiftChangeRequest[],
  holidays: HolidaySchedule[] = []
): CoachMonthlyAudit[] => {
  const weekdayCounts = getWeekdayOccurrencesInMonth(year, month);
  const monthlyGuards = getMonthlyGuards(year, month, saturdayGuards);

  // Filtrar feriados de este mes
  const monthHolidays = holidays.filter(h => {
    const [hYear, hMonth] = h.date.split('-').map(Number);
    return hYear === year && (hMonth - 1) === month;
  });

  // Días de la semana que cayeron en feriado en este mes
  const holidayWeekdayDeductions: Record<number, number> = {};
  monthHolidays.forEach(h => {
    const [y, m, d] = h.date.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    if (dow >= 1 && dow <= 5) {
      holidayWeekdayDeductions[dow] = (holidayWeekdayDeductions[dow] || 0) + 1;
    }
  });

  // Filtrar cambios confirmados para el mes seleccionado
  const monthChanges = shiftChanges.filter(c => {
    if (c.status !== 'confirmed') return false;
    const [cYear, cMonth] = c.target_date.split('-').map(Number);
    return cYear === year && (cMonth - 1) === month;
  });

  return staff.map(coach => {
    // 1. Turnos fijos del coach
    const coachShifts = shifts.filter(s => s.coach_id === coach.id);
    const weeklyHours = coachShifts.reduce((acc, s) => acc + s.duration_hours, 0);

    // 2. Horas regulares en el mes (descontando feriados donde no se hizo el turno habitual)
    const regularMonthlyHours = coachShifts.reduce((acc, s) => {
      const timesInMonth = weekdayCounts[s.day_of_week] || 0;
      const holidayDeduction = holidayWeekdayDeductions[s.day_of_week] || 0;
      const actualTimes = Math.max(0, timesInMonth - holidayDeduction);
      return acc + s.duration_hours * actualTimes;
    }, 0);

    // 3. Guardias de sábado asignadas este mes
    const myGuardsThisMonth = monthlyGuards.filter(g => g.coach_id === coach.id);
    const saturdayMonthlyHours = myGuardsThisMonth.reduce((acc, g) => {
      const duration = calculateDurationHours(g.start_time, g.end_time) || 3;
      return acc + duration;
    }, 0);
    const saturdayDates = myGuardsThisMonth.map(g => g.date);

    // 4. Horas de Feriados trabajadas (Doble Cobertura por turnos/duplas)
    let holidayMonthlyHours = 0;
    const holidayNamesSet = new Set<string>();

    monthHolidays.forEach(h => {
      if (h.is_closed) return;

      if (h.slots && h.slots.length > 0) {
        h.slots.forEach(slot => {
          if (slot.coach_id_1 === coach.id || slot.coach_id_2 === coach.id) {
            holidayMonthlyHours += slot.duration_hours;
            holidayNamesSet.add(`${h.name} (${h.date.split('-').slice(1).reverse().join('/')} [${slot.time_display}])`);
          }
        });
      } else {
        if (h.coach_id_1 === coach.id || h.coach_id_2 === coach.id) {
          holidayMonthlyHours += (h.total_hours || 0);
          holidayNamesSet.add(`${h.name} (${h.date.split('-').slice(1).reverse().join('/')})`);
        }
      }
    });
    const holidayNames = Array.from(holidayNamesSet);

    // 5. Cambios y reemplazos confirmados
    // Regla de compensación:
    // - Si compensation_type === 'pay' (o sin especificar): se computan y transfieren horas (+ al que cubrió, - al solicitante).
    // - Si compensation_type === 'work': NO se computan ni descuentan horas en el sistema (delta 0), ya que se devuelven el turno trabajando entre ellos.
    let shiftChangesDelta = 0;
    monthChanges.forEach(ch => {
      if (ch.compensation_type === 'work') {
        return; // Arreglo mano a mano devolviendo horas de trabajo: no altera la liquidación
      }
      const duration = calculateDurationHours(ch.start_time, ch.end_time);
      if (ch.requester_id === coach.id) {
        shiftChangesDelta -= duration;
      }
      if (ch.claimed_by_id === coach.id) {
        shiftChangesDelta += duration;
      }
    });

    const totalMonthlyHours = Math.max(0, regularMonthlyHours + saturdayMonthlyHours + holidayMonthlyHours + shiftChangesDelta);

    return {
      coachId: coach.id,
      coachName: coach.name,
      initials: coach.initials,
      role: coach.role,
      weeklyHours: parseFloat(weeklyHours.toFixed(1)),
      regularMonthlyHours: parseFloat(regularMonthlyHours.toFixed(1)),
      saturdayMonthlyHours: parseFloat(saturdayMonthlyHours.toFixed(1)),
      holidayMonthlyHours: parseFloat(holidayMonthlyHours.toFixed(1)),
      shiftChangesDelta: parseFloat(shiftChangesDelta.toFixed(1)),
      totalMonthlyHours: parseFloat(totalMonthlyHours.toFixed(1)),
      saturdayDates,
      holidayNames,
    };
  });
};

/**
 * Calcula las horas mensuales para un único coach en el mes seleccionado
 */
export const calculateCoachMonthlyHours = (
  coachId: string,
  year: number,
  month: number,
  shifts: Shift[],
  saturdayGuards: SaturdayGuard[],
  shiftChanges: ShiftChangeRequest[],
  holidays: HolidaySchedule[] = []
) => {
  const dummyStaff: StaffMember[] = [{ id: coachId, name: '', role: 'coach', initials: '' }];
  const audit = calculateMonthlyAudit(year, month, dummyStaff, shifts, saturdayGuards, shiftChanges, holidays);
  return audit[0] || {
    weeklyHours: 0,
    regularMonthlyHours: 0,
    saturdayMonthlyHours: 0,
    holidayMonthlyHours: 0,
    shiftChangesDelta: 0,
    totalMonthlyHours: 0,
    saturdayDates: [],
    holidayNames: [],
  };
};
