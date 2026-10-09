import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import {
  Flame,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ShieldCheck,
  UtensilsCrossed,
  UserCheck,
  Delete,
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, loginWithPin, employees } = useChurras();

  // Primary separation: ADMIN vs FUNCIONÁRIO
  const [loginType, setLoginType] = useState<'ADMIN' | 'FUNCIONARIO'>('ADMIN');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState<string>('admin@churrascaria.com');
  const [adminPassword, setAdminPassword] = useState<string>('admin');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);

  // Funcionário / Garçom PIN state
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const waiter = employees.find((e) => e.role === 'GARCOM' && e.active);
    return waiter ? waiter.id : employees[0]?.id || '';
  });
  const [staffPinDigits, setStaffPinDigits] = useState<string>('');

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Admin Email/Password Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = loginWithEmail(adminEmail, adminPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Credenciais de Administrador inválidas.');
    }
  };

  // Handle Waiter PIN Submit
  const handleStaffPinInput = (digit: string) => {
    setErrorMessage(null);
    if (staffPinDigits.length < 4) {
      const nextPin = staffPinDigits + digit;
      setStaffPinDigits(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          const res = loginWithPin(nextPin);
          if (!res.success) {
            setErrorMessage(res.error || 'PIN de funcionário incorreto.');
            setStaffPinDigits('');
          }
        }, 120);
      }
    }
  };

  const handleStaffBackspace = () => {
    setErrorMessage(null);
    setStaffPinDigits((prev) => prev.slice(0, -1));
  };

  const handleStaffClear = () => {
    setErrorMessage(null);
    setStaffPinDigits('');
  };

  const handleSelectStaff = (empId: string, empPin: string) => {
    setSelectedStaffId(empId);
    setStaffPinDigits(empPin);
    setErrorMessage(null);
    setTimeout(() => {
      const res = loginWithPin(empPin);
      if (!res.success) {
        setErrorMessage(res.error || 'PIN incorreto.');
        setStaffPinDigits('');
      }
    }, 120);
  };

  const activeWaiters = employees.filter(
    (e) => e.role === 'GARCOM' && e.active
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-amber-600/15 via-red-600/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 shadow-xl shadow-orange-950/40 border border-orange-500/30">
            <Flame className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            CHURRASGESTÃO
          </h1>
          <p className="text-xs text-stone-400">
            Sistema Integrado de Gestão para Churrascaria
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
          {/* SEPARAÇÃO DE LOGIN: ADMIN vs FUNCIONÁRIO */}
          <div className="grid grid-cols-2 rounded-2xl bg-stone-950 p-1.5 border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginType('ADMIN');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginType === 'ADMIN'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType('FUNCIONARIO');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginType === 'FUNCIONARIO'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Funcionário / Garçom</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* 1. MODO ADMINISTRADOR */}
          {loginType === 'ADMIN' && (
            <div className="space-y-4">
              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acesso de Gestão Total</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Permissão total para cadastrar produtos com estoque, editar e excluir mesas, e gerar relatórios oficiais em PDF.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    E-mail do Administrador:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@churrascaria.com"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Senha de Acesso:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 text-[10px] font-semibold cursor-pointer"
                    >
                      {showAdminPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Entrar como Administrador</span>
                </button>
              </form>
            </div>
          )}

          {/* 2. MODO FUNCIONÁRIO / GARÇOM */}
          {loginType === 'FUNCIONARIO' && (
            <div className="space-y-4">
              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Terminal de Salão & Pedidos</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Acesso operacional para garçons: visualização de mesas e lançamento de pedidos.
                </p>
              </div>

              {/* Seleção do Garçom */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  Selecione o Garçom:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeWaiters.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectStaff(w.id, w.pin)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        selectedStaffId === w.id
                          ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-bold text-xs truncate">{w.name}</div>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                        PIN: {w.pin}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN Indicators */}
              <div className="text-center space-y-2 pt-1">
                <p className="text-[11px] text-stone-400">
                  Ou digite o PIN de 4 dígitos:
                </p>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = staffPinDigits.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                          filled
                            ? 'bg-amber-500 border-amber-400 scale-110 shadow-lg shadow-amber-500/50'
                            : 'bg-stone-800 border-stone-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleStaffPinInput(digit)}
                    className="h-11 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800/80 text-white font-mono font-bold text-base transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleStaffClear}
                  className="h-11 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800/80 text-stone-400 text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffPinInput('0')}
                  className="h-11 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800/80 text-white font-mono font-bold text-base transition active:scale-95 cursor-pointer shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleStaffBackspace}
                  className="h-11 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800/80 text-stone-400 flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Demo Access Bar */}
        <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Acesso Rápido de Demonstração:</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setLoginType('ADMIN');
                setAdminEmail('admin@churrascaria.com');
                setAdminPassword('admin');
                setTimeout(() => loginWithEmail('admin@churrascaria.com', 'admin'), 100);
              }}
              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 border border-amber-600/40 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Carlos Silveira</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">ADMIN (Acesso Total)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType('FUNCIONARIO');
                const waiter = employees.find((e) => e.role === 'GARCOM' && e.active) || employees[0];
                handleSelectStaff(waiter.id, waiter.pin);
              }}
              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-stone-200 font-bold">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                <span>Marcelo "Gaúcho"</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">GARÇOM (Salão/Pedidos)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
