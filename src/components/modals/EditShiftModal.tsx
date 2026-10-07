import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Users, ShieldAlert, Check } from 'lucide-react';
import type { Franja } from '../../types';
import { START_HOURS, getAvailableEndHours } from '../../lib/hoursAudit';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
];

export const EditShiftModal: React.FC = () => {
  const {
    isShiftModalOpen,
    setIsShiftModalOpen,
    editingShift,
    staff,
    addShift,
    updateShift,
    deleteShift,
  } = useApp();

  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [franja, setFranja] = useState<Franja>('manana');
  const [startTime, setStartTime] = useState<string>('07:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [coachId, setCoachId] = useState<string>(staff[0]?.id || '');
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingShift) {
      setDayOfWeek(editingShift.day_of_week);
      setFranja(editingShift.franja);
      setStartTime(editingShift.start_time);
      setEndTime(editingShift.end_time);
      setCoachId(editingShift.coach_id);
      setIsDouble(editingShift.is_double_coverage);
      setPartnerName(editingShift.partner_name || '');
      setNotes(editingShift.notes || '');
    } else {
      setDayOfWeek(1);
      setFranja('manana');
      setStartTime('07:00');
      setEndTime('09:00');
      setCoachId(staff[0]?.id || '');
      setIsDouble(false);
      setPartnerName('');
      setNotes('');
    }
  }, [editingShift, isShiftModalOpen, staff]);

  if (!isShiftModalOpen) return null;

  const calculateDuration = (start: string, end: string): number => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 1;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCoach = staff.find(s => s.id === coachId) || staff[0];
    const duration = calculateDuration(startTime, endTime);

    if (editingShift) {
      updateShift({
        ...editingShift,
        day_of_week: dayOfWeek,
        franja,
        start_time: startTime,
        end_time: endTime,
        duration_hours: duration,
        coach_id: selectedCoach.id,
        coach_name: selectedCoach.name,
        is_double_coverage: isDouble,
        partner_name: isDouble ? partnerName.trim() : undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addShift({
        day_of_week: dayOfWeek,
        franja,
        start_time: startTime,
        end_time: endTime,
        duration_hours: duration,
        coach_id: selectedCoach.id,
        coach_name: selectedCoach.name,
        is_double_coverage: isDouble,
        partner_name: isDouble ? partnerName.trim() : undefined,
        notes: notes.trim() || undefined,
      });
    }

    setIsShiftModalOpen(false);
  };

  const handleDelete = () => {
    if (editingShift && window.confirm(`¿Seguro que deseas eliminar este turno de ${editingShift.coach_name}?`)) {
      deleteShift(editingShift.id);
      setIsShiftModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-malon-red/20 border border-malon-red/40 flex items-center justify-center text-malon-red">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingShift ? 'Editar Turno Permanente' : 'Agregar Nuevo Turno'}
              </h3>
              <p className="text-xs text-malon-muted">
                Modificación administrativa de grilla
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsShiftModalOpen(false)}
            className="text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Día de la semana */}
          <div>
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Día de la Semana
            </label>
            <div className="grid grid-cols-6 gap-1">
              {DAYS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayOfWeek(d.id)}
                  className={`py-2 rounded-lg font-bold border transition-all text-center ${
                    dayOfWeek === d.id
                      ? 'bg-malon-red text-white border-malon-red shadow-sm'
                      : 'bg-malon-surface/50 text-malon-muted border-malon-surface hover:text-white'
                  }`}
                >
                  {d.name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Franja horaria */}
          <div>
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Franja
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'manana', label: 'Mañana' },
                { id: 'tarde', label: 'Tarde' },
                { id: 'noche', label: 'Noche' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFranja(f.id as Franja);
                    if (f.id === 'manana' && !editingShift) {
                      setStartTime('07:00');
                      setEndTime('09:00');
                    } else if (f.id === 'tarde' && !editingShift) {
                      setStartTime('13:00');
                      setEndTime('18:00');
                    } else if (f.id === 'noche' && !editingShift) {
                      setStartTime('18:00');
                      setEndTime('21:00');
                    }
                  }}
                  className={`py-2 rounded-xl font-bold border transition-all text-center ${
                    franja === f.id
                      ? 'bg-malon-sand/20 border-malon-sand text-malon-sand'
                      : 'bg-malon-surface/40 border-malon-surface text-malon-muted hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profesor Titular */}
          <div>
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Profesor Titular Asignado
            </label>
            <select
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id} className="bg-malon-card text-white">
                  {s.name} ({s.role === 'admin' ? 'Jefe / Admin' : s.role === 'coach_admin' ? 'Coach Admin' : 'Coach'})
                </option>
              ))}
            </select>
          </div>

          {/* Horarios Desde - Hasta en Formato 24hs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-malon-muted block mb-1">
                Hora Inicio (24hs)
              </label>
              <select
                value={startTime}
                onChange={e => {
                  const newStart = e.target.value;
                  setStartTime(newStart);
                  if (endTime <= newStart) {
                    const [h] = newStart.split(':').map(Number);
                    const nextH = Math.min(h + 1, 21);
                    setEndTime(`${String(nextH).padStart(2, '0')}:00`);
                  }
                }}
                className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
              >
                {START_HOURS.map(hour => (
                  <option key={hour} value={hour} className="bg-malon-card text-white">
                    {hour} hs
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-malon-muted block mb-1">
                Hora Fin (24hs)
              </label>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
              >
                {getAvailableEndHours(startTime).map(hour => (
                  <option key={hour} value={hour} className="bg-malon-card text-white">
                    {hour} hs
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doble cobertura toggle */}
          <div className="bg-malon-bg/60 border border-malon-surface rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-malon-sand" />
                <span className="font-bold text-white">¿Es Turno con Doble Cobertura?</span>
              </div>
              <input
                type="checkbox"
                checked={isDouble}
                onChange={e => setIsDouble(e.target.checked)}
                className="w-4 h-4 rounded accent-malon-sand"
              />
            </div>

            {isDouble && (
              <div>
                <label className="font-semibold text-malon-muted block mb-1">
                  Nombre del Compañero / Pareja de Cobertura
                </label>
                <select
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  className="w-full bg-malon-surface/80 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand"
                >
                  <option value="">Seleccionar compañero...</option>
                  {staff
                    .filter(s => s.id !== coachId)
                    .map(s => (
                      <option key={s.id} value={s.name} className="bg-malon-card text-white">
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="font-semibold text-malon-muted block mb-1">
              Observaciones / Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Cobertura especial, apertura..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white placeholder-malon-muted/50 focus:outline-none focus:border-malon-sand"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center space-x-2">
            {editingShift && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-malon-surface hover:bg-malon-red/20 text-malon-muted hover:text-malon-red p-3 rounded-xl border border-malon-surface transition-all flex items-center justify-center"
                title="Eliminar este turno"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 bg-malon-red hover:bg-malon-red-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-malon-red/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingShift ? 'Guardar Cambios de Grilla' : 'Crear Turno en Grilla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
