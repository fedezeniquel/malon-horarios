import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, ShieldAlert, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentCoach, isAdminUnlocked, setIsPinModalOpen, setIsCoachPickerOpen, lockAdmin } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-malon-bg/95 backdrop-blur-md border-b border-malon-surface px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-malon-red flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-lg shadow-malon-red/20">
            M
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-malon-white uppercase leading-none">
              MALÓN
            </h1>
            <span className="text-[10px] font-semibold text-malon-sand uppercase tracking-widest leading-none">
              En Movimiento
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Coach identity switcher */}
          <button
            onClick={() => setIsCoachPickerOpen(true)}
            className="flex items-center space-x-1.5 bg-malon-card hover:bg-malon-surface border border-malon-surface px-2.5 py-1.5 rounded-full transition-all text-xs"
            title="Cambiar profesor activo"
          >
            <div className="w-5 h-5 rounded-full bg-malon-surface flex items-center justify-center text-[10px] font-bold text-malon-sand">
              {currentCoach.initials}
            </div>
            <span className="font-semibold text-malon-white max-w-[70px] truncate">
              {currentCoach.name}
            </span>
            <ChevronDown className="w-3 h-3 text-malon-muted" />
          </button>

          {/* PIN JEFE button */}
          {isAdminUnlocked ? (
            <button
              onClick={lockAdmin}
              className="flex items-center space-x-1 bg-malon-red/20 border border-malon-red text-malon-red hover:bg-malon-red/30 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm shadow-malon-red/10 animate-pulse"
              title="Modo Jefe activo. Clic para bloquear."
            >
              <ShieldAlert className="w-3.5 h-3.5 text-malon-red" />
              <span className="hidden sm:inline">JEFE</span>
              <span>🔒</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center space-x-1 bg-malon-card hover:bg-malon-surface border border-malon-surface text-malon-muted hover:text-malon-white px-2.5 py-1.5 rounded-full text-xs font-medium transition-all"
              title="Acceso administrativo con PIN"
            >
              <Shield className="w-3.5 h-3.5 text-malon-sand" />
              <span>PIN JEFE</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
