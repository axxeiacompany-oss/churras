import React, { useState, useEffect } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { formatCurrency, getRoleLabel } from '../../utils/format';
import {
  Flame,
  ShieldAlert,
  Wallet,
  Users,
  UtensilsCrossed,
  ChefHat,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  LogOut,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    switchUser,
    logout,
    employees,
    cashSession,
    settings,
    updateSettings,
    resetDemoData,
    comandas,
  } = useChurras();

  const [time, setTime] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live cash drawer balance
  const cashInDrawer = cashSession.movements.reduce((acc, m) => {
    if (m.paymentMethod === 'DINHEIRO') {
      if (m.type === 'VENDA' || m.type === 'SUPRIMENTO') return acc + m.amount;
      if (m.type === 'SANGRIA' || m.type === 'ESTORNO') return acc - m.amount;
    }
    return acc;
  }, 0);

  // Count active orders and pending meat cuts
  const activeOrdersCount = comandas.filter((c) => c.status === 'ABERTA' || c.status === 'CONTA_SOLICITADA').length;
  const pendingKitchenDishes = comandas
    .flatMap((c) => c.items)
    .filter((i) => i.status === 'PENDENTE' || i.status === 'EM_PREPARO').length;

  if (!currentUser) return null;

  return (
    <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40 border border-orange-500/30">
              <Flame className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                  BRASA & FOGO
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-500 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  Churrascaria ERP
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Sistema Operacional Integrado · {time}
              </p>
            </div>
          </div>

          {/* Center Quick Indicators */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Cash Drawer Status */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-stone-800">
              <div className={`w-2.5 h-2.5 rounded-full ${cashSession.status === 'ABERTO' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400 leading-none">
                  Caixa {cashSession.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
                </div>
                <div className="text-xs font-mono font-semibold text-stone-200">
                  {cashSession.status === 'ABERTO' ? `Gaveta: ${formatCurrency(cashInDrawer)}` : 'Fechado'}
                </div>
              </div>
            </div>

            {/* Live Comandas & Kitchen Status */}
            <div className="flex items-center gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                <span><strong className="text-stone-100 font-semibold">{activeOrdersCount}</strong> comandas ativas</span>
              </div>
              <span className="text-stone-700">|</span>
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-orange-500" />
                <span><strong className="text-stone-100 font-semibold">{pendingKitchenDishes}</strong> na grelha/cozinha</span>
              </div>
            </div>
          </div>

          {/* Right Action & User Profile Switcher */}
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={() => updateSettings({ enableSoundAlerts: !settings.enableSoundAlerts })}
              title={settings.enableSoundAlerts ? 'Desativar sons' : 'Ativar sons'}
              className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors border border-stone-700/50"
            >
              {settings.enableSoundAlerts ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setShowConfirmReset(true)}
              title="Resetar dados para padrão de demonstração"
              className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors border border-stone-700/50"
            >
              <RotateCcw className="w-4 h-4 text-stone-400" />
            </button>

            {/* Role Profile Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-stone-950/90 hover:bg-stone-950 border border-stone-700 transition-all text-left shadow-sm"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-stone-700"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                    {getRoleLabel(currentUser.role)}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-stone-400 ml-1" />
              </button>

              {/* Dropdown Menu to switch user profile */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-stone-900 border border-stone-700 shadow-2xl z-50 overflow-hidden divide-y divide-stone-800">
                    <div className="px-4 py-3 bg-stone-950/60">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                        Troca Rápida de Perfil (Acesso)
                      </div>
                      <p className="text-xs text-stone-300">
                        Selecione um funcionário para alternar entre as visões do sistema:
                      </p>
                    </div>

                    <div className="p-2 space-y-1">
                      {employees.map((emp) => {
                        const isCurrent = emp.id === currentUser.id;
                        let roleIcon = Users;
                        if (emp.role === 'ADMIN') roleIcon = ShieldAlert;
                        if (emp.role === 'CAIXA') roleIcon = Wallet;
                        if (emp.role === 'GARCOM') roleIcon = UtensilsCrossed;
                        if (emp.role === 'COZINHA') roleIcon = ChefHat;

                        const Icon = roleIcon;

                        return (
                          <button
                            key={emp.id}
                            onClick={() => {
                              switchUser(emp.id);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                              isCurrent
                                ? 'bg-amber-600/20 border border-amber-600/40 text-amber-300'
                                : 'hover:bg-stone-800 text-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-7 h-7 rounded-md object-cover border border-stone-700"
                              />
                              <div>
                                <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                                  {emp.name}
                                </div>
                                <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                                  <Icon className="w-3 h-3 text-amber-500" />
                                  <span>{getRoleLabel(emp.role)}</span>
                                </div>
                              </div>
                            </div>
                            {isCurrent && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 bg-stone-950">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-stone-800/80 hover:bg-red-950/80 hover:text-red-300 text-stone-300 text-xs font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair / Trocar de Usuário</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct Logout Icon Button */}
            <button
              onClick={logout}
              title="Encerrar sessão"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-red-950 hover:text-red-400 text-stone-400 transition-colors border border-stone-700/50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Demo Data */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Restaurar Dados de Demonstração?</h3>
            <p className="text-sm text-stone-300 mb-6">
              Esta ação irá reiniciar o caixa, mesas, comandas e cardápio para o estado inicial demonstrativo da churrascaria.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
