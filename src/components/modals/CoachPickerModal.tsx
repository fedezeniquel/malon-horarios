import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, ShieldCheck } from 'lucide-react';
import type { StaffMember } from '../../types';

export const CoachPickerModal: React.FC = () => {
  const { staff, currentCoach, setCurrentCoach, isCoachPickerOpen, setIsCoachPickerOpen } = useApp();

  if (!isCoachPickerOpen) return null;

  const handleSelectCoach = (coach: StaffMember) => {
    setCurrentCoach(coach);
    setIsCoachPickerOpen(false);
  };

  const getRoleLabel = (role: StaffMember['role']) => {
    switch (role) {
      case 'admin':
        return { text: 'Admin', color: 'bg-malon-red/20 text-malon-red border-malon-red/30' };
      case 'coach_admin':
        return { text: 'Coach Admin', color: 'bg-malon-sand/20 text-malon-sand border-malon-sand/30' };
      case 'coach':
        return { text: 'Coach', color: 'bg-malon-surface text-malon-muted border-malon-surface' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header del Modal */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">¿Quién sos?</h3>
            <p className="text-xs text-malon-muted">
              Seleccioná tu perfil para ver tus turnos y pedir cambios
            </p>
          </div>
          <button
            onClick={() => setIsCoachPickerOpen(false)}
            className="text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de coaches */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {staff.map(member => {
            const isSelected = member.id === currentCoach.id;
            const roleInfo = getRoleLabel(member.role);

            return (
              <button
                key={member.id}
                onClick={() => handleSelectCoach(member)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-malon-surface border-malon-sand shadow-sm'
                    : 'bg-malon-card hover:bg-malon-surface/50 border-malon-surface/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-malon-sand text-black'
                        : 'bg-malon-surface text-malon-white'
                    }`}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {member.name}
                      {member.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-malon-red" />}
                    </h4>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border inline-block mt-0.5 ${roleInfo.color}`}
                    >
                      {roleInfo.text}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-malon-sand/20 text-malon-sand flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-malon-surface bg-malon-bg/40 text-center">
          <p className="text-[11px] text-malon-muted">
            Queda guardado en tu teléfono. Podés cambiarlo cuando quieras.
          </p>
        </div>
      </div>
    </div>
  );
};
