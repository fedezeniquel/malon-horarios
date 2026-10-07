import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { MONTH_NAMES } from '../../lib/guardRotation';
import { calculateMonthlyAudit } from '../../lib/hoursAudit';

export const MonthlyAuditModal: React.FC = () => {
  const {
    isAuditModalOpen,
    setIsAuditModalOpen,
    staff,
    shifts,
    saturdayGuards,
    shiftChanges,
  } = useApp();

  const today = new Date();
  const [year, setYear] = useState<number>(() => today.getFullYear());
  const [month, setMonth] = useState<number>(() => today.getMonth());
  const [copied, setCopied] = useState<boolean>(false);

  if (!isAuditModalOpen) return null;

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(prev => prev - 1);
    } else {
      setMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(prev => prev + 1);
    } else {
      setMonth(prev => prev + 1);
    }
  };

  const handleResetCurrentMonth = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const auditData = calculateMonthlyAudit(year, month, staff, shifts, saturdayGuards, shiftChanges);

  const totalGymHours = auditData.reduce((acc, c) => acc + c.totalMonthlyHours, 0);
  const activeCoachesCount = auditData.filter(c => c.totalMonthlyHours > 0).length;
  const averageHoursPerCoach = activeCoachesCount > 0
    ? (totalGymHours / activeCoachesCount).toFixed(1)
    : '0';

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const handleCopySummary = () => {
    const lines = [
      `📋 RESUMEN AUDITORÍA MENSUAL - MALÓN EN MOVIMIENTO`,
      `Período: ${MONTH_NAMES[month]} ${year}`,
      `--------------------------------------------------`,
      ...auditData.map(c => {
        let details = `• ${c.coachName.padEnd(12)}: ${c.totalMonthlyHours} hs mes (Semanal: ${c.weeklyHours} hs/sem)`;
        if (c.saturdayMonthlyHours > 0) {
          details += ` [Inc. ${c.saturdayMonthlyHours} hs guardias]`;
        }
        if (c.shiftChangesDelta !== 0) {
          details += ` [Reemplazos: ${c.shiftChangesDelta > 0 ? '+' : ''}${c.shiftChangesDelta} hs]`;
        }
        return details;
      }),
      `--------------------------------------------------`,
      `TOTAL GENERAL: ${totalGymHours.toFixed(1)} hs trabajadas`,
      `Coaches activos: ${activeCoachesCount} | Promedio: ${averageHoursPerCoach} hs/coach`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-malon-card border-t sm:border border-malon-surface rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-malon-surface flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-malon-red/20 border border-malon-red/40 flex items-center justify-center text-malon-red shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Auditoría Mensual de Horas</h3>
                <span className="bg-malon-red text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-malon-muted">
                Cierre de mes y control para liquidación de profes
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="text-malon-muted hover:text-white p-1 rounded-full bg-malon-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Navegador de Mes y Año */}
          <div className="bg-malon-bg/80 border border-malon-surface rounded-2xl p-3 flex items-center justify-between shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-malon-surface text-malon-muted hover:text-white hover:bg-malon-surface/80 transition-all"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-base font-black text-white uppercase tracking-wider">
                  {MONTH_NAMES[month]} {year}
                </span>
                {!isCurrentMonth && (
                  <button
                    onClick={handleResetCurrentMonth}
                    className="p-1 rounded-md text-malon-sand hover:text-white hover:bg-malon-surface transition-all"
                    title="Ir al mes actual"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-malon-muted">
                {isCurrentMonth ? 'Mes en curso' : 'Histórico / Proyectado'}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-malon-surface text-malon-muted hover:text-white hover:bg-malon-surface/80 transition-all"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjetas de Métricas Globales */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-malon-surface/50 border border-malon-surface rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-malon-muted uppercase tracking-wider block font-semibold">
                Total Gimnasio
              </span>
              <span className="text-xl font-black text-malon-sand mt-0.5 block">
                {totalGymHours} hs
              </span>
              <span className="text-[9px] text-malon-muted">en el mes</span>
            </div>

            <div className="bg-malon-surface/50 border border-malon-surface rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-malon-muted uppercase tracking-wider block font-semibold">
                Coaches Activos
              </span>
              <span className="text-xl font-black text-white mt-0.5 block">
                {activeCoachesCount}
              </span>
              <span className="text-[9px] text-malon-muted">con carga</span>
            </div>

            <div className="bg-malon-surface/50 border border-malon-surface rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-malon-muted uppercase tracking-wider block font-semibold">
                Promedio
              </span>
              <span className="text-xl font-black text-white mt-0.5 block">
                {averageHoursPerCoach} hs
              </span>
              <span className="text-[9px] text-malon-muted">por coach</span>
            </div>
          </div>

          {/* Botón copiar reporte para liquidación */}
          <button
            onClick={handleCopySummary}
            className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-malon-card hover:bg-malon-surface/80 border-malon-sand/40 text-malon-sand hover:text-white shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Resumen Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Resumen para Liquidación / WhatsApp</span>
              </>
            )}
          </button>

          {/* Lista Detallada de Profesores */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-malon-sand uppercase tracking-wider">
                Desglose por Coach
              </span>
              <span className="text-[10px] text-malon-muted">
                Semanal vs Total Mes
              </span>
            </div>

            {auditData.map(c => (
              <div
                key={c.coachId}
                className="bg-malon-bg/70 border border-malon-surface/80 rounded-2xl p-3.5 space-y-2.5 hover:border-malon-sand/40 transition-all"
              >
                {/* Encabezado del coach */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-malon-surface border border-malon-sand/30 flex items-center justify-center text-malon-sand font-black text-xs shadow-inner">
                      {c.initials}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {c.coachName}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-malon-surface text-malon-muted border border-malon-surface">
                          {c.role === 'admin' ? 'Jefe' : c.role === 'coach_admin' ? 'Coach Admin' : 'Coach'}
                        </span>
                      </div>
                      <span className="text-[11px] text-malon-muted font-medium">
                        Carga base: <strong className="text-white font-mono">{c.weeklyHours} hs/sem</strong>
                      </span>
                    </div>
                  </div>

                  {/* Total mensual destacado */}
                  <div className="text-right">
                    <div className="flex items-baseline space-x-1 justify-end">
                      <span className="text-xl font-black text-malon-sand font-mono">
                        {c.totalMonthlyHours}
                      </span>
                      <span className="text-xs font-bold text-white">hs</span>
                    </div>
                    <span className="text-[10px] text-malon-muted uppercase tracking-wider font-semibold">
                      Total Mes
                    </span>
                  </div>
                </div>

                {/* Desglose de horas del mes */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-malon-surface/60 text-[11px]">
                  <div className="bg-malon-card/60 p-2 rounded-lg border border-malon-surface/40">
                    <span className="text-malon-muted block text-[10px]">Lun a Vie</span>
                    <span className="font-mono font-bold text-white">{c.regularMonthlyHours} hs</span>
                  </div>

                  <div className="bg-malon-card/60 p-2 rounded-lg border border-malon-surface/40">
                    <span className="text-malon-muted block text-[10px]">
                      Sábados ({c.saturdayDates.length})
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {c.saturdayMonthlyHours > 0 ? `+${c.saturdayMonthlyHours} hs` : '0 hs'}
                    </span>
                  </div>

                  <div className="bg-malon-card/60 p-2 rounded-lg border border-malon-surface/40">
                    <span className="text-malon-muted block text-[10px]">Reemplazos</span>
                    <span
                      className={`font-mono font-bold ${
                        c.shiftChangesDelta > 0
                          ? 'text-emerald-400'
                          : c.shiftChangesDelta < 0
                          ? 'text-red-400'
                          : 'text-malon-muted'
                      }`}
                    >
                      {c.shiftChangesDelta > 0 ? `+${c.shiftChangesDelta}` : `${c.shiftChangesDelta}`} hs
                    </span>
                  </div>
                </div>

                {/* Sábados asignados si tiene */}
                {c.saturdayDates.length > 0 && (
                  <div className="pt-1 flex items-center space-x-1.5 text-[10px] text-malon-sand">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Guardias cubiertas: {c.saturdayDates.map(d => d.split('-').slice(1).reverse().join('/')).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-malon-surface bg-malon-card flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-malon-muted">
            <ShieldCheck className="w-4 h-4 text-malon-sand" />
            <span>Auditoría generada conforme al calendario real</span>
          </div>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="bg-malon-surface hover:bg-malon-surface/80 text-white px-4 py-2 rounded-xl font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
