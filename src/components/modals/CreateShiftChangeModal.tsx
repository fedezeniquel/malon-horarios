import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Clock, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import type { ShiftChangeType, Franja } from '../../types';
import { calculateDurationHours, getFranjaFromTime, groupHoursIntoRanges } from '../../lib/hoursAudit';
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

  // Todas las horas individuales asignadas al coach en esta fecha
  const coachAssignedHours = useMemo(() => {
    const hoursSet = new Set<string>();
    coachShiftsOnDate.forEach(s => {
      const [startH] = s.start_time.split(':').map(Number);
      const [endH] = s.end_time.split(':').map(Number);
      for (let h = startH; h < endH; h++) {
        hoursSet.add(`${String(h).padStart(2, '0')}:00`);
      }
    });
    return Array.from(hoursSet).sort();
  }, [coachShiftsOnDate]);

  // Bloques continuos de trabajo del coach en la fecha
  const continuousBlocks = useMemo(() => {
    return groupHoursIntoRanges(coachAssignedHours);
  }, [coachAssignedHours]);

  // Sincronizar fecha válida y limpiar estados al abrir el modal
  useEffect(() => {
    if (isCreateChangeModalOpen) {
      const coachDays = new Set(
        shifts.filter(s => s.coach_id === currentCoach.id).map(s => s.day_of_week)
      );
      const today = new Date();
      let foundDate = today.toISOString().split('T')[0];
      for (let i = 0; i < 7; i++) {
        const candidate = new Date();
        candidate.setDate(today.getDate() + i);
        if (coachDays.has(candidate.getDay())) {
          foundDate = candidate.toISOString().split('T')[0];
          break;
        }
      }
      setTargetDate(foundDate);
      setSelectedShiftIndex(0);
      setReason('');
      setErrorMessage(null);
    }
  }, [isCreateChangeModalOpen, currentCoach.id]);

  const activeShift = coachShiftsOnDate[selectedShiftIndex] || coachShiftsOnDate[0];

  // Helper para calcular opciones de 'Hasta' consecutivas a partir de 'Desde'
  const getEndOptionsForStart = (start: string): string[] => {
    const [startH] = start.split(':').map(Number);
    const options: string[] = [];
    let currentH = startH;
    while (coachAssignedHours.includes(`${String(currentH).padStart(2, '0')}:00`)) {
      currentH++;
      options.push(`${String(currentH).padStart(2, '0')}:00`);
    }
    return options;
  };

  // Opciones válidas de 'Desde'
  const startOptions = useMemo(() => {
    if (type === 'single_hour') {
      return coachAssignedHours;
    }
    // Para horas múltiples: cualquier hora que tenga al menos 1 hora siguiente consecutiva asignada
    return coachAssignedHours.filter(h => {
      const [hNum] = h.split(':').map(Number);
      const nextHourStr = `${String(hNum + 1).padStart(2, '0')}:00`;
      return coachAssignedHours.includes(nextHourStr);
    });
  }, [coachAssignedHours, type]);

  // Opciones válidas de 'Hasta' según el 'Desde' actual
  const endOptions = useMemo(() => {
    return getEndOptionsForStart(startTime);
  }, [startTime, coachAssignedHours]);

  // Sincronizar horarios al cambiar fecha o turno activo
  useEffect(() => {
    if (coachShiftsOnDate.length > 0 && coachAssignedHours.length > 0) {
      if (type === 'full_shift') {
        if (activeShift) {
          setStartTime(activeShift.start_time);
          setEndTime(activeShift.end_time);
        }
      } else if (type === 'single_hour') {
        const initialStart = coachAssignedHours.includes(startTime) ? startTime : coachAssignedHours[0];
        setStartTime(initialStart);
        const ends = getEndOptionsForStart(initialStart);
        setEndTime(ends[0] || `${String(Number(initialStart.split(':')[0]) + 1).padStart(2, '0')}:00`);
      } else {
        // multiple_hours
        if (activeShift && (!coachAssignedHours.includes(startTime) || startTime >= endTime)) {
          setStartTime(activeShift.start_time);
          setEndTime(activeShift.end_time);
        }
      }
      setErrorMessage(null);
    }
  }, [targetDate, selectedShiftIndex, activeShift?.id]);

  const handleTypeChange = (newType: ShiftChangeType) => {
    setType(newType);
    setErrorMessage(null);

    if (coachAssignedHours.length === 0) return;

    if (newType === 'full_shift') {
      if (activeShift) {
        setStartTime(activeShift.start_time);
        setEndTime(activeShift.end_time);
      }
    } else if (newType === 'single_hour') {
      const initialStart = coachAssignedHours[0];
      setStartTime(initialStart);
      const ends = getEndOptionsForStart(initialStart);
      setEndTime(ends[0] || initialStart);
    } else {
      // multiple_hours: inicializar con el bloque continuo del turno activo o el primer bloque
      const firstBlock = continuousBlocks.find(b => b.hours.includes(activeShift?.start_time)) || continuousBlocks[0];
      if (firstBlock) {
        setStartTime(firstBlock.start_time);
        setEndTime(firstBlock.end_time);
      } else if (activeShift) {
        setStartTime(activeShift.start_time);
        setEndTime(activeShift.end_time);
      }
    }
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setErrorMessage(null);

    const availableEnds = getEndOptionsForStart(newStart);
    if (type === 'single_hour') {
      setEndTime(availableEnds[0] || newStart);
    } else {
      // multiple_hours: si el endTime actual ya no es válido o es <= newStart
      if (!availableEnds.includes(endTime) || endTime <= newStart) {
        setEndTime(availableEnds[availableEnds.length - 1] || availableEnds[0] || newStart);
      }
    }
  };

  const currentDuration = calculateDurationHours(startTime, endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (coachShiftsOnDate.length === 0 || coachAssignedHours.length === 0) {
      setErrorMessage('No tenés ningún turno ni horas asignadas en esta fecha para solicitar reemplazo.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMessage('El horario "Hasta" debe ser estrictamente posterior al horario "Desde".');
      return;
    }

    // Verificar que todas las horas del rango correspondan a horas que el coach trabaja de corrido
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    const requestedHours: string[] = [];
    for (let h = startH; h < endH; h++) {
      requestedHours.push(`${String(h).padStart(2, '0')}:00`);
    }

    const allHoursAssigned = requestedHours.every(h => coachAssignedHours.includes(h));
    if (!allHoursAssigned) {
      setErrorMessage(
        'Solo podés pedir reemplazo para un bloque de horas que tengas efectivamente asignadas de forma continua.'
      );
      return;
    }

    const chosenFranja = dayOfWeek === 6
      ? ('sabado' as Franja)
      : getFranjaFromTime(startTime);

    const calculatedDuration = calculateDurationHours(startTime, endTime);
    const finalType: ShiftChangeType =
      calculatedDuration === 1
        ? 'single_hour'
        : (type === 'single_hour' ? 'multiple_hours' : type);

    createShiftChange({
      target_date: targetDate,
      day_name: dayName,
      start_time: startTime,
      end_time: endTime,
      type: finalType,
      franja: chosenFranja,
      reason: reason.trim() || 'Motivo personal / Reemplazo',
    });

    setIsCreateChangeModalOpen(false);
    setReason('');
    setErrorMessage(null);
  };

  if (!isCreateChangeModalOpen) return null;

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
              {/* Si tiene 'full_shift' y múltiples turnos en el día, permitir seleccionar cuál ceder */}
              {type === 'full_shift' && coachShiftsOnDate.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
                    Seleccioná cuál de tus turnos querés ceder
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {coachShiftsOnDate.map((s, idx) => (
                      <button
                        key={s.id || idx}
                        type="button"
                        onClick={() => {
                          setSelectedShiftIndex(idx);
                          setStartTime(s.start_time);
                          setEndTime(s.end_time);
                        }}
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

              {/* Tarjeta informativa según modalidad */}
              {type === 'full_shift' && activeShift && (
                <div className="bg-malon-surface/50 border border-malon-sand/40 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-malon-muted uppercase tracking-wider font-semibold block">
                      Turno Asignado a Ceder
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

              {type !== 'full_shift' && (
                <div className="bg-malon-surface/50 border border-malon-sand/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-malon-muted uppercase tracking-wider font-semibold block">
                      Tus Horarios Asignados Este Día
                    </span>
                    <span className="text-[10px] text-malon-sand font-mono font-bold">
                      Total: {coachAssignedHours.length} hs
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {continuousBlocks.map((block, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-malon-card border border-malon-surface text-white"
                      >
                        {block.time_display}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-malon-muted mt-2">
                    Podés seleccionar cualquier rango dentro de tus horarios de corrido (incluso cruzando turnos contiguos, ej: 18:00 a 20:00 hs).
                  </p>
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
                    Horario a Cubrir (Acotado a tus turnos)
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
