import React from 'react';
import { useApp } from '../../context/AppContext';
import { isPushSupported, getPushPermission, requestPushPermission } from '../../lib/notifications';
import type { AppNotification } from '../../types';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    setActiveTab,
    currentCoach,
  } = useApp();

  const [pushStatus, setPushStatus] = React.useState<NotificationPermission>(getPushPermission());

  if (!isNotificationsModalOpen) return null;

  // Filtrar avisos dirigidos al coach activo o generales
  const relevantNotifications = notifications.filter(
    n => !n.target_coach_id || n.target_coach_id === currentCoach.id
  );

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const handleRequestPush = async () => {
    const perm = await requestPushPermission();
    setPushStatus(perm);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.link_tab) {
      setActiveTab(notif.link_tab);
    }
    setIsNotificationsModalOpen(false);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return 'Hace un momento';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      return `${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs`;
    } catch {
      return '';
    }
  };

  const getBadgeStyle = (type: AppNotification['type']) => {
    switch (type) {
      case 'shift_change_request':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          label: 'SOLICITUD DE CAMBIO',
        };
      case 'shift_change_claimed':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          label: 'CAMBIO TOMADO',
        };
      case 'shift_reminder':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          label: 'RECORDATORIO DE TURNO',
        };
      case 'saturday_guard_reminder':
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          label: 'HORARIO DE SÁBADO',
        };
      case 'holiday_assignment':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          label: 'ASIGNACIÓN FERIADO',
        };
      case 'holiday_reminder':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          label: 'RECORDATORIO FERIADO',
        };
      default:
        return {
          bg: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
          label: 'AVISO',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Cabecera del Centro de Notificaciones */}
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-gray-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Centro de Notificaciones
              </h2>
              <p className="text-xs text-gray-400">
                Avisos y recordatorios operativos de Malón
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsModalOpen(false)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/80 transition-colors"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Banner de Push si no está concedido */}
        {isPushSupported() && pushStatus !== 'granted' && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-orange-950/40 border border-orange-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📲</span>
              <div className="text-xs">
                <p className="font-semibold text-orange-200">Activar Notificaciones Push</p>
                <p className="text-orange-300/70">Recibí avisos en tu celular o pantalla cuando estés fuera de la app</p>
              </div>
            </div>
            <button
              onClick={handleRequestPush}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow transition shrink-0"
            >
              Habilitar
            </button>
          </div>
        )}

        {/* Acciones rápidas (Marcar leídas / vaciar) */}
        {relevantNotifications.length > 0 && (
          <div className="px-5 py-2.5 bg-gray-900/50 border-b border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
            <span>{relevantNotifications.length} {relevantNotifications.length === 1 ? 'notificación' : 'notificaciones'}</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="hover:text-amber-400 transition-colors font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
              <button
                onClick={clearNotifications}
                className="hover:text-red-400 transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        )}

        {/* Lista de Notificaciones */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-gray-800/40">
          {relevantNotifications.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/60 flex items-center justify-center text-3xl mb-3 text-gray-500">
                🔕
              </div>
              <p className="font-medium text-gray-300">No tenés avisos pendientes</p>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Acá vas a ver avisos sobre solicitudes de cambios tomadas, tu sábado asignado y turnos de feriados.
              </p>
            </div>
          ) : (
            relevantNotifications.map(notif => {
              const badge = getBadgeStyle(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`pt-2.5 first:pt-0 cursor-pointer group transition-all rounded-xl p-3 ${
                    notif.read
                      ? 'bg-gray-800/30 hover:bg-gray-800/60 opacity-80'
                      : 'bg-gray-800/70 border-l-4 border-l-amber-500 hover:bg-gray-800 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 group-hover:text-gray-400 shrink-0">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors mt-1">
                    {notif.title}
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.link_tab && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <span>Ver detalles en la pestaña</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-950/80 border-t border-gray-800 text-center">
          <button
            onClick={() => setIsNotificationsModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
