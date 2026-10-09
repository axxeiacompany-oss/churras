import React from 'react';
import { ChurrasProvider, useChurras } from './context/ChurrasContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/layout/Header';
import { RoleSelectorBar } from './components/layout/RoleSelectorBar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CashierDashboard } from './components/cashier/CashierDashboard';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { KitchenKDS } from './components/kitchen/KitchenKDS';
import { Toast } from './components/common/Toast';
import { ShieldAlert, Wallet, UtensilsCrossed, ChefHat } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useChurras();

  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Role Navigation Bar */}
      <RoleSelectorBar />

      {/* Main Content Area - Auto redirected based on Profile */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentUser.role === 'ADMIN' && <AdminDashboard />}
        {currentUser.role === 'CAIXA' && <CashierDashboard />}
        {currentUser.role === 'GARCOM' && <WaiterDashboard />}
        {currentUser.role === 'COZINHA' && <KitchenKDS />}
      </main>

      {/* Footer Info */}
      <footer className="bg-stone-950 border-t border-stone-800/80 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-400">Brasa & Fogo Churrascaria ERP</span>
            <span>·</span>
            <span className="text-stone-300">Conectado como <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" /> Admin
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3 text-emerald-500" /> Caixa
            </span>
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3 text-blue-500" /> Garçom
            </span>
            <span className="flex items-center gap-1">
              <ChefHat className="w-3 h-3 text-orange-500" /> Cozinha/Grelha
            </span>
          </div>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ChurrasProvider>
      <AppContent />
    </ChurrasProvider>
  );
}
