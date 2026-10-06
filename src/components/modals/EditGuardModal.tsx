import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Calendar, Check } from 'lucide-react';
import type { SaturdayGuard } from '../../types';

export const EditGuardModal: React.FC = () => {
  const {
    isGuardModalOpen,
    setIsGuardModalOpen,
    editingGuard,
    staff,
    addSaturdayGuard,
    updateSaturdayGuard,
    deleteSaturdayGuard,
  } = useApp();

  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('11:00');
  const [endTime, setEndTime] = useState<string>('14:00');
  const [coachId, setCoachId] = useState<string>(staff[0]?.id || '');
  const [status, setStatus] = useState<SaturdayGuard['status']>('scheduled');

  useEffect(() => {
    if (editingGuard) {
      setDate(editingGuard.date);
      setStartTime(editingGuard.start_time);
      setEndTime(editingGuard.end_time);
      setCoachId(editingGuard.coach_id);
      setStatus(editingGuard.status);
    } else {
      const today = new Date();
      const nextSat = new Date();
      nextSat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
      setDate(nextSat.toISOString().split('T')[0]);
      setStartTime('11:00');
      setEndTime('14:00');
      setCoachId(staff[0]?.id || '');
      setStatus('scheduled');
    }
  }, [editingGuard, isGuardModalOpen, staff]);

  if (!isGuardModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCoach = staff.find(s => s.id === coachId) || staff[0];

    if (editingGuard) {
      updateSaturdayGuard({
        ...editingGuard,
        date,
        start_time: startTime,
        end_time: endTime,
        coach_id: selectedCoach.id,
        coach_name: selectedCoach.name,
        status,
      });
    } else {
      addSaturdayGuard({
        date,
        start_time: startTime,
        end_time: endTime,
        coach_id: selectedCoach.id,
        coach_name: selectedCoach.name,
        status,
      });
    }

    setIsGuardModalOpen(false);
  };

  const handleDelete = () => {
    if (editingGuard && window.confirm(`¿Seguro que deseas sacar a ${editingGuard.coach_name} de la guardia del sábado ${editingGuard.date}?`)) {
      deleteSaturdayGuard(editingGuard.id);
      setIsGuardModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-malon-sand/20 border border-malon-sand/40 flex items-center justify-center text-malon-sand">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingGuard ? 'Modificar Guardia de Sábado' : 'Asignar Guardia de Sábado'}
              </h3>
              <p className="text-xs text-malon-muted">
                Gestión de rotación de guardia de fin de semana
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGuardModalOpen(false)}
            className="text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Fecha del sábado */}
          <div>
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Fecha de la Guardia (Sábado)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
            />
          </div>

          {/* Profesor Asignado */}
          <div>
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Profesor Designado para Cubrir
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

          {/* Horario de la Guardia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-malon-muted block mb-1">
                Desde
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-malon-muted block mb-1">
                Hasta
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
              />
            </div>
          </div>

          {/* Estado de la guardia */}
          <div>
            <label className="font-semibold text-malon-muted block mb-1">
              Estado de Asignación
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'scheduled', label: 'Programada' },
                { id: 'completed', label: 'Cumplida' },
                { id: 'replaced', label: 'Reemplazada' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as SaturdayGuard['status'])}
                  className={`py-2 rounded-xl font-bold border transition-all text-center ${
                    status === st.id
                      ? 'bg-malon-sand/20 border-malon-sand text-malon-sand'
                      : 'bg-malon-surface/40 border-malon-surface text-malon-muted hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center space-x-2">
            {editingGuard && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-malon-surface hover:bg-malon-red/20 text-malon-muted hover:text-malon-red p-3 rounded-xl border border-malon-surface transition-all flex items-center justify-center space-x-1"
                title="Sacar / Eliminar a esta persona del sábado"
              >
                <Trash2 className="w-4 h-4 text-malon-red" />
                <span className="text-malon-red font-bold">Sacar</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 bg-malon-sand hover:bg-malon-sand-hover text-black font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingGuard ? 'Guardar Cambios' : 'Asignar Persona al Sábado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
