import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PlusCircle, Clock, Calendar, CheckCircle, Handshake, Trash2 } from 'lucide-react';
import type { ShiftChangeRequest } from '../../types';

export const Cambios: React.FC = () => {
  const { currentCoach, shiftChanges, claimShiftChange, confirmShiftChange, cancelShiftChange, setIsCreateChangeModalOpen } = useApp();
  
  const [filter, setFilter] = useState<'open' | 'mine' | 'history'>('open');

  const filteredChanges = shiftChanges.filter(item => {
    if (filter === 'open') {
      return item.status === 'open';
    }
    if (filter === 'mine') {
      return item.requester_id === currentCoach.id || item.claimed_by_id === currentCoach.id;
    }
    return item.status === 'confirmed' || item.status === 'claimed';
  });

  const getTypeBadge = (type: ShiftChangeRequest['type']) => {
    switch (type) {
      case 'single_hour':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            1 Hora Suelta
          </span>
        );
      case 'multiple_hours':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Horas Múltiples
          </span>
        );
      case 'full_shift':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-malon-red/20 text-malon-red border border-malon-red/30">
            Turno Completo
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Botón destacado para nuevo pedido */}
      <div className="bg-gradient-to-r from-malon-card to-[#19191d] border border-malon-surface rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
            <Handshake className="w-4 h-4 text-malon-sand" />
            <span>Bolsa Comunitaria</span>
          </h3>
          <p className="text-xs text-malon-muted mt-0.5">
            Publicá o tomá turnos entre compañeros
          </p>
        </div>

        <button
          onClick={() => setIsCreateChangeModalOpen(true)}
          className="bg-malon-red hover:bg-malon-red-hover active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-malon-red/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publicar</span>
        </button>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex bg-malon-card border border-malon-surface rounded-xl p-1 gap-1">
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
            filter === 'open'
              ? 'bg-malon-surface text-malon-sand shadow-sm'
              : 'text-malon-muted hover:text-white'
          }`}
        >
          Disponibles ({shiftChanges.filter(c => c.status === 'open').length})
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
            filter === 'mine'
              ? 'bg-malon-surface text-white shadow-sm'
              : 'text-malon-muted hover:text-white'
          }`}
        >
          Mis Pedidos
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
            filter === 'history'
              ? 'bg-malon-surface text-white shadow-sm'
              : 'text-malon-muted hover:text-white'
          }`}
        >
          En Proceso / Historial
        </button>
      </div>

      {/* Lista de Cambios */}
      <div className="space-y-3">
        {filteredChanges.length > 0 ? (
          filteredChanges.map(change => {
            const isMyRequest = change.requester_id === currentCoach.id;
            const isClaimedByMe = change.claimed_by_id === currentCoach.id;

            return (
              <div
                key={change.id}
                className="bg-malon-card border border-malon-surface rounded-2xl p-4 space-y-3 transition-all hover:border-malon-sand/40"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-malon-surface flex items-center justify-center text-xs font-bold text-white border border-malon-surface">
                      {change.requester_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {change.requester_name} {isMyRequest && '(Vos)'}
                      </h4>
                      <span className="text-[10px] text-malon-muted">
                        Publicado recientemente
                      </span>
                    </div>
                  </div>

                  {getTypeBadge(change.type)}
                </div>

                {/* Datos del turno */}
                <div className="bg-malon-bg/60 border border-malon-surface/60 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span className="flex items-center space-x-1.5 text-malon-sand">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{change.day_name} {change.target_date.split('-').slice(1).reverse().join('/')}</span>
                    </span>
                    <span className="font-mono text-white flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-malon-muted" />
                      <span>{change.start_time} - {change.end_time} hs</span>
                    </span>
                  </div>

                  {change.reason && (
                    <p className="text-xs text-malon-muted italic pt-1 border-t border-malon-surface/40">
                      "{change.reason}"
                    </p>
                  )}
                </div>

                {/* Acciones y estado Peer-to-Peer */}
                <div className="pt-2 border-t border-malon-surface flex items-center justify-between">
                  {/* Estado abierto */}
                  {change.status === 'open' && (
                    <>
                      {isMyRequest ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-malon-sand font-medium">
                            Esperando que alguien tome tu turno...
                          </span>
                          <button
                            onClick={() => cancelShiftChange(change.id)}
                            className="text-xs text-malon-muted hover:text-malon-red p-1 rounded-lg flex items-center space-x-1 transition-all"
                            title="Cancelar solicitud"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-malon-muted">
                            ¿Podés cubrirlo?
                          </span>
                          <button
                            onClick={() => claimShiftChange(change.id)}
                            className="bg-malon-sand hover:bg-malon-sand-hover text-black px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow flex items-center space-x-1"
                          >
                            <Handshake className="w-3.5 h-3.5" />
                            <span>Tomar Reemplazo</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Estado Reclamado / En confirmación */}
                  {change.status === 'claimed' && (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-malon-sand font-semibold flex items-center space-x-1">
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Tomado por: {change.claimed_by_name}</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          Pendiente Confirmación
                        </span>
                      </div>

                      {isMyRequest && (
                        <button
                          onClick={() => confirmShiftChange(change.id)}
                          className="w-full bg-malon-red hover:bg-malon-red-hover text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-malon-red/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirmar Reemplazo (Confirmar Cambio)</span>
                        </button>
                      )}

                      {isClaimedByMe && (
                        <p className="text-[11px] text-malon-muted text-center italic">
                          Esperando que {change.requester_name} confirme el cambio
                        </p>
                      )}
                    </div>
                  )}

                  {/* Estado Confirmado */}
                  {change.status === 'confirmed' && (
                    <div className="flex items-center justify-between w-full text-xs">
                      <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmado: Cubre {change.claimed_by_name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-malon-muted">
                        Listo en sistema
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-8 text-center space-y-2">
            <Handshake className="w-8 h-8 text-malon-muted mx-auto opacity-40" />
            <h4 className="text-xs font-semibold text-white">
              No hay pedidos en esta sección
            </h4>
            <p className="text-[11px] text-malon-muted">
              {filter === 'open'
                ? 'Todos los turnos están cubiertos por el staff.'
                : 'No tenés solicitudes activas en esta categoría.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
