import React from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, LayoutGrid, ArrowLeftRight } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, shiftChanges } = useApp();

  // Cambios disponibles abiertos
  const openChangesCount = shiftChanges.filter(c => c.status === 'open').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-malon-bg/95 backdrop-blur-lg border-t border-malon-surface pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto grid grid-cols-3 px-2 py-1.5">
        {/* Tab 1: Mi Grilla */}
        <button
          onClick={() => setActiveTab('mi-grilla')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'mi-grilla'
              ? 'text-malon-white font-bold bg-malon-surface/60'
              : 'text-malon-muted hover:text-malon-white'
          }`}
        >
          <div className="relative">
            <UserCheck className={`w-5 h-5 ${activeTab === 'mi-grilla' ? 'text-malon-sand' : ''}`} />
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Mi Grilla</span>
        </button>

        {/* Tab 2: General */}
        <button
          onClick={() => setActiveTab('general')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'general'
              ? 'text-malon-white font-bold bg-malon-surface/60'
              : 'text-malon-muted hover:text-malon-white'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${activeTab === 'general' ? 'text-malon-red' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight">General</span>
        </button>

        {/* Tab 3: Cambios */}
        <button
          onClick={() => setActiveTab('cambios')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
            activeTab === 'cambios'
              ? 'text-malon-white font-bold bg-malon-surface/60'
              : 'text-malon-muted hover:text-malon-white'
          }`}
        >
          <div className="relative">
            <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'cambios' ? 'text-malon-sand' : ''}`} />
            {openChangesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-malon-red text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                {openChangesCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Cambios</span>
        </button>
      </div>
    </nav>
  );
};
