import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PlusCircle,
  Clock,
  Calendar,
  CheckCircle,
  Handshake,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  Send,
  Inbox,
  Sparkles,
} from 'lucide-react';
import type { ShiftChangeRequest, ShiftCompensationType } from '../../types';
import { calculateDurationHours } from '../../lib/hoursAudit';

export const Cambios: React.FC = () => {
  const {
    currentCoach,
    shiftChanges,
    claimShiftChange,
    confirmShiftChange,
    cancelShiftChange,
    setIsCreateChangeModalOpen,
  } = useApp();

  const [filter, setFilter] = useState<'open' | 'mine' | 'history'>('open');
  const [mineSubFilter, setMineSubFilter] = useState<'all' | 'created' | 'claimed'>('all');
  const [selectedCompensation, setSelectedCompensation] = useState<Record<string, ShiftCompensationType>>({});

  // Listas segmentadas
  const openChanges = shiftChanges.filter(c => c.status === 'open');
  const myCreatedChanges = shiftChanges.filter(
    c => c.requester_id === currentCoach.id && c.status !== 'cancelled'
  );
  const myClaimedChanges = shiftChanges.filter(
    c => c.claimed_by_id === currentCoach.id && c.status !== 'cancelled'
  );
  const myTotalCount = myCreatedChanges.length + myClaimedChanges.length;
  const historyChanges = shiftChanges.filter(
    c => c.status === 'confirmed' || c.status === 'claimed'
  );

  const getTypeBadge = (type: ShiftChangeRequest['type'], duration?: number) => {
    const effectiveType = duration === 1 ? 'single_hour' : type;
    switch (effectiveType) {
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

  const renderChangeCard = (change: ShiftChangeRequest, sectionContext?: 'created' | 'claimed') => {
    const isMyRequest = change.requester_id === currentCoach.id;
    const isClaimedByMe = change.claimed_by_id === currentCoach.id;
    const duration = calculateDurationHours(change.start_time, change.end_time);
    const currentCompChoice = selectedCompensation[change.id] || 'work';

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
              <div className="flex items-center space-x-2 flex-wrap">
                <h4 className="text-xs font-bold text-white">
                  {change.requester_name} {isMyRequest && '(Vos)'}
                </h4>
                {sectionContext === 'created' && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-malon-red/15 text-malon-red border border-malon-red/30">
                    Realizado
                  </span>
                )}
                {sectionContext === 'claimed' && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Tomado
                  </span>
                )}
              </div>
              <span className="text-[10px] text-malon-muted">
                {isClaimedByMe && !isMyRequest
                  ? `Cubrís este turno vos (${currentCoach.name})`
                  : 'Publicado recientemente'}
              </span>
            </div>
          </div>

          {getTypeBadge(change.type, duration)}
        </div>

        {/* Datos del turno */}
        <div className="bg-malon-bg/60 border border-malon-surface/60 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="flex items-center space-x-1.5 text-malon-sand">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {change.day_name} {change.target_date.split('-').slice(1).reverse().join('/')}
              </span>
            </span>
            <span className="font-mono text-white flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-malon-muted" />
              <span>
                {change.start_time} - {change.end_time} hs ({duration}hs)
              </span>
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
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-malon-sand font-semibold flex items-center space-x-1">
                  <Handshake className="w-3.5 h-3.5" />
                  <span>Tomado por: {change.claimed_by_name}</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Pendiente Confirmación
                </span>
              </div>

              {isMyRequest ? (
                <div className="space-y-2 bg-malon-surface/50 border border-malon-surface rounded-xl p-3">
                  <p className="text-[11px] font-bold text-white">
                    ¿Cómo acordaron compensar estas {duration}hs?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opción 1: Devolver con trabajo */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCompensation(prev => ({ ...prev, [change.id]: 'work' }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                        currentCompChoice === 'work'
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                          : 'bg-malon-card border-malon-surface text-malon-muted hover:text-white'
                      }`}
                    >
                      <ArrowRightLeft
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          currentCompChoice === 'work' ? 'text-cyan-400' : 'text-malon-muted'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold">Devolver con trabajo</p>
                        <p className="text-[10px] text-malon-muted leading-tight mt-0.5">
                          Le devolverás las horas cubriendo un turno. No altera la liquidación (0hs delta).
                        </p>
                      </div>
                    </button>

                    {/* Opción 2: Pagar las horas */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCompensation(prev => ({ ...prev, [change.id]: 'pay' }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                        currentCompChoice === 'pay'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                          : 'bg-malon-card border-malon-surface text-malon-muted hover:text-white'
                      }`}
                    >
                      <DollarSign
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          currentCompChoice === 'pay' ? 'text-emerald-400' : 'text-malon-muted'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold">Pagar horas</p>
                        <p className="text-[10px] text-malon-muted leading-tight mt-0.5">
                          Se computan en la liquidación mensual (+{duration}hs a {change.claimed_by_name}, -{duration}hs a vos).
                        </p>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => confirmShiftChange(change.id, currentCompChoice)}
                    className="w-full mt-2 bg-malon-red hover:bg-malon-red-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-malon-red/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Confirmar Cambio ({currentCompChoice === 'work' ? 'Devolver con trabajo' : 'Pagar horas'})
                    </span>
                  </button>
                </div>
              ) : (
                isClaimedByMe && (
                  <div className="bg-malon-surface/40 border border-malon-surface rounded-xl p-2.5 text-center">
                    <p className="text-xs text-malon-sand font-semibold">
                      ¡Tomaste este turno!
                    </p>
                    <p className="text-[11px] text-malon-muted mt-0.5">
                      Esperando que {change.requester_name} confirme el cambio y elija la modalidad (devolver con trabajo o pagar horas).
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Estado Confirmado */}
          {change.status === 'confirmed' && (
            <div className="w-full space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isClaimedByMe
                      ? `Confirmado: Cubrís a ${change.requester_name}`
                      : `Confirmado: Cubre ${change.claimed_by_name}`}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-malon-muted">
                  Listo en sistema
                </span>
              </div>

              {/* Modalidad de compensación acordada */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-malon-surface/40 border border-malon-surface">
                <span className="text-[11px] text-malon-muted">Compensación:</span>
                {change.compensation_type === 'pay' ? (
                  <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-lg">
                    <span>💰</span> Pagar horas (+{duration}hs computadas)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded-lg">
                    <span>🤝</span> Devolver con trabajo (mano a mano)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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

      {/* Tabs principales de Navegación */}
      <div className="flex bg-malon-card border border-malon-surface rounded-xl p-1 gap-1">
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center truncate ${
            filter === 'open'
              ? 'bg-malon-surface text-malon-sand shadow-sm'
              : 'text-malon-muted hover:text-white'
          }`}
        >
          Disponibles ({openChanges.length})
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center truncate ${
            filter === 'mine'
              ? 'bg-malon-surface text-white shadow-sm'
              : 'text-malon-muted hover:text-white'
          }`}
        >
          Mis Pedidos / Tomados ({myTotalCount})
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center truncate ${
            filter === 'history'
              ? 'bg-malon-surface text-white shadow-sm'
              : 'text-malon-muted hover:text-white'
          }`}
        >
          Historial ({historyChanges.length})
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      {filter === 'open' && (
        <div className="space-y-3">
          {openChanges.length > 0 ? (
            openChanges.map(change => renderChangeCard(change))
          ) : (
            <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-8 text-center space-y-2">
              <Handshake className="w-8 h-8 text-malon-muted mx-auto opacity-40" />
              <h4 className="text-xs font-semibold text-white">
                No hay turnos disponibles en este momento
              </h4>
              <p className="text-[11px] text-malon-muted">
                Todos los turnos están cubiertos por el staff.
              </p>
            </div>
          )}
        </div>
      )}

      {filter === 'mine' && (
        <div className="space-y-4">
          {/* Subfiltro de Mis Pedidos / Pedidos Tomados */}
          <div className="flex bg-malon-card/70 border border-malon-surface/80 rounded-xl p-1 gap-1 text-[11px]">
            <button
              onClick={() => setMineSubFilter('all')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                mineSubFilter === 'all'
                  ? 'bg-malon-surface text-white shadow-sm'
                  : 'text-malon-muted hover:text-white'
              }`}
            >
              Todos ({myTotalCount})
            </button>
            <button
              onClick={() => setMineSubFilter('created')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1 ${
                mineSubFilter === 'created'
                  ? 'bg-malon-surface text-malon-sand shadow-sm'
                  : 'text-malon-muted hover:text-white'
              }`}
            >
              <Send className="w-3 h-3 text-malon-red" />
              <span>Realizados ({myCreatedChanges.length})</span>
            </button>
            <button
              onClick={() => setMineSubFilter('claimed')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1 ${
                mineSubFilter === 'claimed'
                  ? 'bg-malon-surface text-cyan-300 shadow-sm'
                  : 'text-malon-muted hover:text-white'
              }`}
            >
              <Handshake className="w-3 h-3 text-cyan-400" />
              <span>Tomados ({myClaimedChanges.length})</span>
            </button>
          </div>

          {myTotalCount === 0 ? (
            <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-malon-muted mx-auto opacity-40" />
              <h4 className="text-xs font-semibold text-white">
                No tenés pedidos ni turnos tomados
              </h4>
              <p className="text-[11px] text-malon-muted">
                Podés publicar un pedido para que te cubran o tomar un turno disponible de la bolsa.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Sección 1: Pedidos Realizados (Solicitados por mí) */}
              {(mineSubFilter === 'all' || mineSubFilter === 'created') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-malon-sand uppercase tracking-wider flex items-center space-x-1.5">
                      <Send className="w-3.5 h-3.5 text-malon-red" />
                      <span>Pedidos Realizados ({myCreatedChanges.length})</span>
                    </h4>
                    <span className="text-[10px] text-malon-muted">
                      Turnos que pediste ceder
                    </span>
                  </div>

                  {myCreatedChanges.length > 0 ? (
                    <div className="space-y-3">
                      {myCreatedChanges.map(change => renderChangeCard(change, 'created'))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-malon-card/40 border border-dashed border-malon-surface text-center text-xs text-malon-muted">
                      No publicaste ningún pedido de cambio.
                    </div>
                  )}
                </div>
              )}

              {/* Sección 2: Pedidos Tomados (Que acepté cubrir) */}
              {(mineSubFilter === 'all' || mineSubFilter === 'claimed') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Handshake className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pedidos Tomados ({myClaimedChanges.length})</span>
                    </h4>
                    <span className="text-[10px] text-malon-muted">
                      Turnos que aceptaste cubrir a compañeros
                    </span>
                  </div>

                  {myClaimedChanges.length > 0 ? (
                    <div className="space-y-3">
                      {myClaimedChanges.map(change => renderChangeCard(change, 'claimed'))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-malon-card/40 border border-dashed border-malon-surface text-center text-xs text-malon-muted">
                      No tomaste turnos de compañeros aún.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {filter === 'history' && (
        <div className="space-y-3">
          {historyChanges.length > 0 ? (
            historyChanges.map(change => renderChangeCard(change))
          ) : (
            <div className="bg-malon-card/50 border border-dashed border-malon-surface rounded-2xl p-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-malon-muted mx-auto opacity-40" />
              <h4 className="text-xs font-semibold text-white">
                Historial vacío
              </h4>
              <p className="text-[11px] text-malon-muted">
                Los cambios confirmados o en proceso figurarán aquí.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
