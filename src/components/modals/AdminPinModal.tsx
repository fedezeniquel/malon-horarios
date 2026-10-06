import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, X, Delete, Check } from 'lucide-react';

export const AdminPinModal: React.FC = () => {
  const { isPinModalOpen, setIsPinModalOpen, verifyAdminPin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isPinModalOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        // Validar PIN automáticamente
        const success = verifyAdminPin(nextPin);
        if (success) {
          setPin('');
          setIsPinModalOpen(false);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClose = () => {
    setPin('');
    setError(false);
    setIsPinModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-malon-card border border-malon-surface rounded-2xl w-full max-w-xs p-6 shadow-2xl relative text-center">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ícono de seguridad */}
        <div className="w-12 h-12 rounded-full bg-malon-red/10 border border-malon-red/30 mx-auto flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-malon-red" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">Acceso PIN JEFE</h3>
        <p className="text-xs text-malon-muted mb-6">
          Ingresá el PIN maestro para gestionar turnos y permisos
        </p>

        {/* Visualizador de dígitos */}
        <div className="flex justify-center space-x-3 mb-6">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                error
                  ? 'bg-malon-red scale-110'
                  : pin.length > idx
                  ? 'bg-malon-sand scale-105'
                  : 'bg-malon-surface border border-malon-surface'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-malon-red font-semibold mb-3 animate-shake">
            PIN incorrecto. Intenta nuevamente.
          </p>
        )}

        {/* Teclado numérico táctil */}
        <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-xl bg-malon-surface/60 hover:bg-malon-surface active:bg-malon-sand/20 text-white font-bold text-lg transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="h-12" />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-malon-surface/60 hover:bg-malon-surface active:bg-malon-sand/20 text-white font-bold text-lg transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-malon-surface/30 hover:bg-malon-surface active:bg-malon-red/20 text-malon-muted hover:text-white transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[10px] text-malon-muted/60 mt-4">
          PIN maestro por defecto: 1234
        </p>
      </div>
    </div>
  );
};
