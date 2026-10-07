import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Clock, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import type { ShiftChangeType, Franja } from '../../types';
import { getHoursBetween, calculateDurationHours } from '../../lib/hoursAudit';
import { getMonthlyGuards } from '../../lib/guardRotation';

export const CreateShiftChangeModal: React.FC = () => {
  const {
    currentCoach,
    shifts,
    saturdayGuards,
    isCreateChangeModalOpen,
    setIsCreateChangeModalOpen,
    createShiftChange,
  } = useApp();

  // Buscar el día más cercano donde el coach tiene turno asignado para abrir el modal ahí por defecto
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    const coachDays = new Set(
      shifts.filter(s => s.coach_id === currentCoach.id).map(s => s.day_of_week)
    );

    for (let i = 0; i < 7; i++) {
      const candidate = new Date();
      candidate.setDate(today.getDate() + i);
      const day = candidate.getDay();
      if (coachDays.has(day)) {
        return candidate.toISOString().split('T')[0];
      }
    }
    return today.toISOString().split('T')[0];
  });

  const [selectedShiftIndex, setSelectedShiftIndex] = useState<number>(0);
  const [type, setType] = useState<ShiftChangeType>('full_shift');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCreateChangeModalOpen) return null;

  // 1. Computar turnos asignados del coach en la fecha seleccionada
  const [year, month, day] = targetDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0: Dom, 1: Lun, ..., 6: Sáb
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[dayOfWeek];

  const weekdayShifts = shifts.filter(
    s => s.coach_id === currentCoach.id && s.day_of_week === dayOfWeek
  );

  const saturdayShiftList = (() => {
    if (dayOfWeek !== 6) return [];
    const monthlyGuards = getMonthlyGuards(year, month - 1, saturdayGuards);
    const myGuard = monthlyGuards.find(
      g => g.date === targetDate && g.coach_id === currentCoach.id
    );
    if (!myGuard) return [];
    return [
      {
        id: myGuard.id,
        day_of_week: 6,
        start_time: myGuard.start_time,
        end_time: myGuard.end_time,
        duration_hours: calculateDurationHours(myGuard.start_time, myGuard.end_time) || 3,
        franja: 'sabado' as Franja,
        coach_id: currentCoach.id,
        coach_name: currentCoach.name,
        is_double_coverage: false,
        notes: 'Guardia Rotativa de Sábado',
      },
    ];
  })();

  const coachShiftsOnDate = dayOfWeek === 6 ? saturdayShiftList : weekdayShifts;
  const activeShift = coachShiftsOnDate[selectedShiftIndex] || coachShiftsOnDate[0];

  // Actualizar horarios según el turno activo seleccionado
  useEffect(() => {
    if (activeShift) {
      if (type === 'full_shift') {
        setStartTime(activeShift.start_time);
        setEndTime(activeShift.end_time);
      } else if (type === 'single_hour') {
        setStartTime(activeShift.start_time);
        const [h] = activeShift.start_time.split(':').map(Number);
        const [maxH] = activeShift.end_time.split(':').map(Number);
        const nextH = Math.min(h + 1, maxH);
        setEndTime(`${String(nextH).padStart(2, '0')}:00`);
      } else {
        // multiple_hours
        setStartTime(activeShift.start_time);
        setEndTime(activeShift.end_time);
      }
      setErrorMessage(null);
    }
  }, [targetDate, selectedShiftIndex, type, activeShift?.id]);

  const shiftHours = activeShift
    ? getHoursBetween(activeShift.start_time, activeShift.end_time)
    : [];

  const startOptions = shiftHours.slice(0, -1);
  const endOptions = shiftHours.filter(h => h > startTime);

  const getNextHour = (start: string): string => {
    const [h] = start.split(':').map(Number);
    const [maxH] = (activeShift?.end_time || '21:00').split(':').map(Number);
    const nextH = Math.min(h + 1, maxH);
    return `${String(nextH).padStart(2, '0')}:00`;
  };

  const handleTypeChange = (newType: ShiftChangeType) => {
    setType(newType);
    setErrorMessage(null);

    if (!activeShift) return;

    if (newType === 'full_shift') {
      setStartTime(activeShift.start_time);
      setEndTime(activeShift.end_time);
    } else if (newType === 'single_hour') {
      setStartTime(activeShift.start_time);
      setEndTime(getNextHour(activeShift.start_time));
    }
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setErrorMessage(null);

    if (type === 'single_hour') {
      setEndTime(getNextHour(newStart));
    } else {
      if (endTime <= newStart) {
        setEndTime(getNextHour(newStart));
      }
    }
  };

  const currentDuration = calculateDurationHours(startTime, endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeShift) {
      setErrorMessage('No tenés ningún turno asignado en esta fecha para solicitar reemplazo.');
      return;
    }

    if (startTime < activeShift.start_time || endTime > activeShift.end_time) {
      setErrorMessage(
        `Solo podés pedir cubrimiento dentro de tu turno asignado (${activeShift.start_time} a ${activeShift.end_time} hs).`
      );
      return;
    }

    if (startTime >= endTime) {
      setErrorMessage('El horario "Hasta" debe ser estrictamente posterior al horario "Desde".');
      return;
    }

    createShiftChange({
      target_date: targetDate,
      day_name: dayName,
      start_time: startTime,
      end_time: endTime,
      type,
      franja: activeShift.franja,
      reason: reason.trim() || 'Motivo personal / Reemplazo',
    });

    setIsCreateChangeModalOpen(false);
    setReason('');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Pedir Reemplazo / Cambio</h3>
            <p className="text-xs text-malon-muted">
              Publicá tu turno en la bolsa de cambios de coaches
            </p>
          </div>
          <button
            onClick={() => setIsCreateChangeModalOpen(false)}
            className="text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Coach Activo */}
          <div className="bg-malon-bg/60 border border-malon-surface/80 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-malon-surface text-malon-sand font-bold text-[10px] flex items-center justify-center">
                {currentCoach.initials}
              </div>
              <span className="text-xs text-white font-semibold">
                Coach solicitante: <strong>{currentCoach.name}</strong>
              </span>
            </div>
            <span className="text-[10px] text-malon-muted font-medium uppercase tracking-wider">
              {currentCoach.role === 'admin' ? 'Jefe / Admin' : currentCoach.role === 'coach_admin' ? 'Coach Admin' : 'Coach'}
            </span>
          </div>

          {/* Selector de Fecha */}
          <div>
            <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Fecha del turno a ceder
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={e => {
                setTargetDate(e.target.value);
                setSelectedShiftIndex(0);
              }}
              className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
            />
            <span className="text-[11px] text-malon-muted block mt-1">
              Día seleccionado: <strong className="text-white">{dayName}</strong>
            </span>
          </div>

          {/* Caso 1: El coach no tiene turnos asignados en la fecha seleccionada */}
          {coachShiftsOnDate.length === 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Sin turno asignado este día</h4>
              <p className="text-xs text-malon-muted">
                {currentCoach.name}, no tenés ningún turno ni guardia asignada los días <strong>{dayName}</strong> ({targetDate.split('-').slice(1).reverse().join('/')}).
              </p>
              <p className="text-[11px] text-malon-sand font-medium pt-1 border-t border-amber-500/20">
                Solo podés solicitar reemplazo para tus horas asignadas en grilla. Elegí una fecha en la que tengas turno.
              </p>
            </div>
          ) : (
            /* Caso 2: El coach tiene turnos asignados en esta fecha */
            <>
              {/* Si tiene múltiples turnos en el día, permitir seleccionar cuál ceder */}
              {coachShiftsOnDate.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
                    Seleccioná cuál de tus turnos querés ceder
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {coachShiftsOnDate.map((s, idx) => (
                      <button
                        key={s.id || idx}
                        type="button"
                        onClick={() => setSelectedShiftIndex(idx)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          selectedShiftIndex === idx
                            ? 'bg-malon-surface border-malon-sand text-white font-bold shadow-sm'
                            : 'bg-malon-card/80 border-malon-surface text-malon-muted hover:text-white'
                        }`}
                      >
                        <span className="block text-[10px] uppercase text-malon-sand font-mono">
                          Turno {s.franja}
                        </span>
                        <span className="font-mono text-white text-xs block font-bold">
                          {s.start_time} a {s.end_time} hs
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarjeta de turno asignado activo */}
              {activeShift && (
                <div className="bg-malon-surface/50 border border-malon-sand/40 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-malon-muted uppercase tracking-wider font-semibold block">
                      Tu Horario Asignado
                    </span>
                    <span className="text-sm font-black text-white font-mono">
                      {activeShift.start_time} - {activeShift.end_time} hs
                    </span>
                    <span className="text-[10px] text-malon-sand block">
                      Turno {activeShift.franja} ({activeShift.duration_hours} hs)
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-malon-sand/20 text-malon-sand flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Tipo de cambio */}
              <div>
                <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
                  Modalidad de Cubrimiento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('full_shift')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      type === 'full_shift'
                        ? 'bg-malon-red/20 border-malon-red text-white'
                        : 'bg-malon-surface/50 border-malon-surface text-malon-muted hover:text-white'
                    }`}
                  >
                    Turno Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('single_hour')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      type === 'single_hour'
                        ? 'bg-malon-red/20 border-malon-red text-white'
                        : 'bg-malon-surface/50 border-malon-surface text-malon-muted hover:text-white'
                    }`}
                  >
                    1 Hora Suelta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('multiple_hours')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      type === 'multiple_hours'
                        ? 'bg-malon-red/20 border-malon-red text-white'
                        : 'bg-malon-surface/50 border-malon-surface text-malon-muted hover:text-white'
                    }`}
                  >
                    Horas Múltiples
                  </button>
                </div>
              </div>

              {/* Horario de inicio y fin acotado estrictamente al turno del coach */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider">
                    Horario a Cubrir (Acotado a tu turno)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-malon-sand flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    <span>{currentDuration} {currentDuration === 1 ? 'hora' : 'horas'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-malon-muted block mb-1">
                      Desde
                    </label>
                    {type === 'full_shift' ? (
                      <div className="w-full bg-malon-surface/40 border border-malon-surface/60 rounded-xl px-3 py-2.5 text-sm text-white/90 font-mono">
                        {startTime} hs
                      </div>
                    ) : (
                      <select
                        value={startTime}
                        onChange={e => handleStartTimeChange(e.target.value)}
                        className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
                      >
                        {startOptions.map(hour => (
                          <option key={hour} value={hour} className="bg-malon-card text-white">
                            {hour} hs
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-malon-muted block mb-1">
                      Hasta
                    </label>
                    {type === 'full_shift' ? (
                      <div className="w-full bg-malon-surface/40 border border-malon-surface/60 rounded-xl px-3 py-2.5 text-sm text-white/90 font-mono">
                        {endTime} hs
                      </div>
                    ) : type === 'single_hour' ? (
                      <div className="w-full bg-malon-surface/40 border border-malon-surface/60 rounded-xl px-3 py-2.5 text-sm text-white/90 font-mono flex items-center justify-between">
                        <span>{endTime} hs</span>
                        <span className="text-[10px] text-malon-sand font-bold uppercase">1h fija</span>
                      </div>
                    ) : (
                      <select
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
                      >
                        {endOptions.map(hour => (
                          <option key={hour} value={hour} className="bg-malon-card text-white">
                            {hour} hs
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-xs font-semibold text-malon-muted block mb-1">
                  Motivo o Detalle (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Turno médico, examen, compromiso..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white placeholder-malon-muted/50 focus:outline-none focus:border-malon-sand"
                />
              </div>

              {/* Botón publicar */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-malon-red hover:bg-malon-red-hover active:scale-98 text-white font-bold py-3 rounded-xl shadow-lg shadow-malon-red/20 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Publicar en Bolsa de Cambios</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
