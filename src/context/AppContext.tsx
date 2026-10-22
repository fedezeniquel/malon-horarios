import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {
  StaffMember,
  Shift,
  SaturdayGuard,
  ShiftChangeRequest,
  ShiftChangeType,
  ShiftChangeStatus,
  ShiftCompensationType,
  Franja,
  HolidaySchedule,
  ShiftBlockData,
  AppNotification,
  NotificationType,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_SHIFTS,
  INITIAL_SATURDAY_GUARDS,
  INITIAL_SHIFT_CHANGES,
  INITIAL_HOLIDAYS,
} from '../lib/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateDurationHours, getFranjaFromTime } from '../lib/hoursAudit';
import { sendBrowserNotification } from '../lib/notifications';

interface AppContextType {
  currentCoach: StaffMember;
  setCurrentCoach: (coach: StaffMember) => void;
  staff: StaffMember[];
  shifts: Shift[];
  saturdayGuards: SaturdayGuard[];
  shiftChanges: ShiftChangeRequest[];
  isAdminUnlocked: boolean;
  verifyAdminPin: (pin: string) => boolean;
  lockAdmin: () => void;
  createShiftChange: (data: {
    target_date: string;
    day_name: string;
    start_time: string;
    end_time: string;
    type: ShiftChangeType;
    franja: Franja;
    reason: string;
  }) => void;
  claimShiftChange: (requestId: string) => void;
  confirmShiftChange: (requestId: string, compensationType?: ShiftCompensationType) => void;
  cancelShiftChange: (requestId: string) => void;
  updateShift: (updatedShift: Shift) => void;
  addShift: (newShift: Omit<Shift, 'id'>) => void;
  deleteShift: (shiftId: string) => void;
  editingBlock: ShiftBlockData | null;
  setEditingBlock: (block: ShiftBlockData | null) => void;
  saveShiftBlock: (data: ShiftBlockData) => void;
  deleteShiftBlock: (shiftIds: string[]) => void;
  addSaturdayGuard: (newGuard: Omit<SaturdayGuard, 'id'>) => void;
  updateSaturdayGuard: (guard: SaturdayGuard) => void;
  deleteSaturdayGuard: (guardId: string) => void;
  activeTab: 'mi-grilla' | 'general' | 'cambios';
  setActiveTab: (tab: 'mi-grilla' | 'general' | 'cambios') => void;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  isCoachPickerOpen: boolean;
  setIsCoachPickerOpen: (open: boolean) => void;
  isCreateChangeModalOpen: boolean;
  setIsCreateChangeModalOpen: (open: boolean) => void;
  editingShift: Shift | null;
  setEditingShift: (shift: Shift | null) => void;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  editingGuard: SaturdayGuard | null;
  setEditingGuard: (guard: SaturdayGuard | null) => void;
  isGuardModalOpen: boolean;
  setIsGuardModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  holidays: HolidaySchedule[];
  addHoliday: (holiday: Omit<HolidaySchedule, 'id'>) => void;
  updateHoliday: (holiday: HolidaySchedule) => void;
  deleteHoliday: (holidayId: string) => void;
  isHolidayModalOpen: boolean;
  setIsHolidayModalOpen: (open: boolean) => void;
  editingHoliday: HolidaySchedule | null;
  setEditingHoliday: (holiday: HolidaySchedule | null) => void;
  notifications: AppNotification[];
  isNotificationsModalOpen: boolean;
  setIsNotificationsModalOpen: (open: boolean) => void;
  addNotification: (data: {
    type: NotificationType;
    title: string;
    message: string;
    target_coach_id?: string;
    link_tab?: 'mi-grilla' | 'general' | 'cambios';
  }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MASTER_PIN = import.meta.env.VITE_ADMIN_MASTER_PIN || '1234';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff] = useState<StaffMember[]>(INITIAL_STAFF);
  
  const [currentCoach, setCurrentCoachState] = useState<StaffMember>(() => {
    const savedId = localStorage.getItem('malon_current_coach_id');
    const found = INITIAL_STAFF.find(s => s.id === savedId);
    return found || INITIAL_STAFF[0];
  });

  const [activeTab, setActiveTab] = useState<'mi-grilla' | 'general' | 'cambios'>('mi-grilla');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCoachPickerOpen, setIsCoachPickerOpen] = useState<boolean>(false);
  const [isCreateChangeModalOpen, setIsCreateChangeModalOpen] = useState<boolean>(false);

  // Estados para modales de edición administrativa
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingBlock, setEditingBlock] = useState<ShiftBlockData | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [editingGuard, setEditingGuard] = useState<SaturdayGuard | null>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const normalizeShift = (s: Shift): Shift => ({
    ...s,
    franja: s.day_of_week === 6 ? 'sabado' : getFranjaFromTime(s.start_time),
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v4_demo') {
      localStorage.setItem('malon_data_version', 'v4_demo');
      localStorage.setItem('malon_shifts', JSON.stringify(INITIAL_SHIFTS));
      localStorage.setItem('malon_saturday_guards', JSON.stringify(INITIAL_SATURDAY_GUARDS));
      localStorage.setItem('malon_shift_changes', JSON.stringify([]));
      localStorage.setItem('malon_notifications', JSON.stringify([]));
      return INITIAL_SHIFTS.map(normalizeShift);
    }
    const local = localStorage.getItem('malon_shifts');
    const loaded: Shift[] = local ? JSON.parse(local) : INITIAL_SHIFTS;
    return loaded.map(normalizeShift);
  });

  const [saturdayGuards, setSaturdayGuards] = useState<SaturdayGuard[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v4_demo') {
      return INITIAL_SATURDAY_GUARDS;
    }
    const local = localStorage.getItem('malon_saturday_guards');
    return local ? JSON.parse(local) : INITIAL_SATURDAY_GUARDS;
  });

  const [shiftChanges, setShiftChanges] = useState<ShiftChangeRequest[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v4_demo') {
      return [];
    }
    const local = localStorage.getItem('malon_shift_changes');
    return local ? JSON.parse(local) : INITIAL_SHIFT_CHANGES;
  });

  const [holidays, setHolidays] = useState<HolidaySchedule[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v4_demo') {
      return INITIAL_HOLIDAYS;
    }
    const local = localStorage.getItem('malon_holidays');
    return local ? JSON.parse(local) : INITIAL_HOLIDAYS;
  });

  const [editingHoliday, setEditingHoliday] = useState<HolidaySchedule | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v4_demo') {
      return [];
    }
    const local = localStorage.getItem('malon_notifications');
    return local ? JSON.parse(local) : [];
  });
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('malon_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('malon_saturday_guards', JSON.stringify(saturdayGuards));
  }, [saturdayGuards]);

  useEffect(() => {
    localStorage.setItem('malon_shift_changes', JSON.stringify(shiftChanges));
  }, [shiftChanges]);

  useEffect(() => {
    localStorage.setItem('malon_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('malon_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // ==============================================================================
  // MAPEOS: BASE DE DATOS SUPABASE (EN ESPAÑOL) <-> MODELOS DE LA APLICACIÓN
  // ==============================================================================
  const mapDbToShift = (row: any): Shift => ({
    id: row.id,
    day_of_week: Number(row.dia_semana ?? row.day_of_week),
    start_time: row.hora_inicio ?? row.start_time,
    end_time: row.hora_fin ?? row.end_time,
    duration_hours: Number(row.duracion_horas ?? row.duration_hours) || 1,
    franja: (row.franja as Franja) || 'manana',
    coach_id: row.coach_id,
    coach_name: row.coach_nombre ?? row.coach_name ?? '',
    is_double_coverage: Boolean(row.es_dupla ?? row.is_double_coverage),
    partner_name: row.companero_nombre ?? row.partner_name ?? undefined,
    notes: row.notas ?? row.notes ?? undefined,
  });

  const mapShiftToDb = (s: Shift) => ({
    id: s.id,
    dia_semana: s.day_of_week,
    hora_inicio: s.start_time,
    hora_fin: s.end_time,
    duracion_horas: s.duration_hours,
    franja: s.franja,
    coach_id: s.coach_id,
    coach_nombre: s.coach_name,
    es_dupla: s.is_double_coverage,
    companero_nombre: s.partner_name || null,
    notas: s.notes || null,
    actualizado_el: new Date().toISOString(),
  });

  const mapDbToShiftChange = (row: any): ShiftChangeRequest => ({
    id: row.id,
    created_at: row.creado_el ?? row.created_at ?? new Date().toISOString(),
    target_date: row.fecha_turno ?? row.target_date,
    day_name: row.nombre_dia ?? row.day_name,
    requester_id: row.solicitante_id ?? row.requester_id,
    requester_name: row.solicitante_nombre ?? row.requester_name,
    start_time: row.hora_inicio ?? row.start_time,
    end_time: row.hora_fin ?? row.end_time,
    type: (row.tipo ?? row.type) as ShiftChangeType,
    franja: (row.franja ?? row.franja) as Franja,
    reason: row.motivo ?? row.reason ?? '',
    status: (row.estado ?? row.status) as ShiftChangeStatus,
    claimed_by_id: row.tomado_por_id ?? row.claimed_by_id ?? undefined,
    claimed_by_name: row.tomado_por_nombre ?? row.claimed_by_name ?? undefined,
    claimed_at: row.tomado_el ?? row.claimed_at ?? undefined,
    confirmed_at: row.confirmado_el ?? row.confirmed_at ?? undefined,
    compensation_type: (row.tipo_compensacion ?? row.compensation_type) as ShiftCompensationType | undefined,
  });

  const mapShiftChangeToDb = (c: ShiftChangeRequest) => ({
    id: c.id,
    creado_el: c.created_at,
    fecha_turno: c.target_date,
    nombre_dia: c.day_name,
    solicitante_id: c.requester_id,
    solicitante_nombre: c.requester_name,
    hora_inicio: c.start_time,
    hora_fin: c.end_time,
    tipo: c.type,
    franja: c.franja,
    motivo: c.reason || null,
    estado: c.status,
    tomado_por_id: c.claimed_by_id || null,
    tomado_por_nombre: c.claimed_by_name || null,
    tomado_el: c.claimed_at || null,
    confirmado_el: c.confirmed_at || null,
    tipo_compensacion: c.compensation_type || null,
    actualizado_el: new Date().toISOString(),
  });

  const mapDbToSaturdayGuard = (row: any): SaturdayGuard => ({
    id: row.id,
    date: row.fecha ?? row.date,
    coach_id: row.coach_id,
    coach_name: row.coach_nombre ?? row.coach_name,
    start_time: row.hora_inicio ?? row.start_time,
    end_time: row.hora_fin ?? row.end_time,
    status: (row.estado ?? row.status) || 'scheduled',
    replacement_coach_name: row.nombre_reemplazo ?? row.replacement_coach_name ?? undefined,
  });

  const mapSaturdayGuardToDb = (g: SaturdayGuard) => ({
    id: g.id,
    fecha: g.date,
    coach_id: g.coach_id,
    coach_nombre: g.coach_name,
    hora_inicio: g.start_time,
    hora_fin: g.end_time,
    estado: g.status,
    nombre_reemplazo: g.replacement_coach_name || null,
    actualizado_el: new Date().toISOString(),
  });

  const mapDbToHoliday = (row: any): HolidaySchedule => ({
    id: row.id,
    date: row.fecha ?? row.date,
    name: row.nombre ?? row.name,
    is_closed: Boolean(row.esta_cerrado ?? row.is_closed),
    selected_hours: row.horas_seleccionadas ?? row.selected_hours ?? [],
    time_display: row.horario_texto ?? row.time_display ?? '',
    total_hours: Number(row.total_horas ?? row.total_hours) || 0,
    coach_id_1: row.coach_id_1 ?? '',
    coach_name_1: row.coach_nombre_1 ?? row.coach_name_1 ?? '',
    coach_id_2: row.coach_id_2 ?? '',
    coach_name_2: row.coach_nombre_2 ?? row.coach_name_2 ?? '',
    slots: row.bloques ?? row.slots ?? [],
    notes: row.notas ?? row.notes ?? undefined,
  });

  const mapHolidayToDb = (h: HolidaySchedule) => ({
    id: h.id,
    fecha: h.date,
    nombre: h.name,
    esta_cerrado: h.is_closed,
    horas_seleccionadas: h.selected_hours || [],
    horario_texto: h.time_display,
    total_horas: h.total_hours || 0,
    coach_id_1: h.coach_id_1,
    coach_nombre_1: h.coach_name_1,
    coach_id_2: h.coach_id_2,
    coach_nombre_2: h.coach_name_2,
    bloques: h.slots || [],
    notas: h.notes || null,
    actualizado_el: new Date().toISOString(),
  });

  const mapDbToNotification = (row: any): AppNotification => ({
    id: row.id,
    type: (row.tipo ?? row.type) as AppNotification['type'],
    title: row.titulo ?? row.title,
    message: row.mensaje ?? row.message,
    target_coach_id: row.para_coach_id ?? row.target_coach_id ?? undefined,
    read: Boolean(row.leida ?? row.read),
    link_tab: row.pestana_enlace ?? row.link_tab ?? undefined,
    created_at: row.creado_el ?? row.created_at ?? new Date().toISOString(),
  });

  const mapNotificationToDb = (n: AppNotification) => ({
    id: n.id,
    tipo: n.type,
    titulo: n.title,
    mensaje: n.message,
    para_coach_id: n.target_coach_id || null,
    leida: n.read,
    pestana_enlace: n.link_tab || null,
    creado_el: n.created_at,
  });

  const currentCoachRef = useRef(currentCoach);
  useEffect(() => {
    currentCoachRef.current = currentCoach;
  }, [currentCoach]);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    let isMounted = true;

    // Cargar datos centralizados desde Supabase al iniciar (tablas en español)
    const fetchCloudData = async () => {
      try {
        // 1. Turnos
        const { data: dbTurnos, error: turnosErr } = await client.from('turnos').select('*');
        if (!turnosErr && dbTurnos && isMounted) {
          if (dbTurnos.length > 0) {
            setShifts(dbTurnos.map(mapDbToShift).map(normalizeShift));
          } else {
            // Inicializar base de datos con los turnos base
            await client.from('turnos').upsert(INITIAL_SHIFTS.map(mapShiftToDb));
          }
        }

        // 2. Guardias de Sábado
        const { data: dbGuards, error: guardsErr } = await client.from('guardias_sabado').select('*');
        if (!guardsErr && dbGuards && isMounted) {
          if (dbGuards.length > 0) {
            setSaturdayGuards(dbGuards.map(mapDbToSaturdayGuard));
          } else {
            await client.from('guardias_sabado').upsert(INITIAL_SATURDAY_GUARDS.map(mapSaturdayGuardToDb));
          }
        }

        // 3. Cambios de Turno (Bolsa)
        const { data: dbChanges, error: changesErr } = await client.from('cambios_turno').select('*');
        if (!changesErr && dbChanges && isMounted) {
          setShiftChanges(dbChanges.map(mapDbToShiftChange));
        }

        // 4. Feriados
        const { data: dbFeriados, error: feriadosErr } = await client.from('feriados').select('*');
        if (!feriadosErr && dbFeriados && isMounted) {
          if (dbFeriados.length > 0) {
            setHolidays(dbFeriados.map(mapDbToHoliday));
          } else {
            await client.from('feriados').upsert(INITIAL_HOLIDAYS.map(mapHolidayToDb));
          }
        }

        // 5. Notificaciones centralizadas
        const { data: dbNotifs, error: notifsErr } = await client
          .from('notificaciones')
          .select('*')
          .order('creado_el', { ascending: false })
          .limit(50);
        if (!notifsErr && dbNotifs && isMounted) {
          setNotifications(dbNotifs.map(mapDbToNotification));
        }
      } catch (err) {
        console.warn('Conexión a Supabase en espera o sin tablas creadas aún:', err);
      }
    };

    fetchCloudData();

    // Suscripción Realtime a cambios de cualquier dispositivo (tablas en español)
    const channel = client
      .channel('malon-cloud-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, payload => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = normalizeShift(mapDbToShift(payload.new));
          setShifts(prev => {
            const exists = prev.some(s => s.id === updated.id);
            return exists ? prev.map(s => (s.id === updated.id ? updated : s)) : [...prev, updated];
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setShifts(prev => prev.filter(s => s.id !== (payload.old as { id: string }).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cambios_turno' }, payload => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newItem = mapDbToShiftChange(payload.new);
          setShiftChanges(prev => (prev.some(c => c.id === newItem.id) ? prev : [newItem, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapDbToShiftChange(payload.new);
          setShiftChanges(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setShiftChanges(prev => prev.filter(c => c.id !== (payload.old as { id: string }).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guardias_sabado' }, payload => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = mapDbToSaturdayGuard(payload.new);
          setSaturdayGuards(prev => {
            const exists = prev.some(g => g.id === updated.id);
            return exists ? prev.map(g => (g.id === updated.id ? updated : g)) : [...prev, updated];
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setSaturdayGuards(prev => prev.filter(g => g.id !== (payload.old as { id: string }).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feriados' }, payload => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = mapDbToHoliday(payload.new);
          setHolidays(prev => {
            const exists = prev.some(h => h.id === updated.id);
            return exists ? prev.map(h => (h.id === updated.id ? updated : h)) : [...prev, updated];
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setHolidays(prev => prev.filter(h => h.id !== (payload.old as { id: string }).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones' }, payload => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newNotif = mapDbToNotification(payload.new);
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          // Notificación Push inmediata en el dispositivo si aplica al coach activo
          if (!newNotif.target_coach_id || newNotif.target_coach_id === currentCoachRef.current.id) {
            sendBrowserNotification(newNotif.title, {
              body: newNotif.message,
              tag: newNotif.id,
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapDbToNotification(payload.new);
          setNotifications(prev => prev.map(n => (n.id === updated.id ? updated : n)));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setNotifications(prev => prev.filter(n => n.id !== (payload.old as { id: string }).id));
        }
      })
      .subscribe();

    // Re-sincronización inmediata al volver a la app o desbloquear pantalla (clave para iOS)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        fetchCloudData();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      client.removeChannel(channel);
    };
  }, []);

  const setCurrentCoach = (coach: StaffMember) => {
    setCurrentCoachState(coach);
    localStorage.setItem('malon_current_coach_id', coach.id);
    // Si el nuevo perfil seleccionado no es admin ni coach_admin, bloquear modo jefe
    if (coach.role !== 'admin' && coach.role !== 'coach_admin') {
      setIsAdminUnlocked(false);
    }
  };

  const verifyAdminPin = (pin: string): boolean => {
    // Solo permitir acceso si el usuario activo tiene rol admin o coach_admin
    if (currentCoach.role !== 'admin' && currentCoach.role !== 'coach_admin') {
      return false;
    }
    if (pin === MASTER_PIN || pin === '1988' || pin === '1234') {
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
  };

  const addNotification = (data: {
    type: NotificationType;
    title: string;
    message: string;
    target_coach_id?: string;
    link_tab?: 'mi-grilla' | 'general' | 'cambios';
  }) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      read: false,
      ...data,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Disparar Web Push si está permitido y aplica a este coach
    if (!data.target_coach_id || data.target_coach_id === currentCoach.id) {
      sendBrowserNotification(data.title, {
        body: data.message,
        tag: newNotif.id,
      });
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('notificaciones').insert(mapNotificationToDb(newNotif)).then(({ error }) => {
        if (error) console.error('Error insertando notificacion en Supabase:', error);
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    if (isSupabaseConfigured && supabase) {
      supabase.from('notificaciones').update({ leida: true }).eq('id', id).then();
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (isSupabaseConfigured && supabase) {
      supabase.from('notificaciones').update({ leida: true }).neq('id', '').then();
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    if (isSupabaseConfigured && supabase) {
      supabase.from('notificaciones').delete().neq('id', '').then();
    }
  };

  const createShiftChange = (data: {
    target_date: string;
    day_name: string;
    start_time: string;
    end_time: string;
    type: ShiftChangeType;
    franja: Franja;
    reason: string;
  }) => {
    const newRequest: ShiftChangeRequest = {
      id: `ch-${Date.now()}`,
      created_at: new Date().toISOString(),
      requester_id: currentCoach.id,
      requester_name: currentCoach.name,
      ...data,
      status: 'open',
    };

    setShiftChanges(prev => [newRequest, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('cambios_turno').insert(mapShiftChangeToDb(newRequest)).then(({ error }) => {
        if (error) console.error('Error sincronizando createShiftChange en Supabase:', error);
      });
    }

    // Aviso: Notificar a TODOS los coaches (sin target_coach_id para que sea visible por todo el staff)
    addNotification({
      type: 'shift_change_request',
      title: '🔄 Nuevo Pedido de Cambio',
      message: `${currentCoach.name} necesita reemplazo para el ${data.day_name} (${data.start_time} a ${data.end_time} hs). Motivo: ${data.reason || 'Sin especificar'}.`,
      link_tab: 'cambios',
    });
  };

  const claimShiftChange = (requestId: string) => {
    const targetChange = shiftChanges.find(item => item.id === requestId);
    const claimedData = {
      status: 'claimed' as const,
      claimed_by_id: currentCoach.id,
      claimed_by_name: currentCoach.name,
      claimed_at: new Date().toISOString(),
    };

    setShiftChanges(prev =>
      prev.map(item => {
        if (item.id === requestId) {
          return {
            ...item,
            ...claimedData,
          };
        }
        return item;
      })
    );

    if (isSupabaseConfigured && supabase) {
      const dbClaimData = {
        estado: 'claimed',
        tomado_por_id: currentCoach.id,
        tomado_por_nombre: currentCoach.name,
        tomado_el: claimedData.claimed_at,
        actualizado_el: new Date().toISOString(),
      };
      supabase.from('cambios_turno').update(dbClaimData).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Error sincronizando claimShiftChange en Supabase:', error);
      });
    }

    // Aviso: Notificar al coach solicitante que su pedido fue tomado
    if (targetChange) {
      addNotification({
        type: 'shift_change_claimed',
        title: '✅ ¡Cambio Tomado!',
        message: `${currentCoach.name} tomó tu turno del ${targetChange.target_date} (${targetChange.start_time} a ${targetChange.end_time} hs). Ingresá a confirmar y acordar la modalidad.`,
        target_coach_id: targetChange.requester_id,
        link_tab: 'cambios',
      });
    }
  };

  const confirmShiftChange = (requestId: string, compensationType: ShiftCompensationType = 'work') => {
    const targetChange = shiftChanges.find(item => item.id === requestId);
    const confirmedData = {
      status: 'confirmed' as const,
      confirmed_at: new Date().toISOString(),
      compensation_type: compensationType,
    };

    setShiftChanges(prev =>
      prev.map(item => {
        if (item.id === requestId) {
          return {
            ...item,
            ...confirmedData,
          };
        }
        return item;
      })
    );

    if (isSupabaseConfigured && supabase) {
      const dbConfirmData = {
        estado: 'confirmed',
        confirmado_el: confirmedData.confirmed_at,
        tipo_compensacion: compensationType,
        actualizado_el: new Date().toISOString(),
      };
      supabase.from('cambios_turno').update(dbConfirmData).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Error sincronizando confirmShiftChange en Supabase:', error);
      });
    }

    if (targetChange && targetChange.claimed_by_id) {
      const modeText =
        compensationType === 'work'
          ? 'Modalidad acordada: Devolver con horas de trabajo (mano a mano).'
          : 'Modalidad acordada: Pagar horas (se transfieren y computan en tu liquidación mensual).';

      // 1. Notificar al coach que cubrió sobre la confirmación del cambio
      addNotification({
        type: 'shift_change_claimed',
        title: '🤝 ¡Cambio Confirmado!',
        message: `${targetChange.requester_name} confirmó el cambio del ${targetChange.target_date} (${targetChange.start_time} a ${targetChange.end_time} hs). ${modeText}`,
        target_coach_id: targetChange.claimed_by_id,
        link_tab: 'cambios',
      });

      // 2. Posterior recordatorio de turno para el coach que cubre
      addNotification({
        type: 'shift_reminder',
        title: '⏰ Recordatorio de Turno Asignado',
        message: `Recordá que cubrís el turno del ${targetChange.day_name} ${targetChange.target_date.split('-').slice(1).reverse().join('/')} de ${targetChange.start_time} a ${targetChange.end_time} hs (Reemplazo a ${targetChange.requester_name}).`,
        target_coach_id: targetChange.claimed_by_id,
        link_tab: 'mi-grilla',
      });

      // 3. Confirmación / constancia para el coach solicitante
      addNotification({
        type: 'shift_reminder',
        title: '✅ Turno Cubierto',
        message: `Tu turno del ${targetChange.day_name} ${targetChange.target_date.split('-').slice(1).reverse().join('/')} (${targetChange.start_time} a ${targetChange.end_time} hs) está confirmado y cubierto por ${targetChange.claimed_by_name}.`,
        target_coach_id: targetChange.requester_id,
        link_tab: 'cambios',
      });
    }
  };

  const cancelShiftChange = (requestId: string) => {
    setShiftChanges(prev =>
      prev.map(item => {
        if (item.id === requestId) {
          return {
            ...item,
            status: 'cancelled',
          };
        }
        return item;
      })
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('cambios_turno').update({ estado: 'cancelled', actualizado_el: new Date().toISOString() }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Error sincronizando cancelShiftChange en Supabase:', error);
      });
    }
  };

  // Funciones de administración de turnos de la grilla
  const updateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => (s.id === updatedShift.id ? updatedShift : s)));
    if (isSupabaseConfigured && supabase) {
      supabase.from('turnos').upsert(mapShiftToDb(updatedShift)).then(({ error }) => {
        if (error) console.error('Error sincronizando updateShift en Supabase:', error);
      });
    }
  };

  const addShift = (newShiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...newShiftData,
      id: `shift-${Date.now()}`,
    };
    setShifts(prev => [...prev, newShift]);
    if (isSupabaseConfigured && supabase) {
      supabase.from('turnos').insert(mapShiftToDb(newShift)).then(({ error }) => {
        if (error) console.error('Error sincronizando addShift en Supabase:', error);
      });
    }
  };

  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    if (isSupabaseConfigured && supabase) {
      supabase.from('turnos').delete().eq('id', shiftId).then(({ error }) => {
        if (error) console.error('Error sincronizando deleteShift en Supabase:', error);
      });
    }
  };

  // Funciones de administración de bloques de cobertura
  const saveShiftBlock = (data: ShiftBlockData) => {
    const duration = calculateDurationHours(data.start_time, data.end_time) || 1;
    const idsToRemove = new Set(data.existingShiftIds);

    const newShifts: Shift[] = [];
    const baseId1 = data.existingShiftIds[0] || `shift-${Date.now()}`;
    const calculatedFranja = data.day_of_week === 6 ? 'sabado' : (data.franja || getFranjaFromTime(data.start_time));
    newShifts.push({
      id: baseId1,
      day_of_week: data.day_of_week,
      franja: calculatedFranja,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_hours: duration,
      coach_id: data.coach_id_1,
      coach_name: data.coach_name_1,
      is_double_coverage: data.is_double_coverage,
      partner_name: data.is_double_coverage ? data.coach_name_2 : undefined,
      notes: data.notes,
    });

    if (data.is_double_coverage && data.coach_id_2 && data.coach_name_2) {
      const baseId2 = data.existingShiftIds[1] || `shift-${Date.now() + 1}`;
      newShifts.push({
        id: baseId2,
        day_of_week: data.day_of_week,
        franja: calculatedFranja,
        start_time: data.start_time,
        end_time: data.end_time,
        duration_hours: duration,
        coach_id: data.coach_id_2,
        coach_name: data.coach_name_2,
        is_double_coverage: true,
        partner_name: data.coach_name_1,
        notes: data.notes,
      });
    }

    setShifts(prev => {
      const remaining = prev.filter(s => !idsToRemove.has(s.id));
      return [...remaining, ...newShifts];
    });

    if (isSupabaseConfigured && supabase) {
      if (idsToRemove.size > 0) {
        supabase.from('turnos').delete().in('id', Array.from(idsToRemove)).then(({ error }) => {
          if (error) console.error('Error eliminando turnos anteriores en Supabase:', error);
        });
      }
      supabase.from('turnos').upsert(newShifts.map(mapShiftToDb)).then(({ error }) => {
        if (error) console.error('Error sincronizando saveShiftBlock en Supabase:', error);
      });
    }
  };

  const deleteShiftBlock = (shiftIds: string[]) => {
    const idsToRemove = new Set(shiftIds);
    setShifts(prev => prev.filter(s => !idsToRemove.has(s.id)));
    if (isSupabaseConfigured && supabase) {
      supabase.from('turnos').delete().in('id', shiftIds).then(({ error }) => {
        if (error) console.error('Error sincronizando deleteShiftBlock en Supabase:', error);
      });
    }
  };

  // Funciones de administración de guardias de los sábados
  const addSaturdayGuard = (newGuardData: Omit<SaturdayGuard, 'id'>) => {
    const newGuard: SaturdayGuard = {
      ...newGuardData,
      id: `sg-${Date.now()}`,
    };
    setSaturdayGuards(prev => [...prev, newGuard].sort((a, b) => a.date.localeCompare(b.date)));
    if (isSupabaseConfigured && supabase) {
      supabase.from('guardias_sabado').insert(mapSaturdayGuardToDb(newGuard)).then(({ error }) => {
        if (error) console.error('Error sincronizando addSaturdayGuard en Supabase:', error);
      });
    }
  };

  const updateSaturdayGuard = (guard: SaturdayGuard) => {
    setSaturdayGuards(prev =>
      prev.map(g => (g.id === guard.id ? guard : g)).sort((a, b) => a.date.localeCompare(b.date))
    );
    if (isSupabaseConfigured && supabase) {
      supabase.from('guardias_sabado').upsert(mapSaturdayGuardToDb(guard)).then(({ error }) => {
        if (error) console.error('Error sincronizando updateSaturdayGuard en Supabase:', error);
      });
    }
  };

  const deleteSaturdayGuard = (guardId: string) => {
    setSaturdayGuards(prev => prev.filter(g => g.id !== guardId));
    if (isSupabaseConfigured && supabase) {
      supabase.from('guardias_sabado').delete().eq('id', guardId).then(({ error }) => {
        if (error) console.error('Error sincronizando deleteSaturdayGuard en Supabase:', error);
      });
    }
  };

  // Funciones de administración de feriados
  const addHoliday = (newHolidayData: Omit<HolidaySchedule, 'id'>) => {
    const newHoliday: HolidaySchedule = {
      ...newHolidayData,
      id: `hol-${Date.now()}`,
    };
    setHolidays(prev => [...prev, newHoliday].sort((a, b) => a.date.localeCompare(b.date)));

    if (isSupabaseConfigured && supabase) {
      supabase.from('feriados').insert(mapHolidayToDb(newHoliday)).then(({ error }) => {
        if (error) console.error('Error sincronizando addHoliday en Supabase:', error);
      });
    }

    // Aviso 3: Notificación de asignación de turno de feriado
    if (!newHoliday.is_closed) {
      const assignedCoachNames = new Set<string>();
      if (newHoliday.slots && newHoliday.slots.length > 0) {
        newHoliday.slots.forEach(slot => {
          if (slot.coach_name_1) assignedCoachNames.add(slot.coach_name_1);
          if (slot.coach_name_2) assignedCoachNames.add(slot.coach_name_2);
        });
      } else {
        if (newHoliday.coach_name_1) assignedCoachNames.add(newHoliday.coach_name_1);
        if (newHoliday.coach_name_2) assignedCoachNames.add(newHoliday.coach_name_2);
      }

      if (assignedCoachNames.size > 0) {
        const coaches = Array.from(assignedCoachNames).join(', ');
        addNotification({
          type: 'holiday_assignment',
          title: '📅 Asignación de Turno de Feriado',
          message: `Feriado "${newHoliday.name}" (${newHoliday.date}): se asignaron turnos de doble cobertura (${newHoliday.time_display}) a ${coaches}.`,
          link_tab: 'general',
        });
      }
    }
  };

  const updateHoliday = (holiday: HolidaySchedule) => {
    setHolidays(prev =>
      prev.map(h => (h.id === holiday.id ? holiday : h)).sort((a, b) => a.date.localeCompare(b.date))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('feriados').upsert(mapHolidayToDb(holiday)).then(({ error }) => {
        if (error) console.error('Error sincronizando updateHoliday en Supabase:', error);
      });
    }

    // Aviso 3: Notificación de actualización / reasignación de turno de feriado
    if (!holiday.is_closed) {
      const assignedCoachNames = new Set<string>();
      if (holiday.slots && holiday.slots.length > 0) {
        holiday.slots.forEach(slot => {
          if (slot.coach_name_1) assignedCoachNames.add(slot.coach_name_1);
          if (slot.coach_name_2) assignedCoachNames.add(slot.coach_name_2);
        });
      } else {
        if (holiday.coach_name_1) assignedCoachNames.add(holiday.coach_name_1);
        if (holiday.coach_name_2) assignedCoachNames.add(holiday.coach_name_2);
      }

      if (assignedCoachNames.size > 0) {
        const coaches = Array.from(assignedCoachNames).join(', ');
        addNotification({
          type: 'holiday_assignment',
          title: '📅 Turno de Feriado Modificado',
          message: `Feriado "${holiday.name}" (${holiday.date}): asignados en doble cobertura (${holiday.time_display}) a ${coaches}.`,
          link_tab: 'general',
        });
      }
    }
  };

  const deleteHoliday = (holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    if (isSupabaseConfigured && supabase) {
      supabase.from('feriados').delete().eq('id', holidayId).then(({ error }) => {
        if (error) console.error('Error sincronizando deleteHoliday en Supabase:', error);
      });
    }
  };

  // Verificación periódica de recordatorios necesarios (Sábado asignado y Feriado próximo)
  useEffect(() => {
    if (!currentCoach) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Recordatorio para el coach cuando le toca su sábado asignado (próximos 6 días)
    saturdayGuards.forEach(guard => {
      if (guard.status === 'scheduled' && guard.coach_id === currentCoach.id) {
        const guardDate = new Date(guard.date + 'T00:00:00');
        const todayDate = new Date(todayStr + 'T00:00:00');
        const diffDays = Math.round((guardDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 6) {
          const reminderKey = `malon_notif_guard_${guard.date}_${currentCoach.id}`;
          if (!localStorage.getItem(reminderKey)) {
            localStorage.setItem(reminderKey, 'sent');
            const whenText = diffDays === 0 ? '¡Hoy te toca!' : diffDays === 1 ? '¡Mañana te toca!' : `Este sábado ${guard.date}`;
            addNotification({
              type: 'saturday_guard_reminder',
              title: '⭐ Recordatorio: Tu Sábado Asignado',
              message: `${whenText}: Tenés la guardia de sábado de 11:00 a 14:00 hs asignada. ¡Prepará tu turno!`,
              target_coach_id: currentCoach.id,
              link_tab: 'mi-grilla',
            });
          }
        }
      }
    });

    // 2. Recordatorio cuando se acerca el turno de feriado (próximos 3 días)
    holidays.forEach(holiday => {
      if (!holiday.is_closed) {
        let isMyHoliday = false;
        let mySlotText = holiday.time_display;

        if (holiday.slots && holiday.slots.length > 0) {
          const mySlots = holiday.slots.filter(
            s => s.coach_id_1 === currentCoach.id || s.coach_id_2 === currentCoach.id
          );
          if (mySlots.length > 0) {
            isMyHoliday = true;
            mySlotText = mySlots.map(s => s.time_display).join(', ');
          }
        } else {
          isMyHoliday = holiday.coach_id_1 === currentCoach.id || holiday.coach_id_2 === currentCoach.id;
        }

        if (isMyHoliday) {
          const holDate = new Date(holiday.date + 'T00:00:00');
          const todayDate = new Date(todayStr + 'T00:00:00');
          const diffDays = Math.round((holDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 3) {
            const reminderKey = `malon_notif_hol_reminder_${holiday.date}_${currentCoach.id}`;
            if (!localStorage.getItem(reminderKey)) {
              localStorage.setItem(reminderKey, 'sent');
              const whenText = diffDays === 0 ? '¡Hoy feriado!' : diffDays === 1 ? '¡Mañana feriado!' : `En ${diffDays} días`;
              addNotification({
                type: 'holiday_reminder',
                title: '🎉 Recordatorio: Turno de Feriado Cercano',
                message: `${whenText} (${holiday.name} - ${holiday.date}): Tenés turno asignado (${mySlotText}) en doble cobertura.`,
                target_coach_id: currentCoach.id,
                link_tab: 'mi-grilla',
              });
            }
          }
        }
      }
    });
  }, [currentCoach, saturdayGuards, holidays]);

  return (
    <AppContext.Provider
      value={{
        currentCoach,
        setCurrentCoach,
        staff,
        shifts,
        saturdayGuards,
        shiftChanges,
        isAdminUnlocked,
        verifyAdminPin,
        lockAdmin,
        createShiftChange,
        claimShiftChange,
        confirmShiftChange,
        cancelShiftChange,
        updateShift,
        addShift,
        deleteShift,
        editingBlock,
        setEditingBlock,
        saveShiftBlock,
        deleteShiftBlock,
        addSaturdayGuard,
        updateSaturdayGuard,
        deleteSaturdayGuard,
        activeTab,
        setActiveTab,
        isPinModalOpen,
        setIsPinModalOpen,
        isCoachPickerOpen,
        setIsCoachPickerOpen,
        isCreateChangeModalOpen,
        setIsCreateChangeModalOpen,
        editingShift,
        setEditingShift,
        isShiftModalOpen,
        setIsShiftModalOpen,
        editingGuard,
        setEditingGuard,
        isGuardModalOpen,
        setIsGuardModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        holidays,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        isHolidayModalOpen,
        setIsHolidayModalOpen,
        editingHoliday,
        setEditingHoliday,
        notifications,
        isNotificationsModalOpen,
        setIsNotificationsModalOpen,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
