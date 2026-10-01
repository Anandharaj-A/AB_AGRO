import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HarvesterProvider, useHarvester, ScreenType } from './context/HarvesterContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { WorkList } from './components/WorkList';
import { AddWork } from './components/AddWork';
import { AddExpense } from './components/AddExpense';
import { ExpenseList } from './components/ExpenseList';
import { DriverManagement } from './components/DriverManagement';
import { MachineCarePage } from './components/MachineCarePage';
import { AdminSettingsPage } from './components/AdminSettingsPage';
import { ActivityLogPage } from './components/ActivityLogPage';
import { ReportsScreen } from './components/ReportsScreen';
import { LoginScreen } from './components/LoginScreen';
import { HarvesterLogo } from './components/HarvesterLogo';

const MainAppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { currentScreen, setCurrentScreen } = useHarvester();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 flex items-center justify-center animate-pulse">
          <HarvesterLogo className="w-16 h-16" />
        </div>
        <div className="flex items-center gap-2 text-secondary font-bold text-sm">
          <span className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
          <span>Loading Harvester Book...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const isFormScreen = currentScreen === 'add-work' || currentScreen === 'add-expense';
  const isSubScreen =
    isFormScreen ||
    currentScreen === 'admin-settings' ||
    currentScreen === 'activity-log' ||
    currentScreen === 'machine-care';

  const handleBack = () => {
    if (currentScreen === 'add-work') {
      setCurrentScreen('work-list');
    } else if (currentScreen === 'add-expense') {
      setCurrentScreen('expense-list');
    } else {
      setCurrentScreen('home-dashboard');
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased flex flex-col min-h-screen selection:bg-primary-fixed">
      {/* Top Fixed Header with role badge, settings, and profile controls */}
      <Header
        showBack={isSubScreen}
        onBack={handleBack}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-safe bg-surface">
        {currentScreen === 'home-dashboard' && <HomeDashboard />}
        {currentScreen === 'work-list' && <WorkList />}
        {currentScreen === 'add-work' && <AddWork />}
        {currentScreen === 'add-expense' && <AddExpense />}
        {currentScreen === 'expense-list' && <ExpenseList />}
        {currentScreen === 'driver-management' && <DriverManagement />}
        {currentScreen === 'machine-care' && <MachineCarePage />}
        {currentScreen === 'admin-settings' && <AdminSettingsPage />}
        {currentScreen === 'activity-log' && <ActivityLogPage />}
        {currentScreen === 'reports' && <ReportsScreen />}
      </main>

      {/* Fixed Bottom Navigation Bar (Hidden on full forms or special admin screens) */}
      {!isFormScreen && currentScreen !== 'admin-settings' && currentScreen !== 'activity-log' && (
        <BottomNav />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HarvesterProvider>
        <MainAppContent />
      </HarvesterProvider>
    </AuthProvider>
  );
}
