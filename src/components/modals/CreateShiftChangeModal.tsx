import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { ShiftChangeType, Franja } from '../../types';
import { calculateDurationHours, getFranjaFromTime, groupHoursIntoRanges } from '../../lib/hoursAudit';
import {
  getCoachEffectiveShifts,
  getHolidayForDate,
  formatDateToIso,
} from '../../lib/effectiveShifts';

export const CreateShiftChangeModal: React.FC = () => {
  const {
    currentCoach,
    shifts,
    saturdayGuards,
    shiftChanges,
    holidays,
    isCreateChangeModalOpen,
    setIsCreateChangeModalOpen,
    preselectedChangeDate,
    setPreselectedChangeDate,
    createShiftChange,
  } = useApp();

  // Lista de próximos turnos asignados del coach (próximos 21 días)
  const upcomingShiftsList = useMemo(() => {
    const list: {
      dateStr: string;
      dayShort: string;
      dayName: string;
      dateDisplay: string;
      timeSummary: string;
      isHoliday: boolean;
      holidayName?: string;
    }[] = [];

    const now = new Date();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayShorts = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 21; i++) {
      const cur = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dStr = formatDateToIso(cur);
      const jsDow = cur.getDay();
      const dow = jsDow === 0 ? 7 : jsDow;

      const holiday = getHolidayForDate(dStr, holidays);
      if (holiday?.is_closed) continue;

      const eff = getCoachEffectiveShifts(
        currentCoach.id,
        dow,
        shifts,
        shiftChanges,
        dStr,
        saturdayGuards,
        holidays
      );

      // Turnos propios (no cubriendo a otros, ni ya reemplazados)
      const ownShifts = eff.filter(s => !s.is_covering && !s.is_replaced);

      if (ownShifts.length > 0) {
        list.push({
          dateStr: dStr,
          dayShort: dayShorts[jsDow],
          dayName: dayNames[jsDow],
          dateDisplay: `${cur.getDate()}/${cur.getMonth() + 1}`,
          timeSummary: ownShifts.map(s => `${s.start_time}-${s.end_time}`).join(', '),
          isHoliday: !!holiday,
          holidayName: holiday?.name,
        });
      }
    }

    return list;
  }, [currentCoach.id, shifts, shiftChanges, saturdayGuards, holidays]);

  const [targetDate, setTargetDate] = useState(() => {
    return formatDateToIso(new Date());
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

  const holidayOnDate = getHolidayForDate(targetDate, holidays);

  const coachShiftsOnDate = useMemo(() => {
    const dow = dayOfWeek === 0 ? 7 : dayOfWeek;
    const eff = getCoachEffectiveShifts(
      currentCoach.id,
      dow,
      shifts,
      shiftChanges,
      targetDate,
      saturdayGuards,
      holidays
    );
    // Filtrar turnos donde el coach no esté cubriendo a otro compañero ni ya esté reemplazado
    return eff.filter(s => !s.is_covering && !s.is_replaced);
  }, [currentCoach.id, dayOfWeek, shifts, shiftChanges, targetDate, saturdayGuards, holidays]);

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
      if (preselectedChangeDate) {
        setTargetDate(preselectedChangeDate);
      } else if (upcomingShiftsList.length > 0) {
        setTargetDate(upcomingShiftsList[0].dateStr);
      } else {
        setTargetDate(formatDateToIso(new Date()));
      }
      setSelectedShiftIndex(0);
      setReason('');
      setErrorMessage(null);
    }
  }, [isCreateChangeModalOpen, preselectedChangeDate, upcomingShiftsList]);

  const handlePrevDay = () => {
    const [y, m, d] = targetDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setTargetDate(formatDateToIso(prev));
    setSelectedShiftIndex(0);
  };

  const handleNextDay = () => {
    const [y, m, d] = targetDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setTargetDate(formatDateToIso(next));
    setSelectedShiftIndex(0);
  };

  // Opciones completas de turno: bloques unificados y tramos individuales
  const fullShiftOptions = useMemo(() => {
    if (coachShiftsOnDate.length === 0) return [];

    const options: {
      id: string;
      start_time: string;
      end_time: string;
      duration_hours: number;
      franja: Franja;
      label: string;
      sublabel: string;
      isUnifiedBlock: boolean;
    }[] = [];

    continuousBlocks.forEach((block, bIdx) => {
      const duration = calculateDurationHours(block.start_time, block.end_time);
      const franja = dayOfWeek === 6 ? ('sabado' as Franja) : getFranjaFromTime(block.start_time);

      const overlappingShifts = coachShiftsOnDate.filter(
        s => s.start_time >= block.start_time && s.end_time <= block.end_time
      );

      if (overlappingShifts.length > 1) {
        // Opción 1: Bloque unificado continuo completo (ej: 17:00 a 19:00 hs)
        options.push({
          id: `unified-${bIdx}-${block.start_time}-${block.end_time}`,
          start_time: block.start_time,
          end_time: block.end_time,
          duration_hours: duration,
          franja,
          label: `${block.time_display}`,
          sublabel: `Turno completo unificado (${duration} hs)`,
          isUnifiedBlock: true,
        });

        // Opciones secundarias: tramos individuales que componen el bloque
        overlappingShifts.forEach(s => {
          const shiftFranja = dayOfWeek === 6 ? ('sabado' as Franja) : getFranjaFromTime(s.start_time);
          options.push({
            id: s.id,
            start_time: s.start_time,
            end_time: s.end_time,
            duration_hours: s.duration_hours,
            franja: shiftFranja,
            label: `${s.start_time} a ${s.end_time} hs`,
            sublabel: `Turno ${shiftFranja} (${s.duration_hours} h)`,
            isUnifiedBlock: false,
          });
        });
      } else {
        const single = overlappingShifts[0];
        options.push({
          id: single?.id || `block-${bIdx}`,
          start_time: block.start_time,
          end_time: block.end_time,
          duration_hours: duration,
          franja,
          label: `${block.time_display}`,
          sublabel: `Turno ${franja} (${duration} hs)`,
          isUnifiedBlock: false,
        });
      }
    });

    return options;
  }, [coachShiftsOnDate, continuousBlocks, dayOfWeek]);

  const activeOption = fullShiftOptions[selectedShiftIndex] || fullShiftOptions[0];

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
        if (activeOption) {
          setStartTime(activeOption.start_time);
          setEndTime(activeOption.end_time);
        }
      } else if (type === 'single_hour') {
        const initialStart = coachAssignedHours.includes(startTime) ? startTime : coachAssignedHours[0];
        setStartTime(initialStart);
        const ends = getEndOptionsForStart(initialStart);
        setEndTime(ends[0] || `${String(Number(initialStart.split(':')[0]) + 1).padStart(2, '0')}:00`);
      } else {
        // multiple_hours
        if (activeOption && (!coachAssignedHours.includes(startTime) || startTime >= endTime)) {
          setStartTime(activeOption.start_time);
          setEndTime(activeOption.end_time);
        }
      }
      setErrorMessage(null);
    }
  }, [targetDate, selectedShiftIndex, activeOption?.id]);

  const handleTypeChange = (newType: ShiftChangeType) => {
    setType(newType);
    setErrorMessage(null);

    if (coachAssignedHours.length === 0) return;

    if (newType === 'full_shift') {
      if (activeOption) {
        setStartTime(activeOption.start_time);
        setEndTime(activeOption.end_time);
      }
    } else if (newType === 'single_hour') {
      const initialStart = coachAssignedHours[0];
      setStartTime(initialStart);
      const ends = getEndOptionsForStart(initialStart);
      setEndTime(ends[0] || initialStart);
    } else {
      // multiple_hours: inicializar con el bloque continuo del turno activo o el primer bloque
      const firstBlock = continuousBlocks.find(b => b.hours.includes(activeOption?.start_time)) || continuousBlocks[0];
      if (firstBlock) {
        setStartTime(firstBlock.start_time);
        setEndTime(firstBlock.end_time);
      } else if (activeOption) {
        setStartTime(activeOption.start_time);
        setEndTime(activeOption.end_time);
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

    const finalType: ShiftChangeType =
      type === 'full_shift'
        ? 'full_shift'
        : type === 'single_hour'
        ? 'single_hour'
        : 'multiple_hours';

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
    setPreselectedChangeDate(null);
    setReason('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    setIsCreateChangeModalOpen(false);
    setPreselectedChangeDate(null);
  };

  if (!isCreateChangeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
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
            onClick={handleClose}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider">
                Fecha del turno a ceder
              </label>
              <span className="text-[11px] text-malon-muted">
                Día: <strong className="text-white">{dayName}</strong>
              </span>
            </div>

            {/* Steppers y selector de fecha nativo accesible en móvil */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-2.5 rounded-xl bg-malon-surface/80 hover:bg-malon-surface border border-malon-surface text-malon-muted hover:text-white transition-all active:scale-95 flex items-center justify-center"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                required
                value={targetDate}
                style={{ colorScheme: 'dark' }}
                onChange={e => {
                  setTargetDate(e.target.value);
                  setSelectedShiftIndex(0);
                }}
                className="flex-1 bg-malon-surface/80 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand font-mono text-center"
              />

              <button
                type="button"
                onClick={handleNextDay}
                className="p-2.5 rounded-xl bg-malon-surface/80 hover:bg-malon-surface border border-malon-surface text-malon-muted hover:text-white transition-all active:scale-95 flex items-center justify-center"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Acceso rápido táctil: Próximos turnos asignados del coach */}
            {upcomingShiftsList.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-malon-muted block mb-1 font-medium">
                  Tus próximos turnos (tocá para seleccionar la fecha):
                </span>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {upcomingShiftsList.map(item => (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => {
                        setTargetDate(item.dateStr);
                        setSelectedShiftIndex(0);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center space-x-1 flex-shrink-0 ${
                        targetDate === item.dateStr
                          ? 'bg-malon-sand text-black border-malon-sand shadow-sm font-black'
                          : 'bg-malon-surface/80 text-white border-malon-surface hover:border-malon-sand/40'
                      }`}
                    >
                      <span>{item.dayShort} {item.dateDisplay}</span>
                      <span className={`text-[10px] px-1 rounded ${
                        targetDate === item.dateStr ? 'bg-black/20 text-black' : 'bg-malon-card text-malon-sand'
                      }`}>
                        {item.timeSummary}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {holidayOnDate && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Jornada de Feriado: <strong>{holidayOnDate.name}</strong></span>
                </span>
                <span className="text-[10px] font-mono text-malon-sand font-bold">
                  {holidayOnDate.time_display}
                </span>
              </div>
            )}
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
                Solo podés solicitar reemplazo para tus horas asignadas en grilla. Elegí una fecha en la que tengas turno arriba.
              </p>
            </div>
          ) : (
            /* Caso 2: El coach tiene turnos asignados en esta fecha */
            <>
              {/* Si tiene 'full_shift' y múltiples opciones de turnos en el día, permitir seleccionar cuál ceder */}
              {type === 'full_shift' && fullShiftOptions.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
                    Seleccioná qué turno querés ceder
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {fullShiftOptions.map((opt, idx) => (
                      <button
                        key={opt.id || idx}
                        type="button"
                        onClick={() => {
                          setSelectedShiftIndex(idx);
                          setStartTime(opt.start_time);
                          setEndTime(opt.end_time);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          selectedShiftIndex === idx
                            ? 'bg-malon-surface border-malon-sand text-white font-bold shadow-sm'
                            : 'bg-malon-card/80 border-malon-surface text-malon-muted hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="block text-[10px] uppercase text-malon-sand font-mono">
                            Turno {opt.franja}
                          </span>
                          {opt.isUnifiedBlock && (
                            <span className="text-[9px] bg-malon-red/20 text-malon-red border border-malon-red/30 px-1.5 py-0.2 rounded font-black uppercase">
                              Completo
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-white text-xs block font-bold mt-0.5">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-malon-muted block">
                          {opt.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarjeta informativa según modalidad */}
              {type === 'full_shift' && activeOption && (
                <div className="bg-malon-surface/50 border border-malon-sand/40 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-malon-muted uppercase tracking-wider font-semibold block">
                      Turno Asignado a Ceder
                    </span>
                    <span className="text-sm font-black text-white font-mono">
                      {activeOption.start_time} - {activeOption.end_time} hs
                    </span>
                    <span className="text-[10px] text-malon-sand block">
                      {activeOption.sublabel}
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
