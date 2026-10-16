import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Users, User, ShieldAlert, Check, Clock, AlertCircle } from 'lucide-react';
import type { Franja } from '../../types';
import { START_HOURS, getAvailableEndHours } from '../../lib/hoursAudit';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
];

export const EditShiftModal: React.FC = () => {
  const {
    isShiftModalOpen,
    setIsShiftModalOpen,
    editingBlock,
    setEditingBlock,
    staff,
    saveShiftBlock,
    deleteShiftBlock,
  } = useApp();

  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [franja, setFranja] = useState<Franja>('manana');
  const [startTime, setStartTime] = useState<string>('07:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [coachId1, setCoachId1] = useState<string>('');
  const [coachId2, setCoachId2] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingBlock) {
      setDayOfWeek(editingBlock.day_of_week);
      setFranja(editingBlock.franja);
      setStartTime(editingBlock.start_time);
      setEndTime(editingBlock.end_time);
      setIsDouble(editingBlock.is_double_coverage);
      setCoachId1(editingBlock.coach_id_1 || (staff[0]?.id || ''));
      setCoachId2(editingBlock.coach_id_2 || (staff[1]?.id || ''));
      setNotes(editingBlock.notes || '');
    } else {
      setDayOfWeek(1);
      setFranja('manana');
      setStartTime('07:00');
      setEndTime('09:00');
      setIsDouble(false);
      setCoachId1(staff[0]?.id || '');
      setCoachId2(staff[1]?.id || '');
      setNotes('');
    }
    setError('');
  }, [editingBlock, isShiftModalOpen, staff]);

  if (!isShiftModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!coachId1) {
      setError('Por favor asigná al menos el Coach 1 para esta cobertura.');
      return;
    }

    if (isDouble) {
      if (!coachId2) {
        setError('En modalidad de doble cobertura debés asignar ambos coaches.');
        return;
      }
      if (coachId1 === coachId2) {
        setError('Los dos coaches asignados deben ser personas distintas.');
        return;
      }
    }

    const coach1 = staff.find(s => s.id === coachId1);
    const coach2 = staff.find(s => s.id === coachId2);

    saveShiftBlock({
      existingShiftIds: editingBlock?.existingShiftIds || [],
      day_of_week: dayOfWeek,
      franja,
      start_time: startTime,
      end_time: endTime,
      is_double_coverage: isDouble,
      coach_id_1: coach1?.id || coachId1,
      coach_name_1: coach1?.name || '',
      coach_id_2: isDouble ? (coach2?.id || coachId2) : undefined,
      coach_name_2: isDouble ? (coach2?.name || '') : undefined,
      notes: notes.trim() || undefined,
    });

    setIsShiftModalOpen(false);
    setEditingBlock(null);
  };

  const handleDelete = () => {
    if (editingBlock && editingBlock.existingShiftIds.length > 0) {
      if (window.confirm(`¿Seguro que deseas eliminar este horario de ${editingBlock.start_time} a ${editingBlock.end_time} hs de la grilla?`)) {
        deleteShiftBlock(editingBlock.existingShiftIds);
        setIsShiftModalOpen(false);
        setEditingBlock(null);
      }
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
                {editingBlock ? 'Editar Horario y Cobertura' : 'Agregar Horario a Grilla'}
              </h3>
              <p className="text-xs text-malon-muted">
                Asignación de coaches y modalidad de cobertura
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsShiftModalOpen(false);
              setEditingBlock(null);
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

          {/* Día de la semana */}
          <div>
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5 text-[10px]">
              Día de la Semana
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayOfWeek(d.id)}
                  className={`py-2 rounded-xl font-bold border transition-all text-center ${
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
            <label className="font-semibold text-malon-sand uppercase tracking-wider block mb-1.5 text-[10px]">
              Franja de Sala
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'manana', label: 'Mañana (07-13)' },
                { id: 'siesta', label: 'Siesta (13-16)' },
                { id: 'tarde', label: 'Tarde (16-19)' },
                { id: 'noche', label: 'Noche (19-21)' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFranja(f.id as Franja);
                    if (!editingBlock) {
                      if (f.id === 'manana') {
                        setStartTime('07:00');
                        setEndTime('13:00');
                      } else if (f.id === 'siesta') {
                        setStartTime('13:00');
                        setEndTime('16:00');
                      } else if (f.id === 'tarde') {
                        setStartTime('16:00');
                        setEndTime('19:00');
                      } else if (f.id === 'noche') {
                        setStartTime('19:00');
                        setEndTime('21:00');
                      }
                    }
                  }}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all text-center text-[11px] leading-tight ${
                    franja === f.id
                      ? 'bg-malon-sand/20 border-malon-sand text-malon-sand shadow-sm'
                      : 'bg-malon-surface/40 border-malon-surface text-malon-muted hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horarios Desde - Hasta en Formato 24hs */}
          <div className="bg-malon-surface/40 border border-malon-surface rounded-2xl p-3 space-y-2">
            <span className="font-semibold text-malon-sand uppercase tracking-wider block text-[10px] flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Horario de Cobertura (24hs)</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-malon-muted block mb-1 text-[11px]">
                  Hora Inicio
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
                  className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                >
                  {START_HOURS.map(hour => (
                    <option key={hour} value={hour} className="bg-malon-card text-white">
                      {hour} hs
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-malon-muted block mb-1 text-[11px]">
                  Hora Fin
                </label>
                <select
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                >
                  {getAvailableEndHours(startTime).map(hour => (
                    <option key={hour} value={hour} className="bg-malon-card text-white">
                      {hour} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Selector de Modalidad: Cobertura Simple vs Cobertura Doble */}
          <div className="bg-malon-surface/40 border border-malon-surface rounded-2xl p-3 space-y-2.5">
            <span className="font-semibold text-malon-sand uppercase tracking-wider block text-[10px]">
              Modalidad de Cobertura
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDouble(false)}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  !isDouble
                    ? 'bg-malon-sand text-black border-malon-sand shadow-sm'
                    : 'bg-malon-bg text-malon-muted border-malon-surface hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Cobertura Simple</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDouble(true)}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  isDouble
                    ? 'bg-malon-sand text-black border-malon-sand shadow-sm'
                    : 'bg-malon-bg text-malon-muted border-malon-surface hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Doble Cobertura</span>
              </button>
            </div>
          </div>

          {/* Asignación de Coaches */}
          <div className="bg-gradient-to-r from-malon-surface to-malon-surface/90 border border-malon-sand/40 rounded-2xl p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-malon-sand/20 border border-malon-sand/40 flex items-center justify-center text-malon-sand font-bold">
                {isDouble ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">
                  {isDouble ? 'Coaches Asignados (Doble Cobertura)' : 'Coach Asignado (Cobertura Simple)'}
                </h4>
                <p className="text-[10px] text-malon-muted">
                  {isDouble ? 'Seleccioná la dupla que cubrirá la sala en este horario' : 'Seleccioná el coach titular de la sala'}
                </p>
              </div>
            </div>

            <div className={`grid ${isDouble ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className="font-semibold text-malon-muted block mb-1 text-[10px] uppercase tracking-wider">
                  {isDouble ? 'Coach 1 (Titular) *' : 'Coach Titular *'}
                </label>
                <select
                  value={coachId1}
                  onChange={e => setCoachId1(e.target.value)}
                  className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id} disabled={isDouble && s.id === coachId2} className="bg-malon-card text-white">
                      {s.name} ({s.role === 'admin' ? 'Jefe' : s.role === 'coach_admin' ? 'Coach Admin' : 'Coach'})
                    </option>
                  ))}
                </select>
              </div>

              {isDouble && (
                <div>
                  <label className="font-semibold text-malon-muted block mb-1 text-[10px] uppercase tracking-wider">
                    Coach 2 (Acompañante) *
                  </label>
                  <select
                    value={coachId2}
                    onChange={e => setCoachId2(e.target.value)}
                    className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                  >
                    <option value="" disabled>Seleccionar Coach 2...</option>
                    {staff
                      .filter(s => s.id !== coachId1)
                      .map(s => (
                        <option key={s.id} value={s.id} className="bg-malon-card text-white">
                          {s.name} ({s.role === 'admin' ? 'Jefe' : s.role === 'coach_admin' ? 'Coach Admin' : 'Coach'})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="font-semibold text-malon-muted block mb-1 text-[10px] uppercase tracking-wider">
              Observaciones / Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Clases de iniciación, apoyo en sala..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-malon-bg border border-malon-surface focus:border-malon-sand rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-between space-x-2">
            {editingBlock && editingBlock.existingShiftIds.length > 0 ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold transition-all flex items-center space-x-1.5"
                title="Eliminar este horario de la grilla"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsShiftModalOpen(false);
                  setEditingBlock(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-malon-surface text-malon-muted hover:text-white font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-malon-red hover:bg-malon-red-hover text-white font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-malon-red/20"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cobertura</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
