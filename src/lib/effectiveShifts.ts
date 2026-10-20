import type { Shift, ShiftChangeRequest, ShiftChangeStatus, ShiftCompensationType } from '../types';
import { calculateDurationHours, getFranjaFromTime } from './hoursAudit';

export interface DisplayShift extends Shift {
  is_replaced?: boolean;
  replacement_coach_name?: string;
  replacement_coach_id?: string;
  is_covering?: boolean;
  covered_coach_name?: string;
  covered_coach_id?: string;
  change_request_id?: string;
  change_target_date?: string;
  change_status?: ShiftChangeStatus;
  compensation_type?: ShiftCompensationType;
}

/**
 * Obtiene el día de la semana (1: Lun, ..., 6: Sáb) a partir de una fecha YYYY-MM-DD
 */
export const getDayOfWeekFromDateStr = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 ? 7 : dow;
};

/**
 * Retorna los cambios de turno que aplican a un día de la semana específico
 */
export const getChangesForDayOfWeek = (
  dayOfWeek: number,
  shiftChanges: ShiftChangeRequest[]
): ShiftChangeRequest[] => {
  return shiftChanges.filter(ch => {
    if (ch.status === 'cancelled') return false;
    return getDayOfWeekFromDateStr(ch.target_date) === dayOfWeek;
  });
};

/**
 * Calcula los turnos efectivos de un coach para un día de la semana,
 * reflejando turnos cedidos (cubiertos por otros) y turnos tomados (cubriendo a otros).
 */
export const getCoachEffectiveShifts = (
  coachId: string,
  dayOfWeek: number,
  shifts: Shift[],
  shiftChanges: ShiftChangeRequest[]
): DisplayShift[] => {
  const dayChanges = getChangesForDayOfWeek(dayOfWeek, shiftChanges);
  const baseShifts = shifts.filter(s => s.coach_id === coachId && s.day_of_week === dayOfWeek);

  const result: DisplayShift[] = [];

  // 1. Procesar los turnos fijos asignados al coach
  baseShifts.forEach(shift => {
    // Buscar si hay un pedido de cambio (confirmado, tomado o abierto) que afecte a este turno.
    // Condición estricta de solapamiento de intervalos temporales: startA < endB && endA > startB
    const change = dayChanges.find(
      ch =>
        ch.requester_id === coachId &&
        ch.start_time < shift.end_time &&
        ch.end_time > shift.start_time
    );

    if (!change) {
      // Turno normal sin cambios
      result.push({ ...shift });
      return;
    }

    if (change.status === 'confirmed') {
      // Si cubre todo el turno
      if (change.start_time <= shift.start_time && change.end_time >= shift.end_time) {
        result.push({
          ...shift,
          is_replaced: true,
          replacement_coach_name: change.claimed_by_name,
          replacement_coach_id: change.claimed_by_id,
          change_target_date: change.target_date,
          change_request_id: change.id,
          change_status: 'confirmed',
          compensation_type: change.compensation_type,
        });
      } else {
        // Cobertura parcial de horas: desglosar en partes acotadas al turno original
        const repStart = change.start_time > shift.start_time ? change.start_time : shift.start_time;
        const repEnd = change.end_time < shift.end_time ? change.end_time : shift.end_time;

        if (shift.start_time < repStart) {
          result.push({
            ...shift,
            id: `${shift.id}-pre`,
            start_time: shift.start_time,
            end_time: repStart,
            duration_hours: calculateDurationHours(shift.start_time, repStart),
          });
        }
        result.push({
          ...shift,
          id: `${shift.id}-rep`,
          start_time: repStart,
          end_time: repEnd,
          duration_hours: calculateDurationHours(repStart, repEnd),
          is_replaced: true,
          replacement_coach_name: change.claimed_by_name,
          replacement_coach_id: change.claimed_by_id,
          change_target_date: change.target_date,
          change_request_id: change.id,
          change_status: 'confirmed',
          compensation_type: change.compensation_type,
        });
        if (shift.end_time > repEnd) {
          result.push({
            ...shift,
            id: `${shift.id}-post`,
            start_time: repEnd,
            end_time: shift.end_time,
            duration_hours: calculateDurationHours(repEnd, shift.end_time),
          });
        }
      }
    } else {
      // Pedido abierto o tomado (pendiente de confirmación)
      result.push({
        ...shift,
        change_status: change.status,
        change_target_date: change.target_date,
        change_request_id: change.id,
        replacement_coach_name: change.claimed_by_name,
      });
    }
  });

  // 2. Procesar turnos que este coach ACEPTÓ CUBRIR (reemplazos confirmados a favor de este coach)
  const coveringChanges = dayChanges.filter(
    ch => ch.status === 'confirmed' && ch.claimed_by_id === coachId
  );

  coveringChanges.forEach(ch => {
    // Buscar datos del turno original para mantener información de sala y compañero
    const originalShift = shifts.find(
      s =>
        s.coach_id === ch.requester_id &&
        s.day_of_week === dayOfWeek &&
        s.start_time < ch.end_time &&
        s.end_time > ch.start_time
    );

    const calculatedFranja = dayOfWeek === 6 ? 'sabado' : (ch.franja || getFranjaFromTime(ch.start_time));

    result.push({
      id: `covering-${ch.id}`,
      day_of_week: dayOfWeek,
      start_time: ch.start_time,
      end_time: ch.end_time,
      duration_hours: calculateDurationHours(ch.start_time, ch.end_time),
      franja: calculatedFranja,
      coach_id: coachId,
      coach_name: ch.claimed_by_name || '',
      is_double_coverage: originalShift?.is_double_coverage || false,
      partner_name: originalShift?.partner_name,
      is_covering: true,
      covered_coach_name: ch.requester_name,
      covered_coach_id: ch.requester_id,
      change_request_id: ch.id,
      change_target_date: ch.target_date,
      change_status: 'confirmed',
      compensation_type: ch.compensation_type,
      notes: `Reemplazo a ${ch.requester_name}` + (originalShift?.notes ? ` (${originalShift.notes})` : ''),
    });
  });

  // Ordenar por hora de inicio cronológica
  return result.sort((a, b) => a.start_time.localeCompare(b.start_time));
};

/**
 * Calcula los turnos efectivos generales para toda la grilla comunitaria,
 * reemplazando al coach cedente por el coach suplente en los cambios confirmados.
 */
export const getGeneralEffectiveShifts = (
  dayOfWeek: number,
  shifts: Shift[],
  shiftChanges: ShiftChangeRequest[]
): DisplayShift[] => {
  const dayChanges = getChangesForDayOfWeek(dayOfWeek, shiftChanges).filter(
    ch => ch.status === 'confirmed'
  );
  const baseShifts = shifts.filter(s => s.day_of_week === dayOfWeek);

  const result: DisplayShift[] = [];

  baseShifts.forEach(shift => {
    // Buscar si hay un pedido de cambio confirmado que afecte a este turno
    const change = dayChanges.find(
      ch =>
        ch.requester_id === shift.coach_id &&
        ch.start_time < shift.end_time &&
        ch.end_time > shift.start_time
    );

    if (!change) {
      result.push({ ...shift });
      return;
    }

    // Cobertura completa del turno
    if (change.start_time <= shift.start_time && change.end_time >= shift.end_time) {
      result.push({
        ...shift,
        coach_id: change.claimed_by_id || shift.coach_id,
        coach_name: change.claimed_by_name || shift.coach_name,
        is_covering: true,
        covered_coach_name: shift.coach_name,
        covered_coach_id: shift.coach_id,
        change_target_date: change.target_date,
        change_request_id: change.id,
        change_status: 'confirmed',
        compensation_type: change.compensation_type,
        notes: `Cubre ${change.claimed_by_name}` + (shift.notes ? ` (${shift.notes})` : ''),
      });
    } else {
      // Cobertura parcial: acotar intervalo a los límites reales del turno
      const repStart = change.start_time > shift.start_time ? change.start_time : shift.start_time;
      const repEnd = change.end_time < shift.end_time ? change.end_time : shift.end_time;

      if (shift.start_time < repStart) {
        result.push({
          ...shift,
          id: `${shift.id}-pre`,
          start_time: shift.start_time,
          end_time: repStart,
          duration_hours: calculateDurationHours(shift.start_time, repStart),
        });
      }
      result.push({
        ...shift,
        id: `${shift.id}-cov`,
        start_time: repStart,
        end_time: repEnd,
        duration_hours: calculateDurationHours(repStart, repEnd),
        coach_id: change.claimed_by_id || shift.coach_id,
        coach_name: change.claimed_by_name || shift.coach_name,
        is_covering: true,
        covered_coach_name: shift.coach_name,
        covered_coach_id: shift.coach_id,
        change_target_date: change.target_date,
        change_request_id: change.id,
        change_status: 'confirmed',
        compensation_type: change.compensation_type,
        notes: `Cubre ${change.claimed_by_name}` + (shift.notes ? ` (${shift.notes})` : ''),
      });
      if (shift.end_time > repEnd) {
        result.push({
          ...shift,
          id: `${shift.id}-post`,
          start_time: repEnd,
          end_time: shift.end_time,
          duration_hours: calculateDurationHours(repEnd, shift.end_time),
        });
      }
    }
  });

  return result.sort((a, b) => a.start_time.localeCompare(b.start_time));
};
