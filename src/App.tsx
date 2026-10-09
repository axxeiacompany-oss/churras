import React from 'react';
import { useChurras } from './context/ChurrasContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { RoleSelectorBar } from './components/layout/RoleSelectorBar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CashierDashboard } from './components/cashier/CashierDashboard';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { KitchenKdsDashboard } from './components/kitchen/KitchenKdsDashboard';
import {
  Flame,
  LogOut,
  ShieldAlert,
  Wallet,
  UtensilsCrossed,
  ChefHat,
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, logout, settings, toasts, removeToast } = useChurras();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center">
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/40">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-stone-100">
                  {settings.name}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
                CNPJ: {settings.cnpj}
              </p>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-stone-950 border border-stone-800 rounded-xl py-1 px-2.5">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-stone-200 block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-amber-500 font-medium font-mono">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-stone-950 hover:bg-red-950/40 border border-stone-800 hover:border-red-800 text-stone-400 hover:text-red-400 transition cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher Toolbar */}
      <div className="bg-stone-900/60 border-b border-stone-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <RoleSelectorBar />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentUser.role === 'ADMIN' && <AdminDashboard />}
        {currentUser.role === 'CAIXA' && <CashierDashboard />}
        {currentUser.role === 'GARCOM' && <WaiterDashboard />}
        {currentUser.role === 'COZINHA' && <KitchenKdsDashboard />}
      </main>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl flex items-start gap-2.5 text-xs transition animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-stone-900/95 border-emerald-500/50 text-emerald-300'
                : t.type === 'error'
                ? 'bg-stone-900/95 border-red-500/50 text-red-300'
                : t.type === 'warning'
                ? 'bg-stone-900/95 border-amber-500/50 text-amber-300'
                : 'bg-stone-900/95 border-stone-700 text-stone-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : t.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 text-stone-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default App;
