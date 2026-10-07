import React, { useState, useEffect } from 'react';
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

/**
 * Convierte un array de horas seleccionadas (ej: ['09:00', '10:00', '11:00', '12:00'])
 * en un resumen legible de texto continuo (ej: "09:00 a 13:00 hs")
 */
export const formatSelectedHoursDisplay = (selected: string[]): string => {
  if (selected.length === 0) return 'Sin horarios seleccionados';

  const sortedHours = [...selected].sort().map(s => parseInt(s.split(':')[0], 10));
  const ranges: { start: number; end: number }[] = [];

  let rangeStart = sortedHours[0];
  let prevHour = sortedHours[0];

  for (let i = 1; i < sortedHours.length; i++) {
    const curHour = sortedHours[i];
    if (curHour === prevHour + 1) {
      prevHour = curHour;
    } else {
      ranges.push({ start: rangeStart, end: prevHour + 1 });
      rangeStart = curHour;
      prevHour = curHour;
    }
  }
  ranges.push({ start: rangeStart, end: prevHour + 1 });

  return ranges
    .map(r => `${String(r.start).padStart(2, '0')}:00 a ${String(r.end).padStart(2, '0')}:00`)
    .join(' y ') + ' hs';
};

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
  const [coachId1, setCoachId1] = useState<string>('');
  const [coachId2, setCoachId2] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingHoliday) {
      setDate(editingHoliday.date);
      setName(editingHoliday.name);
      setIsClosed(editingHoliday.is_closed);
      setSelectedHours(editingHoliday.selected_hours || []);
      setCoachId1(editingHoliday.coach_id_1 || '');
      setCoachId2(editingHoliday.coach_id_2 || '');
      setNotes(editingHoliday.notes || '');
    } else {
      // Valor por defecto: hoy o próximo feriado típico
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setName('');
      setIsClosed(false);
      setSelectedHours(['09:00', '10:00', '11:00', '12:00']);
      setCoachId1(staff[0]?.id || '');
      setCoachId2(staff[1]?.id || '');
      setNotes('Jornada especial feriado - Doble cobertura');
    }
    setError('');
  }, [editingHoliday, isHolidayModalOpen, staff]);

  // Manejo de checkboxes de horarios
  const toggleHour = (hourId: string) => {
    setSelectedHours(prev =>
      prev.includes(hourId) ? prev.filter(h => h !== hourId) : [...prev, hourId].sort()
    );
  };

  const setPresetHours = (preset: 'manana' | 'tarde' | 'todo' | 'ninguno') => {
    switch (preset) {
      case 'manana':
        setSelectedHours(['09:00', '10:00', '11:00', '12:00']);
        break;
      case 'tarde':
        setSelectedHours(['16:00', '17:00', '18:00', '19:00']);
        break;
      case 'todo':
        setSelectedHours(HOURLY_SLOTS.map(s => s.id));
        break;
      case 'ninguno':
        setSelectedHours([]);
        break;
    }
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
      if (!coachId1 || !coachId2) {
        setError('En los feriados la modalidad siempre es de doble cobertura. Seleccioná los 2 coaches.');
        return;
      }
      if (coachId1 === coachId2) {
        setError('Los 2 coaches deben ser personas distintas para cumplir la doble cobertura.');
        return;
      }
    }

    const coach1 = staff.find(s => s.id === coachId1);
    const coach2 = staff.find(s => s.id === coachId2);

    const timeDisplay = isClosed
      ? 'Cerrado todo el día'
      : formatSelectedHoursDisplay(selectedHours);

    const holidayPayload = {
      date,
      name: name.trim(),
      is_closed: isClosed,
      selected_hours: isClosed ? [] : selectedHours.sort(),
      time_display: timeDisplay,
      total_hours: isClosed ? 0 : selectedHours.length,
      coach_id_1: isClosed ? '' : (coach1?.id || ''),
      coach_name_1: isClosed ? '' : (coach1?.name || ''),
      coach_id_2: isClosed ? '' : (coach2?.id || ''),
      coach_name_2: isClosed ? '' : (coach2?.name || ''),
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
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
                Configuración de horarios trabajados y asignación de doble cobertura
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
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fecha y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-malon-muted font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Fecha del Feriado *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2.5 text-white font-mono text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-malon-muted font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Motivo / Nombre *
              </label>
              <input
                type="text"
                placeholder="Ej: Día de la Diversidad Cultural"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2.5 text-white text-xs outline-none placeholder:text-malon-muted/50"
              />
            </div>
          </div>

          {/* Modalidad de Apertura */}
          <div className="bg-malon-surface/40 border border-malon-surface rounded-2xl p-3 space-y-2">
            <span className="block text-malon-sand font-bold uppercase tracking-wider text-[10px]">
              Modalidad de Atención
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsClosed(false)}
                className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  !isClosed
                    ? 'bg-malon-sand text-black border-malon-sand shadow-sm'
                    : 'bg-malon-bg text-malon-muted border-malon-surface hover:text-white'
                }`}
              >
                <span>🟢 Horario Especial</span>
              </button>
              <button
                type="button"
                onClick={() => setIsClosed(true)}
                className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  isClosed
                    ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm'
                    : 'bg-malon-bg text-malon-muted border-malon-surface hover:text-white'
                }`}
              >
                <span>🔴 Cerrado Todo el Día</span>
              </button>
            </div>
          </div>

          {/* Selector de Horarios (Tildar los horarios trabajados) */}
          {!isClosed && (
            <div className="bg-malon-bg/80 border border-malon-surface rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-malon-sand" />
                    <span>Tildar Horarios que se Trabajan</span>
                  </h4>
                  <p className="text-[11px] text-malon-muted mt-0.5">
                    Marcá cada bloque horario individual que estará abierto
                  </p>
                </div>
                <span className="font-mono text-malon-sand font-bold bg-malon-surface px-2 py-0.5 rounded-lg border border-malon-sand/30">
                  {selectedHours.length} hs seleccionadas
                </span>
              </div>

              {/* Botones de selección rápida */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPresetHours('manana')}
                  className="px-2 py-1 rounded-lg bg-malon-surface hover:bg-malon-surface/80 border border-malon-surface text-amber-400 font-semibold whitespace-nowrap"
                >
                  Mañana (09-13)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetHours('tarde')}
                  className="px-2 py-1 rounded-lg bg-malon-surface hover:bg-malon-surface/80 border border-malon-surface text-orange-400 font-semibold whitespace-nowrap"
                >
                  Tarde (16-20)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetHours('todo')}
                  className="px-2 py-1 rounded-lg bg-malon-surface hover:bg-malon-surface/80 border border-malon-surface text-white font-semibold whitespace-nowrap"
                >
                  Todo el día (07-21)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetHours('ninguno')}
                  className="px-2 py-1 rounded-lg bg-malon-surface hover:bg-malon-surface/80 border border-malon-surface text-malon-muted font-semibold whitespace-nowrap"
                >
                  Desmarcar
                </button>
              </div>

              {/* Grilla interactiva de bloques horarios con checkbox */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {HOURLY_SLOTS.map(slot => {
                  const isChecked = selectedHours.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleHour(slot.id)}
                      className={`p-2 rounded-xl border text-left font-mono transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-malon-sand text-black font-bold border-malon-sand shadow-sm'
                          : 'bg-malon-card/80 text-malon-muted border-malon-surface hover:border-malon-sand/40 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{slot.label} hs</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isChecked
                            ? 'bg-black text-malon-sand border-black'
                            : 'border-malon-surface bg-malon-bg'
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

          {/* Asignación de Coaches - DOBLE COBERTURA OBLIGATORIA */}
          {!isClosed && (
            <div className="bg-gradient-to-r from-malon-sand/10 to-transparent border border-malon-sand/40 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-malon-sand text-black flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Doble Cobertura Feriado</h4>
                  <p className="text-[10px] text-malon-sand">
                    Los feriados operan estrictamente en dupla (2 coaches en sala)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-malon-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
                    Coach 1 (Titular Dupla) *
                  </label>
                  <select
                    value={coachId1}
                    onChange={e => setCoachId1(e.target.value)}
                    required={!isClosed}
                    className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-white text-xs outline-none font-bold"
                  >
                    <option value="" disabled>Seleccionar Coach 1</option>
                    {staff.map(c => (
                      <option key={c.id} value={c.id} disabled={c.id === coachId2}>
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
                    value={coachId2}
                    onChange={e => setCoachId2(e.target.value)}
                    required={!isClosed}
                    className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-white text-xs outline-none font-bold"
                  >
                    <option value="" disabled>Seleccionar Coach 2</option>
                    {staff.map(c => (
                      <option key={c.id} value={c.id} disabled={c.id === coachId1}>
                        {c.name} ({c.initials})
                      </option>
                    ))}
                  </select>
                </div>
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
                className="px-4 py-2.5 rounded-xl bg-malon-surface text-malon-muted hover:text-white font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-malon-sand hover:bg-malon-sand-hover text-black font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-malon-sand/20"
              >
                <Save className="w-4 h-4" />
                <span>{editingHoliday ? 'Actualizar Feriado' : 'Guardar Feriado'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
