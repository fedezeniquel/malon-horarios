import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Sunset,
  Moon,
  Shield,
  ShieldCheck,
  Users,
  Clock,
  CalendarDays,
  Edit2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import type { Shift, SaturdayGuard } from '../../types';
import { getMonthlyGuards, MONTH_NAMES } from '../../lib/guardRotation';

const DAYS = [
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
];

export const General: React.FC = () => {
  const {
    shifts,
    saturdayGuards,
    isAdminUnlocked,
    setIsPinModalOpen,
    setEditingShift,
    setIsShiftModalOpen,
    setEditingGuard,
    setIsGuardModalOpen,
    deleteSaturdayGuard,
  } = useApp();
  
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 1 : day;
  });

  // Estado para la vista mensual de sábados (por defecto el mes y año actual)
  const today = new Date();
  const [guardYear, setGuardYear] = useState<number>(() => today.getFullYear());
  const [guardMonth, setGuardMonth] = useState<number>(() => today.getMonth());

  // Sábados computados únicamente para el mes seleccionado, siguiendo la rotación a futuro (Gala, Fede, Sil, Vicky, Gise)
  const monthlyGuards = getMonthlyGuards(guardYear, guardMonth, saturdayGuards);

  const isCurrentMonth = guardYear === today.getFullYear() && guardMonth === today.getMonth();

  const handlePrevMonth = () => {
    if (guardMonth === 0) {
      setGuardMonth(11);
      setGuardYear(prev => prev - 1);
    } else {
      setGuardMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (guardMonth === 11) {
      setGuardMonth(0);
      setGuardYear(prev => prev + 1);
    } else {
      setGuardMonth(prev => prev + 1);
    }
  };

  const handleResetCurrentMonth = () => {
    setGuardYear(today.getFullYear());
    setGuardMonth(today.getMonth());
  };

  const dayShifts = shifts.filter(s => s.day_of_week === selectedDay);

  const mananaShifts = dayShifts.filter(s => s.franja === 'manana');
  const tardeShifts = dayShifts.filter(s => s.franja === 'tarde');
  const nocheShifts = dayShifts.filter(s => s.franja === 'noche');

  const groupDoubleShifts = (shiftList: Shift[]) => {
    const renderedIds = new Set<string>();
    const grouped: {
      isDouble: boolean;
      coaches: string[];
      startTime: string;
      endTime: string;
      notes?: string;
      items: Shift[];
    }[] = [];

    shiftList.forEach(shift => {
      if (renderedIds.has(shift.id)) return;

      if (shift.is_double_coverage) {
        const partner = shiftList.find(
          s => s.id !== shift.id &&
               s.is_double_coverage &&
               s.start_time === shift.start_time &&
               s.end_time === shift.end_time
        );

        if (partner) {
          renderedIds.add(shift.id);
          renderedIds.add(partner.id);
          grouped.push({
            isDouble: true,
            coaches: [shift.coach_name, partner.coach_name],
            startTime: shift.start_time,
            endTime: shift.end_time,
            notes: shift.notes,
            items: [shift, partner],
          });
          return;
        }
      }

      renderedIds.add(shift.id);
      grouped.push({
        isDouble: false,
        coaches: [shift.coach_name],
        startTime: shift.start_time,
        endTime: shift.end_time,
        notes: shift.notes,
        items: [shift],
      });
    });

    return grouped;
  };

  const handleCreateShift = () => {
    setEditingShift(null);
    setIsShiftModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setIsShiftModalOpen(true);
  };

  const handleCreateGuard = () => {
    setEditingGuard(null);
    setIsGuardModalOpen(true);
  };

  const handleEditGuard = (guard: SaturdayGuard) => {
    setEditingGuard(guard);
    setIsGuardModalOpen(true);
  };

  const handleDeleteGuard = (guard: SaturdayGuard) => {
    if (window.confirm(`¿Seguro que deseas sacar a ${guard.coach_name} de la guardia del sábado ${guard.date}?`)) {
      deleteSaturdayGuard(guard.id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Banner de administración si está activo */}
      {isAdminUnlocked ? (
        <div className="bg-gradient-to-r from-malon-red/20 to-malon-red/10 border border-malon-red/50 rounded-2xl p-3.5 flex items-center justify-between shadow-lg shadow-malon-red/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-malon-red text-white flex items-center justify-center shadow">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">Modo Jefe Activo</span>
                <span className="bg-malon-red text-white text-[9px] px-2 py-0.2 rounded-full font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-malon-sand">
                Podés editar turnos fijos y gestionar las guardias de sábados
              </p>
            </div>
          </div>

          {selectedDay !== 6 ? (
            <button
              onClick={handleCreateShift}
              className="bg-malon-red hover:bg-malon-red-hover text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Turno</span>
            </button>
          ) : (
            <button
              onClick={handleCreateGuard}
              className="bg-malon-sand hover:bg-malon-sand-hover text-black px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sábado</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-malon-card border border-malon-surface rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-malon-muted">Cronograma de profesores y guardias en sala</span>
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="text-[11px] font-bold text-malon-sand hover:text-white flex items-center space-x-1"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Acceso PIN Jefe</span>
          </button>
        </div>
      )}

      {/* Selector de días */}
      <div className="bg-malon-card border border-malon-surface rounded-2xl p-1.5 flex items-center space-x-1 overflow-x-auto">
        {DAYS.map(d => {
          const isSelected = selectedDay === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`flex-1 min-w-[50px] py-2 rounded-xl text-center transition-all ${
                isSelected
                  ? 'bg-malon-red text-white font-bold shadow-md shadow-malon-red/20'
                  : 'text-malon-muted hover:text-white hover:bg-malon-surface/50 font-medium'
              }`}
            >
              <span className="text-xs block leading-tight">{d.short}</span>
            </button>
          );
        })}
      </div>

      {/* Título del día */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <CalendarDays className="w-4 h-4 text-malon-sand" />
          <span>{DAYS.find(d => d.id === selectedDay)?.name} en Sala</span>
        </h3>
        <span className="text-xs text-malon-muted">
          {selectedDay === 6 ? `${monthlyGuards.length} sábados este mes` : '3 Franjas Operativas'}
        </span>
      </div>

      {selectedDay === 6 ? (
        /* VISTA MENSUAL DE SÁBADOS: SOLAMENTE EL MES ACTUAL CON ROTACIÓN FUTURA */
        <div className="space-y-3">
          <div className="bg-malon-card border border-malon-surface rounded-2xl p-4 space-y-3">
            {/* Cabecera y Navegador de Mes */}
            <div className="flex items-center justify-between border-b border-malon-surface pb-3">
              <div>
                <h4 className="text-xs font-bold text-malon-sand uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Guardias de Sábados (11:00 a 14:00 hs)</span>
                </h4>
                <p className="text-[11px] text-malon-muted mt-0.5">
                  Vista mensual exclusiva (sin historial antiguo)
                </p>
              </div>

              {isAdminUnlocked && (
                <button
                  onClick={handleCreateGuard}
                  className="bg-malon-sand hover:bg-malon-sand-hover text-black px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Asignar</span>
                </button>
              )}
            </div>

            {/* Controles de Navegación de Mes */}
            <div className="flex items-center justify-between bg-malon-bg/60 p-2 rounded-xl border border-malon-surface/60">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-malon-muted hover:text-white hover:bg-malon-surface transition-all"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-sm font-bold text-white">
                  {MONTH_NAMES[guardMonth]} {guardYear}
                </span>
                {isCurrentMonth ? (
                  <span className="text-[10px] font-semibold text-malon-sand block">
                    (Mes Actual)
                  </span>
                ) : (
                  <button
                    onClick={handleResetCurrentMonth}
                    className="text-[10px] font-semibold text-malon-sand hover:underline flex items-center justify-center space-x-1 mx-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ir al mes actual</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-malon-muted hover:text-white hover:bg-malon-surface transition-all"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Orden de rotación futura destacado */}
            <div className="bg-malon-surface/40 border border-malon-surface/80 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-malon-sand uppercase tracking-wider block mb-1">
                Orden de Rotación (5 personas)
              </span>
              <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-medium text-malon-muted py-0.5">
                <span className="text-white font-bold bg-malon-surface px-1.5 py-0.5 rounded">Gala</span>
                <span>➔</span>
                <span className="text-white font-bold bg-malon-surface px-1.5 py-0.5 rounded">Fede</span>
                <span>➔</span>
                <span className="text-white font-bold bg-malon-surface px-1.5 py-0.5 rounded">Sil</span>
                <span>➔</span>
                <span className="text-white font-bold bg-malon-surface px-1.5 py-0.5 rounded">Vicky</span>
                <span>➔</span>
                <span className="text-white font-bold bg-malon-surface px-1.5 py-0.5 rounded">Gise</span>
              </div>
            </div>

            {/* Lista de los sábados de este mes */}
            <div className="space-y-2.5 pt-1">
              {monthlyGuards.map((guard, index) => {
                const parts = guard.date.split('-');
                const displayDate = `${parts[2]}/${parts[1]}`;

                return (
                  <div
                    key={guard.id || index}
                    className="p-3.5 rounded-xl bg-malon-surface/60 border border-malon-surface hover:border-malon-sand/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-malon-sand text-black font-black flex items-center justify-center text-sm shadow">
                        {guard.coach_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">
                            {guard.coach_name}
                          </h4>
                          <span className="text-[10px] font-mono text-malon-muted">
                            Sábado #{index + 1}
                          </span>
                        </div>
                        <p className="text-xs text-malon-muted flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-white font-semibold">
                            {displayDate}
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            {guard.start_time} - {guard.end_time} hs
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Acciones de administración de guardia si el PIN está activo */}
                    {isAdminUnlocked && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleEditGuard(guard)}
                          className="p-2 rounded-lg bg-malon-surface hover:bg-malon-card text-malon-sand hover:text-white border border-malon-surface transition-all"
                          title="Cambiar persona asignada"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuard(guard)}
                          className="p-2 rounded-lg bg-malon-surface hover:bg-malon-red/20 text-malon-muted hover:text-malon-red border border-malon-surface transition-all"
                          title="Sacar persona de este sábado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Franjas del día de semana: Mañana, Tarde, Noche */
        <div className="space-y-3">
          {/* 1. FRANJA MAÑANA (07:00 a 13:00) */}
          <div className="bg-malon-card border border-malon-surface rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-malon-surface/80 pb-2">
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Turno Mañana
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                07:00 a 13:00 hs
              </span>
            </div>

            <div className="space-y-2">
              {groupDoubleShifts(mananaShifts).map((block, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border transition-all ${
                    block.isDouble
                      ? 'bg-gradient-to-r from-malon-surface to-malon-surface/80 border-malon-sand/40 shadow-sm'
                      : 'bg-malon-bg/50 border-malon-surface/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {block.startTime} - {block.endTime} hs
                    </span>

                    <div className="flex items-center space-x-2">
                      {block.isDouble && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>DOBLE COBERTURA</span>
                        </span>
                      )}

                      {isAdminUnlocked && (
                        <button
                          onClick={() => handleEditShift(block.items[0])}
                          className="p-1 rounded-md bg-malon-card hover:bg-malon-surface text-malon-sand hover:text-white border border-malon-surface transition-all"
                          title="Editar este turno fijo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {block.coaches.map((cName, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          block.isDouble
                            ? 'bg-malon-card text-malon-sand border border-malon-sand/30'
                            : 'bg-malon-surface text-white'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-malon-sand/20 text-malon-sand flex items-center justify-center text-[9px] font-black">
                          {cName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{cName}</span>
                      </div>
                    ))}
                  </div>

                  {block.notes && (
                    <p className="text-[11px] text-malon-muted mt-2">
                      {block.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. FRANJA TARDE (13:00 a 18:00) */}
          <div className="bg-malon-card border border-malon-surface rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-malon-surface/80 pb-2">
              <div className="flex items-center space-x-2">
                <Sunset className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Turno Tarde
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400">
                13:00 a 18:00 hs
              </span>
            </div>

            <div className="space-y-2">
              {groupDoubleShifts(tardeShifts).map((block, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border bg-malon-bg/50 border-malon-surface/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {block.startTime} - {block.endTime} hs
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-malon-muted font-medium">
                        Bloque Individual
                      </span>

                      {isAdminUnlocked && (
                        <button
                          onClick={() => handleEditShift(block.items[0])}
                          className="p-1 rounded-md bg-malon-card hover:bg-malon-surface text-malon-sand hover:text-white border border-malon-surface transition-all"
                          title="Editar este turno fijo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {block.coaches.map((cName, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-malon-surface text-white"
                      >
                        <div className="w-4 h-4 rounded-full bg-malon-sand/20 text-malon-sand flex items-center justify-center text-[9px] font-black">
                          {cName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{cName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. FRANJA NOCHE (18:00 a 21:00) */}
          <div className="bg-malon-card border border-malon-surface rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-malon-surface/80 pb-2">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Turno Noche
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">
                18:00 a 21:00 hs
              </span>
            </div>

            <div className="space-y-2">
              {groupDoubleShifts(nocheShifts).map((block, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border bg-gradient-to-r from-malon-surface to-malon-surface/80 border-malon-sand/40 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {block.startTime} - {block.endTime} hs
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>DOBLE COBERTURA SIMULTÁNEA</span>
                      </span>

                      {isAdminUnlocked && (
                        <button
                          onClick={() => handleEditShift(block.items[0])}
                          className="p-1 rounded-md bg-malon-card hover:bg-malon-surface text-malon-sand hover:text-white border border-malon-surface transition-all"
                          title="Editar este turno fijo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {block.coaches.map((cName, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-malon-card text-malon-sand border border-malon-sand/30"
                      >
                        <div className="w-4 h-4 rounded-full bg-malon-sand/20 text-malon-sand flex items-center justify-center text-[9px] font-black">
                          {cName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{cName}</span>
                      </div>
                    ))}
                  </div>

                  {block.notes && (
                    <p className="text-[11px] text-malon-muted mt-2">
                      {block.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
