import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Sunset, Moon, Shield, ShieldCheck, Users, Clock, CalendarDays } from 'lucide-react';
import type { Shift } from '../../types';

const DAYS = [
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
];

export const General: React.FC = () => {
  const { shifts, saturdayGuards, isAdminUnlocked, setIsPinModalOpen } = useApp();
  
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 1 : day;
  });

  const dayShifts = shifts.filter(s => s.day_of_week === selectedDay);

  const mananaShifts = dayShifts.filter(s => s.franja === 'manana');
  const tardeShifts = dayShifts.filter(s => s.franja === 'tarde');
  const nocheShifts = dayShifts.filter(s => s.franja === 'noche');

  const saturdayGuard = saturdayGuards[0];

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

  return (
    <div className="space-y-4 pb-20">
      {/* Banner de administración si está activo */}
      {isAdminUnlocked ? (
        <div className="bg-malon-red/10 border border-malon-red/40 rounded-xl p-3 flex items-center justify-between text-xs text-malon-red font-semibold">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-malon-red" />
            <span>Modo Jefe Activo: Gestión de sala autorizada</span>
          </div>
          <span className="bg-malon-red text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            ADMIN
          </span>
        </div>
      ) : (
        <div className="bg-malon-card border border-malon-surface rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-malon-muted">Cronograma completo de profesores en sala</span>
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
          {selectedDay === 6 ? 'Guardia Rotativa' : '3 Franjas Operativas'}
        </span>
      </div>

      {selectedDay === 6 ? (
        /* Guardia de Sábado */
        <div className="bg-gradient-to-br from-malon-card to-[#151518] border border-malon-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-malon-sand flex items-center space-x-1.5 bg-malon-sand/10 px-2.5 py-1 rounded-full border border-malon-sand/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Guardia Sábado: 11:00 a 14:00 hs</span>
            </span>
            <span className="text-xs font-mono text-malon-muted">Rotativo</span>
          </div>

          <div className="p-3 rounded-xl bg-malon-surface/60 border border-malon-surface flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-malon-sand text-black font-black flex items-center justify-center text-sm shadow">
                {saturdayGuard ? saturdayGuard.coach_name.slice(0, 2).toUpperCase() : 'SG'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {saturdayGuard?.coach_name || 'Profesor Designado'}
                </h4>
                <p className="text-xs text-malon-muted">
                  Responsable de sala y guardia
                </p>
              </div>
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

                    {block.isDouble && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>DOBLE COBERTURA</span>
                      </span>
                    )}
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
                    <span className="text-[10px] text-malon-muted font-medium">
                      Bloque Individual (5 hs)
                    </span>
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>DOBLE COBERTURA SIMULTÁNEA</span>
                    </span>
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
