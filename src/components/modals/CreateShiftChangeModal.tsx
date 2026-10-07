import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Clock, AlertCircle } from 'lucide-react';
import type { ShiftChangeType, Franja } from '../../types';
import { START_HOURS, getAvailableEndHours, calculateDurationHours } from '../../lib/hoursAudit';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCreateChangeModalOpen) return null;

  // Calcula la hora de fin para 1 hora suelta
  const getNextHour = (start: string): string => {
    const [h] = start.split(':').map(Number);
    const nextH = Math.min(h + 1, 21);
    return `${String(nextH).padStart(2, '0')}:00`;
  };

  const handleTypeChange = (newType: ShiftChangeType) => {
    setType(newType);
    setErrorMessage(null);

    if (newType === 'single_hour') {
      const nextH = getNextHour(startTime);
      setEndTime(nextH);
    } else if (newType === 'full_shift') {
      applyFranjaHours(franja);
    }
  };

  const applyFranjaHours = (selectedFranja: Franja) => {
    if (selectedFranja === 'manana') {
      setStartTime('07:00');
      setEndTime('13:00');
    } else if (selectedFranja === 'tarde') {
      setStartTime('13:00');
      setEndTime('18:00');
    } else if (selectedFranja === 'noche') {
      setStartTime('18:00');
      setEndTime('21:00');
    } else if (selectedFranja === 'sabado') {
      setStartTime('11:00');
      setEndTime('14:00');
    }
  };

  const handleFranjaChange = (newFranja: Franja) => {
    setFranja(newFranja);
    setErrorMessage(null);
    if (type === 'full_shift') {
      applyFranjaHours(newFranja);
    }
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setErrorMessage(null);

    if (type === 'single_hour') {
      setEndTime(getNextHour(newStart));
    } else {
      // Si la hora de fin actual no es posterior a la nueva hora de inicio, ajustar hacia adelante
      if (endTime <= newStart) {
        setEndTime(getNextHour(newStart));
      }
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    setErrorMessage(null);
  };

  const availableEndHours = getAvailableEndHours(startTime);
  const currentDuration = calculateDurationHours(startTime, endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      setErrorMessage('El horario "Hasta" debe ser estrictamente posterior al horario "Desde".');
      return;
    }

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
    setErrorMessage(null);
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
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tipo de cambio */}
          <div>
            <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider block mb-1.5">
              Tipo de Cubrimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                className="w-full bg-malon-surface/60 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
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
                  onClick={() => handleFranjaChange(f.id as Franja)}
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

          {/* Horario de inicio y fin en Formato 24hs estricto (07 a 21) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-malon-sand uppercase tracking-wider">
                Horario de Cobertura (Formato 24hs)
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
                <select
                  value={startTime}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
                >
                  {START_HOURS.map(hour => (
                    <option key={hour} value={hour} className="bg-malon-card text-white">
                      {hour} hs
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-malon-muted block mb-1">
                  Hasta
                </label>
                {type === 'single_hour' ? (
                  <div className="w-full bg-malon-surface/40 border border-malon-surface/60 rounded-xl px-3 py-2.5 text-sm text-white/90 font-mono flex items-center justify-between">
                    <span>{endTime} hs</span>
                    <span className="text-[10px] text-malon-sand font-bold uppercase">1h fija</span>
                  </div>
                ) : (
                  <select
                    value={endTime}
                    onChange={e => handleEndTimeChange(e.target.value)}
                    className="w-full bg-malon-surface/70 border border-malon-surface rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-malon-sand font-mono"
                  >
                    {availableEndHours.map(hour => (
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
        </form>
      </div>
    </div>
  );
};
