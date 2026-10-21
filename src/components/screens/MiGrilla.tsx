import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Calendar,
  ArrowLeftRight,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Hourglass,
  Handshake,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { getMonthlyGuards, MONTH_NAMES } from '../../lib/guardRotation';
import { calculateCoachMonthlyHours, getFranjaFromTime } from '../../lib/hoursAudit';
import {
  getCoachEffectiveShifts,
  getMondayOfWeek,
  getWeekDays,
  formatWeekRange,
  formatDateToIso,
} from '../../lib/effectiveShifts';

export const MiGrilla: React.FC = () => {
  const {
    currentCoach,
    shifts,
    saturdayGuards,
    shiftChanges,
    holidays,
    isAdminUnlocked,
    setIsCreateChangeModalOpen,
    setIsAuditModalOpen,
  } = useApp();
  
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = today.getDay();
    return day === 0 ? 1 : day;
  });

  // Navegación semanal (por defecto el lunes de la semana actual)
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  const weekDays = useMemo(() => getWeekDays(currentWeekMonday), [currentWeekMonday]);
  const isCurrentWeek = useMemo(() => {
    return formatDateToIso(currentWeekMonday) === formatDateToIso(getMondayOfWeek(new Date()));
  }, [currentWeekMonday]);

  const weekRangeText = useMemo(() => formatWeekRange(currentWeekMonday), [currentWeekMonday]);

  const handlePrevWeek = () => {
    setCurrentWeekMonday(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekMonday(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getMondayOfWeek(new Date()));
  };

  const myShifts = shifts.filter(s => s.coach_id === currentCoach.id);
  const weeklyHours = myShifts.reduce((acc, curr) => acc + curr.duration_hours, 0);

  // Auditoría mensual del coach en curso
  const coachMonthly = calculateCoachMonthlyHours(
    currentCoach.id,
    currentWeekMonday.getFullYear(),
    currentWeekMonday.getMonth(),
    shifts,
    saturdayGuards,
    shiftChanges,
    holidays
  );

  // Guardias de sábado del mes correspondiente
  const currentMonthGuards = getMonthlyGuards(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), saturdayGuards);
  const myGuardsThisMonth = currentMonthGuards.filter(g => g.coach_id === currentCoach.id);
  const nextGuard = myGuardsThisMonth.find(g => new Date(g.date) >= new Date(new Date().setHours(0,0,0,0))) || myGuardsThisMonth[0];

  // Feriados donde trabaja el coach actual
  const myHolidays = holidays.filter(h => {
    if (h.is_closed) return false;
    if (h.slots && h.slots.length > 0) {
      return h.slots.some(s => s.coach_id_1 === currentCoach.id || s.coach_id_2 === currentCoach.id);
    }
    return h.coach_id_1 === currentCoach.id || h.coach_id_2 === currentCoach.id;
  });

  const selectedDayInfo = weekDays.find(d => d.dayOfWeek === selectedDay) || weekDays[0];

  const selectedDayShifts = getCoachEffectiveShifts(
    currentCoach.id,
    selectedDay,
    shifts,
    shiftChanges,
    selectedDayInfo.dateStr
  );

  return (
    <div className="space-y-5 pb-20">
      {/* Tarjeta de bienvenida y métricas de carga */}
      <div className="bg-gradient-to-br from-malon-card to-[#121214] border border-malon-surface rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-malon-surface border border-malon-sand/40 flex items-center justify-center text-malon-sand font-black text-lg shadow-inner">
              {currentCoach.initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white leading-none">
                  {currentCoach.name}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30">
                  {currentCoach.role === 'admin' ? 'Jefe / Admin' : currentCoach.role === 'coach_admin' ? 'Coach Admin' : 'Coach'}
                </span>
              </div>
              <p className="text-xs text-malon-muted mt-1">
                Gimnasio Malón en Movimiento
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateChangeModalOpen(true)}
            className="bg-malon-red hover:bg-malon-red-hover active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-malon-red/20"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Pedir Cambio</span>
          </button>
        </div>

        {/* Métricas destacadas: Semanal, Mensual y Guardia */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-malon-surface/80">
          <div className="bg-malon-bg/60 rounded-xl p-2.5 border border-malon-surface/50 text-center">
            <div className="flex items-center justify-center space-x-1 text-malon-muted text-[10px] mb-1">
              <Clock className="w-3 h-3 text-malon-sand" />
              <span>Semanal</span>
            </div>
            <div className="flex items-baseline justify-center space-x-0.5">
              <span className="text-xl font-black text-white font-mono">{weeklyHours}</span>
              <span className="text-[10px] text-malon-muted font-medium">hs</span>
            </div>
            <span className="text-[9px] text-malon-muted/80 block mt-0.5">base fija</span>
          </div>

          <div className="bg-malon-bg/60 rounded-xl p-2.5 border border-malon-sand/40 text-center shadow-sm">
            <div className="flex items-center justify-center space-x-1 text-malon-sand text-[10px] mb-1 font-bold">
              <Hourglass className="w-3 h-3 text-malon-sand" />
              <span>Mes {MONTH_NAMES[today.getMonth()].slice(0, 3)}</span>
            </div>
            <div className="flex items-baseline justify-center space-x-0.5">
              <span className="text-xl font-black text-malon-sand font-mono">{coachMonthly.totalMonthlyHours}</span>
              <span className="text-[10px] text-malon-sand font-bold">hs</span>
            </div>
            <span className="text-[9px] text-malon-muted/80 block mt-0.5">
              {coachMonthly.saturdayMonthlyHours > 0 ? `+${coachMonthly.saturdayMonthlyHours}h sáb` : 'sala'}
            </span>
          </div>

          <div className="bg-malon-bg/60 rounded-xl p-2.5 border border-malon-surface/50 text-center">
            <div className="flex items-center justify-center space-x-1 text-malon-muted text-[10px] mb-1">
              <Calendar className="w-3 h-3 text-malon-red" />
              <span>Guardia</span>
            </div>
            {nextGuard ? (
              <div>
                <p className="text-[11px] font-bold text-white truncate">
                  {nextGuard.date.split('-').slice(1).reverse().join('/')}
                </p>
                <span className="text-[9px] text-malon-sand font-mono">
                  11:00 a 14:00 hs
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-malon-muted">Sin guardia</span>
            )}
          </div>
        </div>

        {/* Acceso rápido a auditoría si está desbloqueado el modo jefe */}
        {isAdminUnlocked && (
          <div className="mt-2.5 pt-2 border-t border-malon-surface/50 flex items-center justify-between">
            <span className="text-[10px] text-malon-sand font-bold uppercase tracking-wider">
              Modo Jefe Activo
            </span>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="bg-malon-surface/90 hover:bg-malon-surface border border-malon-sand/40 text-malon-sand hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Auditoría de todo el Staff</span>
            </button>
          </div>
        )}
      </div>

      {/* Selector de días de la semana y navegación semanal */}
      <div className="space-y-2">
        {/* Barra de Navegación de Semana */}
        <div className="flex items-center justify-between bg-malon-card border border-malon-surface rounded-2xl px-3 py-2 shadow-sm">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg hover:bg-malon-surface text-malon-muted hover:text-white transition-all active:scale-95"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-malon-sand" />
              <span className="text-xs font-bold text-white">
                {isCurrentWeek ? 'Semana Actual' : 'Cronograma Semanal'}
              </span>
              {isCurrentWeek && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30">
                  Esta Semana
                </span>
              )}
            </div>
            <span className="text-[11px] text-malon-muted font-mono font-medium block mt-0.5">
              {weekRangeText}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {!isCurrentWeek && (
              <button
                onClick={handleCurrentWeek}
                className="px-2 py-1 rounded-lg bg-malon-surface hover:bg-malon-surface/80 text-[10px] font-bold text-malon-sand border border-malon-surface transition-all active:scale-95"
                title="Volver a la semana actual"
              >
                Hoy
              </button>
            )}
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg hover:bg-malon-surface text-malon-muted hover:text-white transition-all active:scale-95"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Botones de Días de la Semana */}
        <div className="grid grid-cols-6 gap-1.5">
          {weekDays.map(d => {
            const dayEffective = getCoachEffectiveShifts(currentCoach.id, d.dayOfWeek, shifts, shiftChanges, d.dateStr);
            const hasShift = dayEffective.length > 0;
            const hasCovering = dayEffective.some(s => s.is_covering);
            const hasReplaced = dayEffective.some(s => s.is_replaced);
            const isSelected = selectedDay === d.dayOfWeek;

            return (
              <button
                key={d.dayOfWeek}
                onClick={() => setSelectedDay(d.dayOfWeek)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-malon-surface text-white border border-malon-sand shadow-sm'
                    : 'bg-malon-card hover:bg-malon-surface/50 text-malon-muted border border-malon-surface/60'
                }`}
              >
                <span className="text-xs font-bold leading-none">{d.name}</span>
                <span className={`text-[11px] font-mono font-bold mt-1 leading-none ${isSelected ? 'text-white' : d.isToday ? 'text-malon-sand' : 'text-malon-muted'}`}>
                  {d.dayOfMonth}
                </span>
                <span className="text-[10px] mt-1 leading-none">
                  {hasShift ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        hasCovering ? 'bg-cyan-400' : hasReplaced ? 'bg-emerald-400' : 'bg-malon-sand'
                      }`}
                    />
                  ) : (
                    <span className="text-malon-surface">-</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de turnos del día */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h4 className="text-xs font-semibold text-malon-muted">
            Turnos de {selectedDayInfo.fullName} ({selectedDayInfo.dayOfMonth}/{selectedDayInfo.dateStr.split('-')[1]})
          </h4>
        </div>

        {selectedDay === 6 ? (
          <div className="space-y-2">
            {myGuardsThisMonth.length > 0 ? (
              myGuardsThisMonth.map(guard => (
                <div
                  key={guard.id}
                  className="bg-malon-card border border-malon-surface rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30">
                      Guardia de Sábado
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {guard.start_time} - {guard.end_time} hs
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Guardia Rotativa de Sala
                    </h4>
                    <p className="text-xs text-malon-muted mt-0.5">
                      Fecha: {guard.date.split('-').slice(1).reverse().join('/')}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-malon-surface flex justify-end">
                    <button
                      onClick={() => setIsCreateChangeModalOpen(true)}
                      className="text-xs text-malon-red hover:underline font-semibold flex items-center space-x-1"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Pedir reemplazo para esta guardia</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-malon-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-malon-muted">
                  No tenés guardia asignada para este sábado de {MONTH_NAMES[today.getMonth()]}
                </p>
              </div>
            )}
          </div>
        ) : selectedDayShifts.length > 0 ? (
          <div className="space-y-2.5">
            {selectedDayShifts.map(shift => {
              const isReplaced = shift.is_replaced;
              const isCovering = shift.is_covering;
              const hasOpenChange = shift.change_status === 'open';
              const hasClaimedChange = shift.change_status === 'claimed';

              return (
                <div
                  key={shift.id}
                  className={`bg-malon-card border rounded-2xl p-4 transition-all space-y-3 ${
                    isCovering
                      ? 'border-cyan-500/40 bg-gradient-to-r from-malon-card to-cyan-950/20 shadow-sm'
                      : isReplaced
                      ? 'border-emerald-500/30 bg-gradient-to-r from-malon-card to-emerald-950/20'
                      : 'border-malon-surface hover:border-malon-sand/50'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {(() => {
                        const effectiveFranja = shift.day_of_week === 6 ? 'sabado' : getFranjaFromTime(shift.start_time);
                        const badgeConfig = {
                          manana: { label: 'Turno Mañana', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
                          siesta: { label: 'Turno Siesta', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
                          tarde: { label: 'Turno Tarde', style: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
                          noche: { label: 'Turno Noche', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
                          sabado: { label: 'Guardia Sábado', style: 'bg-malon-sand/20 text-malon-sand border-malon-sand/30' },
                        }[effectiveFranja] || { label: `Turno ${effectiveFranja}`, style: 'bg-malon-surface text-malon-muted border-malon-surface' };

                        return (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeConfig.style}`}>
                            {badgeConfig.label}
                          </span>
                        );
                      })()}

                      {isCovering && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1">
                          <Handshake className="w-3 h-3" />
                          <span>Cubriendo a {shift.covered_coach_name}</span>
                        </span>
                      )}

                      {isReplaced && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cubre {shift.replacement_coach_name}</span>
                        </span>
                      )}

                      {!isCovering && !isReplaced && hasOpenChange && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                          <Hourglass className="w-3 h-3" />
                          <span>En Bolsa de Cambios</span>
                        </span>
                      )}

                      {!isCovering && !isReplaced && hasClaimedChange && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                          <Handshake className="w-3 h-3" />
                          <span>Tomado por {shift.replacement_coach_name}</span>
                        </span>
                      )}

                      {shift.is_double_coverage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Doble Cobertura</span>
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-black font-mono text-white">
                      {shift.start_time} - {shift.end_time} hs
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center justify-between">
                      <span>Sala de Entrenamiento</span>
                      <span className="text-xs text-malon-muted font-normal">
                        {shift.duration_hours} hs
                      </span>
                    </h4>

                    {/* Mensaje informativo de reemplazo tomado a favor */}
                    {isCovering && (
                      <div className="mt-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
                        <span className="flex items-center space-x-1.5">
                          <Handshake className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span>Reemplazo confirmado: estás cubriendo a <strong>{shift.covered_coach_name}</strong> {shift.change_target_date ? `(${shift.change_target_date.split('-').slice(1).reverse().join('/')})` : ''}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 px-2 py-0.5 rounded-full">
                          Asignado
                        </span>
                      </div>
                    )}

                    {/* Mensaje informativo de turno cedido */}
                    {isReplaced && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
                        <span className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>Reemplazo confirmado: <strong>{shift.replacement_coach_name}</strong> cubre este turno {shift.change_target_date ? `(${shift.change_target_date.split('-').slice(1).reverse().join('/')})` : ''}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          Cubierto
                        </span>
                      </div>
                    )}

                    {shift.is_double_coverage && shift.partner_name && (
                      <p className="text-xs text-malon-sand font-medium mt-1 flex items-center space-x-1">
                        <span>Junto a:</span>
                        <strong className="text-white underline decoration-malon-sand">
                          {shift.partner_name}
                        </strong>
                      </p>
                    )}
                    {shift.notes && (
                      <p className="text-xs text-malon-muted/80 mt-1">
                        {shift.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-malon-surface flex items-center justify-between">
                    <span className="text-[11px] text-malon-muted">
                      {isCovering
                        ? 'Cobertura de reemplazo'
                        : isReplaced
                        ? 'Turno cubierto por compañero'
                        : shift.is_double_coverage
                        ? 'Cobertura compartida'
                        : 'Bloque individual'}
                    </span>

                    {isCovering ? (
                      <span className="text-xs text-cyan-300 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>En tu cronograma</span>
                      </span>
                    ) : isReplaced ? (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Turno cubierto</span>
                      </span>
                    ) : hasOpenChange ? (
                      <span className="text-xs text-amber-400 font-medium flex items-center space-x-1">
                        <Hourglass className="w-3.5 h-3.5" />
                        <span>Publicado en Bolsa</span>
                      </span>
                    ) : hasClaimedChange ? (
                      <span className="text-xs text-amber-300 font-medium flex items-center space-x-1">
                        <Handshake className="w-3.5 h-3.5" />
                        <span>Tomado (Confirmar en Cambios)</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsCreateChangeModalOpen(true)}
                        className="text-xs text-malon-red hover:text-white hover:bg-malon-red/20 px-2.5 py-1 rounded-lg border border-malon-red/30 font-semibold transition-all flex items-center space-x-1"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Pedir reemplazo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-6 text-center">
            <Clock className="w-8 h-8 text-malon-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-malon-muted">
              Día libre para {currentCoach.name} 🎉
            </p>
          </div>
        )}
      </div>

      {/* Guardias de sábado del mes actual (sin historial antiguo) */}
      <div className="bg-malon-card border border-malon-surface rounded-2xl p-4">
        <h4 className="text-xs font-bold text-malon-sand uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Guardias de Sábados ({MONTH_NAMES[today.getMonth()]})</span>
          <span className="text-[10px] text-malon-muted font-mono">11:00 - 14:00 hs</span>
        </h4>
        <div className="space-y-2 mt-3">
          {currentMonthGuards.map((sg, idx) => {
            const isMe = sg.coach_id === currentCoach.id;
            return (
              <div
                key={sg.id || idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                  isMe
                    ? 'bg-malon-surface/80 border-malon-sand text-white font-bold'
                    : 'bg-malon-bg/40 border-malon-surface/50 text-malon-muted'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white">
                    {sg.date.split('-').slice(1).reverse().join('/')}
                  </span>
                  <span>•</span>
                  <span className={`${isMe ? 'text-malon-sand font-bold' : 'text-white'}`}>
                    {sg.coach_name} {isMe && '(Te toca a vos)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-malon-muted">
                  11:00 - 14:00 hs
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jornadas Especiales / Feriados asignados */}
      {myHolidays.length > 0 && (
        <div className="bg-malon-card border border-malon-surface rounded-2xl p-4">
          <h4 className="text-xs font-bold text-malon-sand uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Mis Feriados Asignados (Doble Cobertura)</span>
            <span className="text-[10px] text-malon-sand font-bold">Especial</span>
          </h4>
          <div className="space-y-2.5 mt-3">
            {myHolidays.map(h => {
              const mySlots = h.slots
                ? h.slots.filter(s => s.coach_id_1 === currentCoach.id || s.coach_id_2 === currentCoach.id)
                : [];

              return (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-malon-surface/70 border border-malon-sand/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{h.name}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-malon-card border border-malon-sand/40 text-malon-sand font-mono font-bold text-xs">
                      {h.date.split('-').slice(1).reverse().join('/')}
                    </span>
                  </div>

                  {mySlots.length > 0 ? (
                    <div className="space-y-1.5 pt-1 border-t border-malon-surface/60">
                      {mySlots.map((s, idx) => {
                        const partner = s.coach_id_1 === currentCoach.id ? s.coach_name_2 : s.coach_name_1;
                        return (
                          <div
                            key={s.id || idx}
                            className="flex items-center justify-between text-[11px] bg-malon-card/60 p-2 rounded-lg border border-malon-surface/60"
                          >
                            <span className="font-mono text-malon-sand font-bold">
                              {s.time_display} ({s.duration_hours} hs)
                            </span>
                            <span className="text-malon-muted">
                              Dupla: <strong className="text-white">{partner}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-malon-muted text-[11px] pt-1 border-t border-malon-surface/60">
                      <span className="font-mono text-malon-sand font-bold">
                        {h.time_display}
                      </span>
                      <span>
                        Dupla: <strong className="text-white">{h.coach_id_1 === currentCoach.id ? h.coach_name_2 : h.coach_name_1}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
