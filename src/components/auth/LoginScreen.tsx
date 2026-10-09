import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { Flame, Lock, Mail, KeyRound, AlertCircle, ShieldAlert, Sparkles, Delete } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, loginWithPin, employees } = useChurras();

  const [authMode, setAuthMode] = useState<'PIN' | 'EMAIL'>('PIN');
  
  // PIN state
  const [pinDigits, setPinDigits] = useState<string>('');
  
  // Email state
  const [email, setEmail] = useState<string>('admin@churrascaria.com');
  const [password, setPassword] = useState<string>('admin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle PIN button click
  const handlePinInput = (digit: string) => {
    setErrorMessage(null);
    if (pinDigits.length < 4) {
      const nextPin = pinDigits + digit;
      setPinDigits(nextPin);
      if (nextPin.length === 4) {
        // Auto-submit when 4 digits are completed
        setTimeout(() => {
          const res = loginWithPin(nextPin);
          if (!res.success) {
            setErrorMessage(res.error || 'PIN incorreto.');
            setPinDigits('');
          }
        }, 120);
      }
    }
  };

  const handlePinBackspace = () => {
    setErrorMessage(null);
    setPinDigits((prev) => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setErrorMessage(null);
    setPinDigits('');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = loginWithEmail(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Credenciais inválidas.');
    }
  };

  // Quick fill helper
  const handleQuickFill = (empEmail: string, empPass: string, empPin: string) => {
    setErrorMessage(null);
    if (authMode === 'PIN') {
      setPinDigits(empPin);
      setTimeout(() => {
        const res = loginWithPin(empPin);
        if (!res.success) {
          setErrorMessage(res.error || 'PIN incorreto.');
          setPinDigits('');
        }
      }, 100);
    } else {
      setEmail(empEmail);
      setPassword(empPass);
    }
  };

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
            BRASA & FOGO
          </h1>
          <p className="text-xs text-stone-400">
            Sistema Integrado de Gestão para Churrascaria
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
          
          {/* Auth mode segmented tabs */}
          <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('PIN');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                authMode === 'PIN'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Rápido (Garçom / PDV)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('EMAIL');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                authMode === 'EMAIL'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail / Senha</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* TAB 1: PIN NUMERIC KEYPAD */}
          {authMode === 'PIN' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-xs text-stone-400">
                  Digite seu PIN numérico de 4 dígitos para acesso instantâneo:
                </p>

                {/* 4 PIN Indicators */}
                <div className="flex justify-center items-center gap-4 py-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pinDigits.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                          filled
                            ? 'bg-amber-500 scale-125 shadow-lg shadow-amber-500/50'
                            : 'border-2 border-stone-700 bg-stone-950'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Numeric Pad Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinInput(digit)}
                    className="h-13 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800/90 text-lg font-bold text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinClear}
                  className="h-13 rounded-2xl bg-stone-950 hover:bg-stone-850 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-all active:scale-95 flex items-center justify-center border border-stone-800/90"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => handlePinInput('0')}
                  className="h-13 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800/90 text-lg font-bold text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="h-13 rounded-2xl bg-stone-950 hover:bg-stone-850 text-stone-400 hover:text-stone-200 transition-all active:scale-95 flex items-center justify-center border border-stone-800/90"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL / PASSWORD */}
          {authMode === 'EMAIL' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  E-mail do Funcionário:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: admin@churrascaria.com"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Senha de Acesso:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[11px] text-stone-400 hover:text-stone-200 font-medium"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-950/40 active:scale-98 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Entrar no Sistema</span>
              </button>
            </form>
          )}

          {/* Restriction notice */}
          <div className="pt-3 border-t border-stone-800 text-center">
            <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Acesso restrito. Contas criadas exclusivamente pela gerência.</span>
            </p>
          </div>
        </div>

        {/* Fast Test Selector Bar for instant evaluation */}
        <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Acesso Rápido de Demonstração (Clique para logar):</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleQuickFill(emp.email, emp.password || '123456', emp.pin)}
                className={`p-2 rounded-xl bg-stone-950 hover:bg-stone-900 border text-left transition-all ${
                  emp.active
                    ? 'border-stone-800 hover:border-amber-500/50'
                    : 'border-red-900/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-6 h-6 rounded-md object-cover border border-stone-700"
                  />
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-white truncate">
                      {emp.name.split(' ')[0]}
                    </div>
                    <div className="text-[9px] text-amber-400 uppercase font-semibold">
                      {emp.role} {emp.active ? `· PIN ${emp.pin}` : '(Inativo)'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
