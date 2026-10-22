import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  Users,
  Check,
  AlertCircle,
  Trash2,
  Save,
} from 'lucide-react';
import type { HolidaySlot } from '../../types';
import { groupHoursIntoRanges, formatSelectedHoursDisplay } from '../../lib/hoursAudit';

// Intervalos de horas operativas de Malón (1 hora cada uno, de 07:00 a 21:00)
const HOURLY_SLOTS = [
  { id: '07:00', label: '07:00 a 08:00', hour: 7 },
  { id: '08:00', label: '08:00 a 09:00', hour: 8 },
  { id: '09:00', label: '09:00 a 10:00', hour: 9 },
  { id: '10:00', label: '10:00 a 11:00', hour: 10 },
  { id: '11:00', label: '11:00 a 12:00', hour: 11 },
  { id: '12:00', label: '12:00 a 13:00', hour: 12 },
  { id: '13:00', label: '13:00 a 14:00', hour: 13 },
  { id: '14:00', label: '14:00 a 15:00', hour: 14 },
  { id: '15:00', label: '15:00 a 16:00', hour: 15 },
  { id: '16:00', label: '16:00 a 17:00', hour: 16 },
  { id: '17:00', label: '17:00 a 18:00', hour: 17 },
  { id: '18:00', label: '18:00 a 19:00', hour: 18 },
  { id: '19:00', label: '19:00 a 20:00', hour: 19 },
  { id: '20:00', label: '20:00 a 21:00', hour: 20 },
];

export const ManageHolidayModal: React.FC = () => {
  const {
    isHolidayModalOpen,
    setIsHolidayModalOpen,
    editingHoliday,
    setEditingHoliday,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    staff,
  } = useApp();

  const [date, setDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [selectedHours, setSelectedHours] = useState<string[]>(['09:00', '10:00', '11:00', '12:00']);
  const [slotCoaches, setSlotCoaches] = useState<Record<string, { coachId1: string; coachId2: string }>>({});
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Rangos continuos calculados a partir de las horas tildadas
  const activeRanges = useMemo(() => {
    return groupHoursIntoRanges(selectedHours);
  }, [selectedHours]);

  useEffect(() => {
    if (editingHoliday) {
      setDate(editingHoliday.date);
      setName(editingHoliday.name);
      setIsClosed(editingHoliday.is_closed);
      const hours = editingHoliday.selected_hours || [];
      setSelectedHours(hours);
      setNotes(editingHoliday.notes || '');

      const ranges = groupHoursIntoRanges(hours);
      const initialMap: Record<string, { coachId1: string; coachId2: string }> = {};

      if (editingHoliday.slots && editingHoliday.slots.length > 0) {
        editingHoliday.slots.forEach(s => {
          initialMap[s.start_time] = {
            coachId1: s.coach_id_1,
            coachId2: s.coach_id_2,
          };
        });
      } else {
        ranges.forEach(r => {
          initialMap[r.start_time] = {
            coachId1: editingHoliday.coach_id_1 || staff[0]?.id || '',
            coachId2: editingHoliday.coach_id_2 || staff[1]?.id || '',
          };
        });
      }
      setSlotCoaches(initialMap);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setName('');
      setIsClosed(false);
      const defaultHours = ['09:00', '10:00', '11:00', '12:00'];
      setSelectedHours(defaultHours);
      setNotes('Jornada especial feriado - Doble cobertura');

      const ranges = groupHoursIntoRanges(defaultHours);
      const initialMap: Record<string, { coachId1: string; coachId2: string }> = {};
      ranges.forEach(r => {
        initialMap[r.start_time] = {
          coachId1: staff[0]?.id || '',
          coachId2: staff[1]?.id || '',
        };
      });
      setSlotCoaches(initialMap);
    }
    setError('');
  }, [editingHoliday, isHolidayModalOpen, staff]);

  // Manejo de checkboxes de horarios
  const toggleHour = (hourId: string) => {
    setSelectedHours(prev => {
      const next = prev.includes(hourId)
        ? prev.filter(h => h !== hourId)
        : [...prev, hourId].sort();

      // Asegurar que los nuevos rangos tengan dupla inicializada
      const newRanges = groupHoursIntoRanges(next);
      setSlotCoaches(currentCoaches => {
        const updated = { ...currentCoaches };
        newRanges.forEach(r => {
          if (!updated[r.start_time]) {
            updated[r.start_time] = {
              coachId1: staff[0]?.id || '',
              coachId2: staff[1]?.id || '',
            };
          }
        });
        return updated;
      });

      return next;
    });
  };

  const setPresetHours = (preset: 'manana' | 'tarde' | 'todo' | 'ninguno') => {
    let nextHours: string[] = [];
    switch (preset) {
      case 'manana':
        nextHours = ['09:00', '10:00', '11:00', '12:00'];
        break;
      case 'tarde':
        nextHours = ['16:00', '17:00', '18:00', '19:00'];
        break;
      case 'todo':
        nextHours = HOURLY_SLOTS.map(s => s.id);
        break;
      case 'ninguno':
        nextHours = [];
        break;
    }
    setSelectedHours(nextHours);

    const newRanges = groupHoursIntoRanges(nextHours);
    setSlotCoaches(currentCoaches => {
      const updated = { ...currentCoaches };
      newRanges.forEach(r => {
        if (!updated[r.start_time]) {
          updated[r.start_time] = {
            coachId1: staff[0]?.id || '',
            coachId2: staff[1]?.id || '',
          };
        }
      });
      return updated;
    });
  };

  const handleSlotCoachChange = (
    startTime: string,
    field: 'coachId1' | 'coachId2',
    value: string
  ) => {
    setSlotCoaches(prev => ({
      ...prev,
      [startTime]: {
        coachId1: field === 'coachId1' ? value : (prev[startTime]?.coachId1 || staff[0]?.id || ''),
        coachId2: field === 'coachId2' ? value : (prev[startTime]?.coachId2 || staff[1]?.id || ''),
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date) {
      setError('Por favor seleccioná la fecha del feriado');
      return;
    }
    if (!name.trim()) {
      setError('Por favor ingresá el nombre o motivo del feriado (ej: Día de la Independencia)');
      return;
    }

    if (!isClosed) {
      if (selectedHours.length === 0) {
        setError('Debes tildar al menos un horario en el que se trabajará, o marcar que permanece cerrado.');
        return;
      }

      for (let i = 0; i < activeRanges.length; i++) {
        const r = activeRanges[i];
        const sc = slotCoaches[r.start_time];
        if (!sc?.coachId1 || !sc?.coachId2) {
          setError(`En el turno de ${r.time_display} debes seleccionar los 2 coaches para la doble cobertura.`);
          return;
        }
        if (sc.coachId1 === sc.coachId2) {
          setError(`En el turno de ${r.time_display} los 2 coaches deben ser personas distintas.`);
          return;
        }
      }
    }

    const timeDisplay = isClosed
      ? 'Cerrado todo el día'
      : formatSelectedHoursDisplay(selectedHours);

    const holidaySlots: HolidaySlot[] = isClosed
      ? []
      : activeRanges.map((r, idx) => {
          const sc = slotCoaches[r.start_time] || {
            coachId1: staff[0]?.id || '',
            coachId2: staff[1]?.id || '',
          };
          const c1 = staff.find(s => s.id === sc.coachId1);
          const c2 = staff.find(s => s.id === sc.coachId2);
          return {
            id: `slot-${idx}-${r.start_time}`,
            start_time: r.start_time,
            end_time: r.end_time,
            duration_hours: r.duration_hours,
            hours: r.hours,
            time_display: r.time_display,
            coach_id_1: sc.coachId1,
            coach_name_1: c1?.name || '',
            coach_id_2: sc.coachId2,
            coach_name_2: c2?.name || '',
          };
        });

    const holidayPayload = {
      date,
      name: name.trim(),
      is_closed: isClosed,
      selected_hours: isClosed ? [] : selectedHours.sort(),
      time_display: timeDisplay,
      total_hours: isClosed ? 0 : selectedHours.length,
      coach_id_1: holidaySlots[0]?.coach_id_1 || '',
      coach_name_1: holidaySlots[0]?.coach_name_1 || '',
      coach_id_2: holidaySlots[0]?.coach_id_2 || '',
      coach_name_2: holidaySlots[0]?.coach_name_2 || '',
      slots: holidaySlots,
      notes: notes.trim(),
    };

    if (editingHoliday) {
      updateHoliday({
        ...holidayPayload,
        id: editingHoliday.id,
      });
    } else {
      addHoliday(holidayPayload);
    }

    setIsHolidayModalOpen(false);
    setEditingHoliday(null);
  };

  const handleDelete = () => {
    if (!editingHoliday) return;
    if (window.confirm(`¿Seguro que deseas eliminar el feriado "${editingHoliday.name}"?`)) {
      deleteHoliday(editingHoliday.id);
      setIsHolidayModalOpen(false);
      setEditingHoliday(null);
    }
  };

  if (!isHolidayModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-malon-sand/20 border border-malon-sand/40 flex items-center justify-center text-malon-sand shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {editingHoliday ? 'Editar Feriado / Jornada Especial' : 'Nuevo Feriado o Jornada Especial'}
                </h3>
                <span className="bg-malon-red text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-malon-muted">
                Configuración de horarios y duplas en sala
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsHolidayModalOpen(false);
              setEditingHoliday(null);
            }}
            className="text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fecha y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-malon-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
                Fecha del Feriado *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-white text-xs outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-malon-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
                Nombre del Feriado *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Día de la Memoria / 25 de Mayo"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Estado de Apertura */}
          <div className="bg-malon-bg/60 border border-malon-surface rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">
                ¿El gimnasio abre en este feriado?
              </span>
              <span className="text-[11px] text-malon-muted block">
                {isClosed ? 'Cerrado todo el día (sin turnos de sala)' : 'Abierto en horarios especiales'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsClosed(!isClosed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isClosed
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {isClosed ? '⛔ Cerrado' : '✅ Abierto'}
            </button>
          </div>

          {/* Selección interactiva de horarios (solo si está abierto) */}
          {!isClosed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-malon-sand font-bold uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Horarios a Trabajar (Tildá los necesarios)</span>
                  </label>
                  <p className="text-[10px] text-malon-muted">
                    Podés seleccionar turnos continuos o no consecutivos (ej: mañana, mediodía y tarde)
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-white bg-malon-surface px-2 py-0.5 rounded-md">
                  {selectedHours.length} hs seleccionadas
                </span>
              </div>

              {/* Botones de selección rápida (Presets) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-malon-muted">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPresetHours('manana')}
                  className="px-2 py-1 rounded-md bg-malon-surface hover:bg-malon-surface/80 text-[10px] text-malon-sand font-semibold transition"
                >
                  Mañana (09-13)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetHours('tarde')}
                  className="px-2 py-1 rounded-md bg-malon-surface hover:bg-malon-surface/80 text-[10px] text-malon-sand font-semibold transition"
                >
                  Tarde (16-20)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetHours('todo')}
                  className="px-2 py-1 rounded-md bg-malon-surface hover:bg-malon-surface/80 text-[10px] text-white font-semibold transition"
                >
                  Todo el día
                </button>
                <button
                  type="button"
                  onClick={() => setPresetHours('ninguno')}
                  className="px-2 py-1 rounded-md bg-malon-surface hover:bg-malon-surface/80 text-[10px] text-malon-muted hover:text-white transition"
                >
                  Desmarcar
                </button>
              </div>

              {/* Grilla de checkboxes de horas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-malon-bg/60 rounded-xl border border-malon-surface/80">
                {HOURLY_SLOTS.map(slot => {
                  const isChecked = selectedHours.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleHour(slot.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-malon-sand/20 border-malon-sand text-white font-bold shadow-sm'
                          : 'bg-malon-card hover:bg-malon-surface border-malon-surface text-malon-muted'
                      }`}
                    >
                      <span className="font-mono text-xs">{slot.label}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-malon-sand text-black' : 'border border-malon-muted/40'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Resumen legible */}
              <div className="p-2.5 rounded-xl bg-malon-surface/60 border border-malon-surface flex items-center justify-between text-[11px]">
                <span className="text-malon-muted">Resumen:</span>
                <span className="font-mono font-bold text-white">
                  {formatSelectedHoursDisplay(selectedHours)}
                </span>
              </div>
            </div>
          )}

          {/* Asignación de Coaches - DOBLE COBERTURA POR DUPLA DE CADA TURNO */}
          {!isClosed && activeRanges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-malon-sand text-black flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      {activeRanges.length > 1
                        ? `Duplas por Turno (${activeRanges.length} turnos no consecutivos)`
                        : 'Doble Cobertura Feriado'}
                    </h4>
                    <p className="text-[10px] text-malon-sand">
                      {activeRanges.length > 1
                        ? 'Podés asignar duplas de coaches distintas para cada franja de horario'
                        : 'Los feriados operan estrictamente en dupla (2 coaches en sala)'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 font-mono">
                  {selectedHours.length} hs totales
                </span>
              </div>

              {/* Lista de duplas por cada turno/rango continuo */}
              <div className="space-y-2.5">
                {activeRanges.map((range, index) => {
                  const currentSlotCoaches = slotCoaches[range.start_time] || {
                    coachId1: staff[0]?.id || '',
                    coachId2: staff[1]?.id || '',
                  };

                  return (
                    <div
                      key={range.start_time}
                      className="bg-gradient-to-r from-malon-sand/10 to-transparent border border-malon-sand/40 rounded-2xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-malon-surface/60">
                        <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-malon-sand" />
                          <span>
                            Turno {activeRanges.length > 1 ? index + 1 : ''}: <strong className="text-malon-sand">{range.time_display}</strong>
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-malon-muted">
                          {range.duration_hours} {range.duration_hours === 1 ? 'hora' : 'horas'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-malon-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
                            Coach 1 (Titular Dupla) *
                          </label>
                          <select
                            value={currentSlotCoaches.coachId1}
                            onChange={e =>
                              handleSlotCoachChange(range.start_time, 'coachId1', e.target.value)
                            }
                            required={!isClosed}
                            className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-2.5 py-2 text-white text-xs outline-none font-bold"
                          >
                            <option value="" disabled>Seleccionar Coach 1</option>
                            {staff.map(c => (
                              <option
                                key={c.id}
                                value={c.id}
                                disabled={c.id === currentSlotCoaches.coachId2}
                              >
                                {c.name} ({c.initials})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-malon-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
                            Coach 2 (Acompañante Dupla) *
                          </label>
                          <select
                            value={currentSlotCoaches.coachId2}
                            onChange={e =>
                              handleSlotCoachChange(range.start_time, 'coachId2', e.target.value)
                            }
                            required={!isClosed}
                            className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-2.5 py-2 text-white text-xs outline-none font-bold"
                          >
                            <option value="" disabled>Seleccionar Coach 2</option>
                            {staff.map(c => (
                              <option
                                key={c.id}
                                value={c.id}
                                disabled={c.id === currentSlotCoaches.coachId1}
                              >
                                {c.name} ({c.initials})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-malon-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
              Notas / Observaciones (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Clases combinadas cada 1 hora / Open box habilitado"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2.5 text-white text-xs outline-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-between space-x-2">
            {editingHoliday ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsHolidayModalOpen(false);
                  setEditingHoliday(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-malon-surface hover:bg-malon-surface/80 text-malon-muted hover:text-white font-bold transition-all"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-malon-sand hover:bg-malon-sand-hover text-black font-black transition-all flex items-center space-x-1.5 shadow-lg shadow-malon-sand/20"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Feriado</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
