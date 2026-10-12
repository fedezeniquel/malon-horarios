import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  StaffMember,
  Shift,
  SaturdayGuard,
  ShiftChangeRequest,
  ShiftChangeType,
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
  INITIAL_NOTIFICATIONS,
} from '../lib/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateDurationHours } from '../lib/hoursAudit';
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
  confirmShiftChange: (requestId: string) => void;
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

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v3_production') {
      localStorage.setItem('malon_data_version', 'v3_production');
      localStorage.setItem('malon_shifts', JSON.stringify(INITIAL_SHIFTS));
      localStorage.setItem('malon_saturday_guards', JSON.stringify(INITIAL_SATURDAY_GUARDS));
      localStorage.setItem('malon_shift_changes', JSON.stringify([]));
      return INITIAL_SHIFTS;
    }
    const local = localStorage.getItem('malon_shifts');
    return local ? JSON.parse(local) : INITIAL_SHIFTS;
  });

  const [saturdayGuards, setSaturdayGuards] = useState<SaturdayGuard[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v3_production') {
      return INITIAL_SATURDAY_GUARDS;
    }
    const local = localStorage.getItem('malon_saturday_guards');
    return local ? JSON.parse(local) : INITIAL_SATURDAY_GUARDS;
  });

  const [shiftChanges, setShiftChanges] = useState<ShiftChangeRequest[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v3_production') {
      return [];
    }
    const local = localStorage.getItem('malon_shift_changes');
    return local ? JSON.parse(local) : INITIAL_SHIFT_CHANGES;
  });

  const [holidays, setHolidays] = useState<HolidaySchedule[]>(() => {
    const version = localStorage.getItem('malon_data_version');
    if (version !== 'v3_production') {
      return INITIAL_HOLIDAYS;
    }
    const local = localStorage.getItem('malon_holidays');
    return local ? JSON.parse(local) : INITIAL_HOLIDAYS;
  });

  const [editingHoliday, setEditingHoliday] = useState<HolidaySchedule | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const local = localStorage.getItem('malon_notifications');
    return local ? JSON.parse(local) : INITIAL_NOTIFICATIONS;
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

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const channel = client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shift_changes' },
        (payload) => {
          console.log('Realtime shift_changes update:', payload);
        }
      )
      .subscribe();

    return () => {
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
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
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

    // Aviso 1: Notificar cuando alguien pide un cambio
    addNotification({
      type: 'shift_change_request',
      title: '🔄 Nuevo Pedido de Cambio',
      message: `${currentCoach.name} necesita reemplazo para el ${data.day_name} (${data.start_time} a ${data.end_time} hs). Motivo: ${data.reason || 'Sin especificar'}.`,
      link_tab: 'cambios',
    });
  };

  const claimShiftChange = (requestId: string) => {
    const targetChange = shiftChanges.find(item => item.id === requestId);

    setShiftChanges(prev =>
      prev.map(item => {
        if (item.id === requestId) {
          return {
            ...item,
            status: 'claimed',
            claimed_by_id: currentCoach.id,
            claimed_by_name: currentCoach.name,
            claimed_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    // Aviso 1: Notificar cuando el cambio ya fue tomado
    if (targetChange) {
      addNotification({
        type: 'shift_change_claimed',
        title: '✅ ¡Cambio Tomado!',
        message: `${currentCoach.name} tomó el turno del ${targetChange.target_date} (${targetChange.start_time} a ${targetChange.end_time} hs) solicitado por ${targetChange.requester_name}.`,
        link_tab: 'cambios',
      });
    }
  };

  const confirmShiftChange = (requestId: string) => {
    setShiftChanges(prev =>
      prev.map(item => {
        if (item.id === requestId) {
          return {
            ...item,
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );
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
  };

  // Funciones de administración de turnos de la grilla
  const updateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => (s.id === updatedShift.id ? updatedShift : s)));
  };

  const addShift = (newShiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...newShiftData,
      id: `shift-${Date.now()}`,
    };
    setShifts(prev => [...prev, newShift]);
  };

  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  // Funciones de administración de bloques de cobertura
  const saveShiftBlock = (data: ShiftBlockData) => {
    const duration = calculateDurationHours(data.start_time, data.end_time) || 1;
    const idsToRemove = new Set(data.existingShiftIds);

    const newShifts: Shift[] = [];
    const baseId1 = data.existingShiftIds[0] || `shift-${Date.now()}`;
    newShifts.push({
      id: baseId1,
      day_of_week: data.day_of_week,
      franja: data.franja,
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
        franja: data.franja,
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
  };

  const deleteShiftBlock = (shiftIds: string[]) => {
    const idsToRemove = new Set(shiftIds);
    setShifts(prev => prev.filter(s => !idsToRemove.has(s.id)));
  };

  // Funciones de administración de guardias de los sábados
  const addSaturdayGuard = (newGuardData: Omit<SaturdayGuard, 'id'>) => {
    const newGuard: SaturdayGuard = {
      ...newGuardData,
      id: `sg-${Date.now()}`,
    };
    setSaturdayGuards(prev => [...prev, newGuard].sort((a, b) => a.date.localeCompare(b.date)));
  };

  const updateSaturdayGuard = (guard: SaturdayGuard) => {
    setSaturdayGuards(prev =>
      prev.map(g => (g.id === guard.id ? guard : g)).sort((a, b) => a.date.localeCompare(b.date))
    );
  };

  const deleteSaturdayGuard = (guardId: string) => {
    setSaturdayGuards(prev => prev.filter(g => g.id !== guardId));
  };

  // Funciones de administración de feriados
  const addHoliday = (newHolidayData: Omit<HolidaySchedule, 'id'>) => {
    const newHoliday: HolidaySchedule = {
      ...newHolidayData,
      id: `hol-${Date.now()}`,
    };
    setHolidays(prev => [...prev, newHoliday].sort((a, b) => a.date.localeCompare(b.date)));

    // Aviso 3: Notificación de asignación de turno de feriado
    if (!newHoliday.is_closed && (newHoliday.coach_name_1 || newHoliday.coach_name_2)) {
      const coaches = [newHoliday.coach_name_1, newHoliday.coach_name_2].filter(Boolean).join(' y ');
      addNotification({
        type: 'holiday_assignment',
        title: '📅 Asignación de Turno de Feriado',
        message: `Feriado "${newHoliday.name}" (${newHoliday.date}): se asignó turno especial de doble cobertura (${newHoliday.time_display}) a ${coaches}.`,
        link_tab: 'general',
      });
    }
  };

  const updateHoliday = (holiday: HolidaySchedule) => {
    setHolidays(prev =>
      prev.map(h => (h.id === holiday.id ? holiday : h)).sort((a, b) => a.date.localeCompare(b.date))
    );

    // Aviso 3: Notificación de actualización / reasignación de turno de feriado
    if (!holiday.is_closed && (holiday.coach_name_1 || holiday.coach_name_2)) {
      const coaches = [holiday.coach_name_1, holiday.coach_name_2].filter(Boolean).join(' y ');
      addNotification({
        type: 'holiday_assignment',
        title: '📅 Turno de Feriado Modificado',
        message: `Feriado "${holiday.name}" (${holiday.date}): asignados en doble cobertura (${holiday.time_display}) ${coaches}.`,
        link_tab: 'general',
      });
    }
  };

  const deleteHoliday = (holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
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
        const isMyHoliday = holiday.coach_id_1 === currentCoach.id || holiday.coach_id_2 === currentCoach.id;
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
                message: `${whenText} (${holiday.name} - ${holiday.date}): Tenés turno asignado (${holiday.time_display}) en doble cobertura.`,
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
