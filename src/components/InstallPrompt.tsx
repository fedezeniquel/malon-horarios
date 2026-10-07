import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada / corriendo en modo standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detectar iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIosDevice);

    // Capturar el evento de instalación nativo (Chromium / Android / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Si ya está instalada o el usuario lo cerró en esta sesión, no mostrar
  if (isStandalone || dismissed) {
    return null;
  }

  // Si no hay prompt nativo disponible y no es iOS, no mostrar nada innecesario
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <aside aria-label="Instalar aplicación" className="bg-gradient-to-r from-malon-card to-[#1F1E24] border border-malon-border rounded-xl p-3 mb-4 shadow-lg flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#0B0B0C] border border-malon-red/40 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-malon-sand font-bold text-base tracking-tighter">M</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white tracking-wide truncate">
              Instalar Malón en tu dispositivo
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              Accedé directo sin abrir el navegador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-malon-red hover:bg-malon-red-hover active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
            title="Cerrar aviso"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Modal / Guía paso a paso para iOS */}
      {showIOSGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-malon-card border border-malon-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-malon-sand text-lg">🍎</span>
                <h3 className="text-base font-bold text-white">Instalar en iPhone o iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Safari no instala aplicaciones automáticamente con un botón, pero podés agregarla a tu pantalla de inicio en 2 pasos:
            </p>

            <ol className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-center gap-2.5 bg-malon-bg/60 p-2.5 rounded-lg border border-malon-border/60">
                <span className="w-5 h-5 rounded-full bg-malon-red/20 text-malon-sand flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Tocá el botón <strong>Compartir</strong> en la barra de Safari (el ícono <svg className="w-4 h-4 inline text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> o <span className="font-mono text-blue-400">⎋</span>).</span>
              </li>
              <li className="flex items-center gap-2.5 bg-malon-bg/60 p-2.5 rounded-lg border border-malon-border/60">
                <span className="w-5 h-5 rounded-full bg-malon-red/20 text-malon-sand flex items-center justify-center font-bold text-[11px]">2</span>
                <span>Deslizá hacia abajo y seleccioná <strong>"Agregar a Inicio"</strong> (Add to Home Screen ➕).</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-malon-red hover:bg-malon-red-hover text-white text-xs font-semibold rounded-lg transition-all"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
