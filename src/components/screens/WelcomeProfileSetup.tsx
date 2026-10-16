import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Check, ArrowRight, Smartphone, CheckSquare, Square } from 'lucide-react';
import type { StaffMember } from '../../types';

export const WelcomeProfileSetup: React.FC = () => {
  const { staff, loginCoach } = useApp();
  const [selectedCoach, setSelectedCoach] = useState<StaffMember>(staff[0]);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  const getRoleLabel = (role: StaffMember['role']) => {
    switch (role) {
      case 'admin':
        return { text: 'Jefe / Admin', color: 'bg-malon-red/20 text-malon-red border-malon-red/40' };
      case 'coach_admin':
        return { text: 'Coach Admin', color: 'bg-malon-sand/20 text-malon-sand border-malon-sand/40' };
      case 'coach':
        return { text: 'Coach', color: 'bg-malon-surface text-malon-muted border-malon-surface' };
    }
  };

  const handleConfirm = () => {
    loginCoach(selectedCoach, rememberDevice);
  };

  return (
    <div className="min-h-screen bg-malon-bg text-malon-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* Encabezado con Identidad Malón */}
        <div className="text-center pt-4 pb-6 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-malon-red text-white text-3xl font-black shadow-xl shadow-malon-red/30 tracking-tighter">
            M
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white uppercase">
              MALÓN
            </h1>
            <p className="text-xs font-semibold text-malon-sand tracking-widest uppercase">
              Horarios & Staff
            </p>
          </div>

          <div className="pt-2 px-2">
            <h2 className="text-lg font-bold text-white">
              ¿Quién está usando este teléfono?
            </h2>
            <p className="text-xs text-malon-muted mt-1 leading-relaxed">
              Elegí tu perfil para ver tus turnos asignados, guardias de sábado y gestionar la bolsa de cambios.
            </p>
          </div>
        </div>

        {/* Lista de Coaches */}
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[48vh] pr-1 pb-2">
          {staff.map(member => {
            const isSelected = selectedCoach.id === member.id;
            const roleInfo = getRoleLabel(member.role);

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedCoach(member)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'bg-malon-surface border-malon-sand shadow-lg shadow-black/40 scale-[1.01]'
                    : 'bg-malon-card/80 hover:bg-malon-surface/50 border-malon-surface/70'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm transition-colors ${
                      isSelected
                        ? 'bg-malon-sand text-black'
                        : 'bg-malon-surface text-malon-sand'
                    }`}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {member.name}
                      {member.role === 'admin' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-malon-red" />
                      )}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-1 ${roleInfo.color}`}
                    >
                      {roleInfo.text}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-malon-sand text-black font-bold'
                      : 'border border-malon-surface/80 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Opciones y Botón de Confirmación */}
        <div className="pt-4 pb-2 space-y-3">
          {/* Opción Recordar en este celular */}
          <button
            type="button"
            onClick={() => setRememberDevice(!rememberDevice)}
            className="w-full flex items-start space-x-3 p-3 rounded-xl bg-malon-card border border-malon-surface text-left transition-colors hover:border-malon-sand/40"
          >
            <div className="pt-0.5 text-malon-sand">
              {rememberDevice ? (
                <CheckSquare className="w-5 h-5 text-malon-sand" />
              ) : (
                <Square className="w-5 h-5 text-malon-muted" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-malon-sand" />
                Recordar mi perfil en este dispositivo
              </span>
              <p className="text-[11px] text-malon-muted mt-0.5">
                Entrarás directo a tu cuenta sin tener que volver a elegir tu nombre cada vez que abras la app.
              </p>
            </div>
          </button>

          {/* Botón Ingresar */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-malon-red hover:bg-malon-red-hover active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl shadow-xl shadow-malon-red/25 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span>Ingresar como {selectedCoach.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-center text-malon-muted">
            Podés cambiar de perfil o desvincular el celular en cualquier momento desde el menú superior.
          </p>
        </div>
      </div>
    </div>
  );
};
