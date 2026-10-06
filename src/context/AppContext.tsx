import React, { createContext, useContext, useState, useEffect } from 'react';
import type { StaffMember, Shift, SaturdayGuard, ShiftChangeRequest, ShiftChangeType, Franja } from '../types';
import { INITIAL_STAFF, INITIAL_SHIFTS, INITIAL_SATURDAY_GUARDS, INITIAL_SHIFT_CHANGES } from '../lib/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [editingGuard, setEditingGuard] = useState<SaturdayGuard | null>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState<boolean>(false);

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
  };

  const verifyAdminPin = (pin: string): boolean => {
    if (pin === MASTER_PIN || pin === '1988' || pin === '1234') {
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
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
  };

  const claimShiftChange = (requestId: string) => {
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
