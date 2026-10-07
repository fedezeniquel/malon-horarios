import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MiGrilla } from './components/screens/MiGrilla';
import { General } from './components/screens/General';
import { Cambios } from './components/screens/Cambios';
import { AdminPinModal } from './components/modals/AdminPinModal';
import { CoachPickerModal } from './components/modals/CoachPickerModal';
import { CreateShiftChangeModal } from './components/modals/CreateShiftChangeModal';
import { EditShiftModal } from './components/modals/EditShiftModal';
import { EditGuardModal } from './components/modals/EditGuardModal';
import { MonthlyAuditModal } from './components/modals/MonthlyAuditModal';
import { ManageHolidayModal } from './components/modals/ManageHolidayModal';
import { InstallPrompt } from './components/InstallPrompt';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-malon-bg text-malon-white flex flex-col font-sans">
      {/* Barra superior con identidad Malón, selector de perfil y PIN Jefe */}
      <Header />

      {/* Contenido principal Mobile-First */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4">
        {/* Banner de instalación PWA (si está disponible) */}
        <InstallPrompt />

        {activeTab === 'mi-grilla' && <MiGrilla />}
        {activeTab === 'general' && <General />}
        {activeTab === 'cambios' && <Cambios />}
      </main>

      {/* Barra de navegación inferior */}
      <Navigation />

      {/* Modales globales */}
      <AdminPinModal />
      <CoachPickerModal />
      <CreateShiftChangeModal />
      <EditShiftModal />
      <EditGuardModal />
      <MonthlyAuditModal />
      <ManageHolidayModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
