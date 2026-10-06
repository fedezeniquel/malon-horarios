import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Clock, Calendar, AlertCircle } from 'lucide-react';
import { ShiftChangeType, Franja } from '../../types';

export const CreateShiftChangeModal: React.FC = () => {
  const { isCreateChangeModalOpen, setIsCreateChangeModalOpen, createShiftChange } = useApp();

  const [type, setType] = useState<ShiftChangeType>('single_hour');
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [franja, setFranja] = useState<Franja>('manana');
  const [reason, setReason] = useState('');

  if (!isCreateChangeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determinar día de la semana
    const [year, month, day] = targetDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[dateObj.getDay()];

    createShiftChange({
      target_date: targetDate,
      day_name: dayName,
      start_time: startTime,
      end_time: endTime,
      type,
      franja,
      reason: reason.trim() || 'Motivo personal / Reemplazo',
    });

    setIsCreateChangeModalOpen(false);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Pedir Reemplazo / Cambio</h3>
            <p className="text-xs text-malon-muted">
              Publicá tu turno en la bolsa de cambios comunitaria
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
          {/* Tipo de cambio */}
          <div>
            <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Tipo de Cubrimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('single_hour');
                  setEndTime('08:00');
                }}
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
                onClick={() => setType('multiple_hours')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  type === 'multiple_hours'
                    ? 'bg-malon-red/20 border-malon-red text-white'
                    : 'bg-malon-surface/50 border-malon-surface text-malon-muted hover:text-white'
                }`}
              >
                Horas Múltiples
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('full_shift');
                  if (franja === 'manana') {
                    setStartTime('07:00');
                    setEndTime('13:00');
                  } else if (franja === 'tarde') {
                    setStartTime('13:00');
                    setEndTime('18:00');
                  } else {
                    setStartTime('18:00');
                    setEndTime('21:00');
                  }
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  type === 'full_shift'
                    ? 'bg-malon-red/20 border-malon-red text-white'
                    : 'bg-malon-surface/50 border-malon-surface text-malon-muted hover:text-white'
                }`}
              >
                Turno Completo
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Fecha del turno
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand"
              />
            </div>
          </div>

          {/* Franja */}
          <div>
            <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Franja Horaria
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'manana', label: 'Mañana' },
                { id: 'tarde', label: 'Tarde' },
                { id: 'noche', label: 'Noche' },
                { id: 'sabado', label: 'Sábado' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFranja(f.id as Franja)}
                  className={`py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    franja === f.id
                      ? 'bg-malon-sand/20 border-malon-sand text-malon-sand font-bold'
                      : 'bg-malon-surface/40 border-malon-surface text-malon-muted hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horario de inicio y fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-malon-muted block mb-1">
                Desde
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-malon-muted block mb-1">
                Hasta
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-malon-sand"
              />
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
              className="w-full bg-malon-red hover:bg-malon-red-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-malon-red/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Publicar en Bolsa de Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
