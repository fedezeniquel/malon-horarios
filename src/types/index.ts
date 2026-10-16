export type Role = 'admin' | 'coach_admin' | 'coach';

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  initials: string;
  phone?: string;
}

export type Franja = 'manana' | 'siesta' | 'tarde' | 'noche' | 'sabado';

export interface Shift {
  id: string;
  day_of_week: number; // 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado
  start_time: string; // ej: "07:00"
  end_time: string;   // ej: "09:00" o "13:00"
  duration_hours: number;
  franja: Franja;
  coach_id: string;
  coach_name: string;
  is_double_coverage: boolean;
  partner_name?: string;
  notes?: string;
}

export interface SaturdayGuard {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "11:00"
  end_time: string;   // "14:00"
  coach_id: string;
  coach_name: string;
  status: 'scheduled' | 'completed' | 'replaced';
  replacement_coach_name?: string;
}

export type ShiftChangeType = 'single_hour' | 'multiple_hours' | 'full_shift';
export type ShiftChangeStatus = 'open' | 'claimed' | 'confirmed' | 'cancelled';
export type ShiftCompensationType = 'work' | 'pay'; // 'work': Devolver con horas de trabajo, 'pay': Pagar / Computar horas

export interface ShiftChangeRequest {
  id: string;
  created_at: string;
  requester_id: string;
  requester_name: string;
  target_date: string; // YYYY-MM-DD
  day_name: string;
  start_time: string; // "07:00"
  end_time: string;   // "08:00"
  type: ShiftChangeType;
  franja: Franja;
  reason: string;
  status: ShiftChangeStatus;
  claimed_by_id?: string;
  claimed_by_name?: string;
  claimed_at?: string;
  confirmed_at?: string;
  compensation_type?: ShiftCompensationType;
}

export interface HolidaySlot {
  id: string;
  start_time: string; // ej: "08:00"
  end_time: string;   // ej: "09:00"
  duration_hours: number; // ej: 1
  hours: string[];    // ej: ["08:00"]
  time_display: string; // ej: "08:00 a 09:00 hs"
  coach_id_1: string;
  coach_name_1: string;
  coach_id_2: string;
  coach_name_2: string;
}

export interface HolidaySchedule {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // Nombre del feriado
  is_closed: boolean; // Si el gimnasio no abre en todo el día
  selected_hours: string[]; // Horas en punto tildadas (ej: ["09:00", "10:00", "11:00", "12:00"])
  time_display: string; // Resumen legible (ej: "09:00 a 13:00 hs")
  total_hours: number; // Cantidad total de horas trabajadas
  coach_id_1: string; // Dupla principal o primer slot (compatibilidad)
  coach_name_1: string;
  coach_id_2: string;
  coach_name_2: string;
  slots?: HolidaySlot[]; // Desglose por turnos/bloques con duplas específicas
  notes?: string;
}

export interface ShiftBlockData {
  existingShiftIds: string[];
  day_of_week: number;
  franja: Franja;
  start_time: string;
  end_time: string;
  is_double_coverage: boolean;
  coach_id_1: string;
  coach_name_1: string;
  coach_id_2?: string;
  coach_name_2?: string;
  notes?: string;
}

export type NotificationType =
  | 'shift_change_request'
  | 'shift_change_claimed'
  | 'saturday_guard_reminder'
  | 'holiday_assignment'
  | 'holiday_reminder';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string; // ISO string
  read: boolean;
  target_coach_id?: string; // Si es null/undefined, es visible para todo el staff
  link_tab?: 'mi-grilla' | 'general' | 'cambios';
}


