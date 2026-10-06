import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Calendar, ShieldAlert, ArrowLeftRight, Users, PlusCircle, CheckCircle2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lun', fullName: 'Lunes' },
  { id: 2, name: 'Mar', fullName: 'Martes' },
  { id: 3, name: 'Mié', fullName: 'Miércoles' },
  { id: 4, name: 'Jue', fullName: 'Jueves' },
  { id: 5, name: 'Vie', fullName: 'Viernes' },
  { id: 6, name: 'Sáb', fullName: 'Sábado' },
];

export const MiGrilla: React.FC = () => {
  const { currentCoach, shifts, saturdayGuards, setIsCreateChangeModalOpen } = useApp();
  
  // Día seleccionado (por defecto día actual o lunes)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 1 : day; // Si es domingo, mostrar lunes
  });

  // Turnos del profesor activo
  const myShifts = shifts.filter(s => s.coach_id === currentCoach.id);
  
  // Horas semanales acumuladas
  const weeklyHours = myShifts.reduce((acc, curr) => acc + curr.duration_hours, 0);

  // Guardias de sábado asignadas
  const myGuards = saturdayGuards.filter(g => g.coach_id === currentCoach.id);
  const nextGuard = myGuards.find(g => new Date(g.date) >= new Date(new Date().setHours(0,0,0,0))) || myGuards[0];

  // Turnos del día seleccionado
  const selectedDayShifts = myShifts.filter(s => s.day_of_week === selectedDay);

  return (
    <div className="space-y-5 pb-20">
      {/* Tarjeta de bienvenida y métricas de carga */}
      <div className="bg-gradient-to-br from-malon-card to-[#121214] border border-malon-surface rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-malon-surface border border-malon-sand/40 flex items-center justify-center text-malon-sand font-black text-lg shadow-inner">
              {currentCoach.initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white leading-none">
                  {currentCoach.name}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30">
                  {currentCoach.role === 'admin' ? 'Jefe / Admin' : currentCoach.role === 'coach_admin' ? 'Coach Admin' : 'Coach'}
                </span>
              </div>
              <p className="text-xs text-malon-muted mt-1">
                Gimnasio Malón en Movimiento
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateChangeModalOpen(true)}
            className="bg-malon-red hover:bg-malon-red-hover active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-malon-red/20"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Pedir Cambio</span>
          </button>
        </div>

        {/* Métricas destacadas */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-malon-surface/80">
          <div className="bg-malon-bg/60 rounded-xl p-3 border border-malon-surface/50">
            <div className="flex items-center space-x-1.5 text-malon-muted text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-malon-sand" />
              <span>Carga Semanal</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white">{weeklyHours}</span>
              <span className="text-xs text-malon-muted font-medium">horas / sem</span>
            </div>
          </div>

          <div className="bg-malon-bg/60 rounded-xl p-3 border border-malon-surface/50">
            <div className="flex items-center space-x-1.5 text-malon-muted text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-malon-red" />
              <span>Próxima Guardia</span>
            </div>
            {nextGuard ? (
              <div>
                <p className="text-xs font-bold text-white truncate">
                  {nextGuard.date.split('-').slice(1).reverse().join('/')}
                </p>
                <span className="text-[10px] text-malon-sand font-medium">
                  11:00 a 14:00 hs
                </span>
              </div>
            ) : (
              <span className="text-xs text-malon-muted">Sin guardias próximas</span>
            )}
          </div>
        </div>
      </div>

      {/* Selector de días de la semana */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-malon-sand uppercase tracking-wider">
            Cronograma Semanal
          </h3>
          <span className="text-xs text-malon-muted">
            {myShifts.length} turnos asignados
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {DAYS_OF_WEEK.map(d => {
            const hasShift = myShifts.some(s => s.day_of_week === d.id);
            const isSelected = selectedDay === d.id;

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`py-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-malon-surface text-white border border-malon-sand shadow-sm'
                    : 'bg-malon-card hover:bg-malon-surface/50 text-malon-muted border border-malon-surface/60'
                }`}
              >
                <span className="text-xs font-bold leading-none">{d.name}</span>
                <span className="text-[10px] mt-1 leading-none">
                  {hasShift ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-malon-sand inline-block" />
                  ) : (
                    <span className="text-malon-surface">-</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de turnos del día */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h4 className="text-xs font-semibold text-malon-muted">
            Turnos de {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.fullName}
          </h4>
        </div>

        {selectedDay === 6 ? (
          /* Vista especial sábado */
          <div className="space-y-2">
            {myGuards.length > 0 ? (
              myGuards.map(guard => (
                <div
                  key={guard.id}
                  className="bg-malon-card border border-malon-surface rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30">
                      Guardia de Sábado
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {guard.start_time} - {guard.end_time} hs
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Guardia Rotativa de Sala
                    </h4>
                    <p className="text-xs text-malon-muted mt-0.5">
                      Fecha: {guard.date}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-malon-surface flex justify-end">
                    <button
                      onClick={() => setIsCreateChangeModalOpen(true)}
                      className="text-xs text-malon-red hover:underline font-semibold flex items-center space-x-1"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Pedir reemplazo para esta guardia</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-malon-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-malon-muted">
                  No tenés guardia asignada para este sábado
                </p>
              </div>
            )}
          </div>
        ) : selectedDayShifts.length > 0 ? (
          <div className="space-y-2.5">
            {selectedDayShifts.map(shift => (
              <div
                key={shift.id}
                className="bg-malon-card border border-malon-surface rounded-2xl p-4 transition-all hover:border-malon-sand/50 space-y-3"
              >
                {/* Cabecera del turno */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        shift.franja === 'manana'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : shift.franja === 'tarde'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      Turno {shift.franja}
                    </span>

                    {shift.is_double_coverage && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-malon-sand/20 text-malon-sand border border-malon-sand/30 flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>Doble Cobertura</span>
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-black font-mono text-white">
                    {shift.start_time} - {shift.end_time}
                  </span>
                </div>

                {/* Info del turno y compañero si es doble */}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>Sala de Entrenamiento</span>
                    <span className="text-xs text-malon-muted font-normal">
                      {shift.duration_hours} hs
                    </span>
                  </h4>
                  {shift.is_double_coverage && shift.partner_name && (
                    <p className="text-xs text-malon-sand font-medium mt-1 flex items-center space-x-1">
                      <span>Junto a:</span>
                      <strong className="text-white underline decoration-malon-sand">
                        {shift.partner_name}
                      </strong>
                    </p>
                  )}
                  {shift.notes && (
                    <p className="text-xs text-malon-muted/80 mt-1">
                      {shift.notes}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="pt-2 border-t border-malon-surface flex items-center justify-between">
                  <span className="text-[11px] text-malon-muted">
                    {shift.is_double_coverage ? 'Cobertura compartida' : 'Bloque individual'}
                  </span>
                  <button
                    onClick={() => setIsCreateChangeModalOpen(true)}
                    className="text-xs text-malon-red hover:text-white hover:bg-malon-red/20 px-2.5 py-1 rounded-lg border border-malon-red/30 font-semibold transition-all flex items-center space-x-1"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Pedir reemplazo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-6 text-center">
            <Clock className="w-8 h-8 text-malon-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-malon-muted">
              Día libre para {currentCoach.name} 🎉
            </p>
          </div>
        )}
      </div>

      {/* Historial de guardias de sábado */}
      <div className="bg-malon-card border border-malon-surface rounded-2xl p-4">
        <h4 className="text-xs font-bold text-malon-sand uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Cronograma de Guardias de Sábado (11-14 hs)</span>
          <span className="text-[10px] text-malon-muted">Rotativo</span>
        </h4>
        <div className="space-y-2 mt-3">
          {saturdayGuards.map(sg => {
            const isMe = sg.coach_id === currentCoach.id;
            return (
              <div
                key={sg.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                  isMe
                    ? 'bg-malon-surface/80 border-malon-sand text-white'
                    : 'bg-malon-bg/40 border-malon-surface/50 text-malon-muted'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white">
                    {sg.date.split('-').slice(1).reverse().join('/')}
                  </span>
                  <span>•</span>
                  <span className={`font-semibold ${isMe ? 'text-malon-sand' : 'text-white'}`}>
                    {sg.coach_name} {isMe && '(Vos)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-malon-muted">
                  11:00 - 14:00 hs
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
