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
  const { loginWithEmail, loginStaffWithGmail, employees } = useChurras();

  // Primary separation: ADMIN vs FUNCIONÁRIO
  const [loginType, setLoginType] = useState<'ADMIN' | 'FUNCIONARIO'>('ADMIN');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState<string>('admin@churrascaria.com');
  const [adminPassword, setAdminPassword] = useState<string>('admin');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);

  // Funcionário Nome + Gmail + Senha state
  const activeStaff = employees.filter((e) => e.active);
  const defaultWaiter = activeStaff.find((e) => e.role !== 'ADMIN') || activeStaff[0];

  const [staffName, setStaffName] = useState<string>(defaultWaiter?.name || '');
  const [staffEmail, setStaffEmail] = useState<string>(defaultWaiter?.email || '');
  const [staffPassword, setStaffPassword] = useState<string>(defaultWaiter?.password || 'garcom');
  const [showStaffPassword, setShowStaffPassword] = useState<boolean>(false);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Admin Email/Password Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = loginWithEmail(adminEmail, adminPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Credenciales de Administrador inválidas.');
    }
  };

  // Handle Funcionário Nome + Gmail + Senha Submit
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      setErrorMessage('Ingrese su Nombre, Gmail y Contraseña para acceder al sistema.');
      return;
    }
    const res = loginStaffWithGmail(staffEmail, staffName, staffPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Credenciales de empleado inválidas.');
    }
  };

  const handleSelectQuickStaff = (empName: string, empEmail: string, empPass?: string) => {
    setStaffName(empName);
    setStaffEmail(empEmail);
    setStaffPassword(empPass || '123456');
    setErrorMessage(null);
    setTimeout(() => {
      const res = loginStaffWithGmail(empEmail, empName, empPass || '123456');
      if (!res.success) {
        setErrorMessage(res.error || 'Empleado no encontrado.');
      }
    }, 100);
  };

  const activeNonAdminStaff = employees.filter(
    (e) => e.role !== 'ADMIN' && e.active
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
            CHURRASGESTIÓN
          </h1>
          <p className="text-xs text-stone-400">
            Sistema Integrado de Gestión para Churrasquería y Parrilla
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
              <span>Empleado / Equipo</span>
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
                  <span>Acceso de Gestión Total</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Permiso total para registrar productos con stock, editar y eliminar mesas, y generar reportes oficiales en PDF.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Correo del Administrador:
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
                    Contraseña de Acceso:
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
                  <span>Ingresar como Administrador</span>
                </button>
              </form>
            </div>
          )}

          {/* 2. MODO FUNCIONÁRIO (NOME + GMAIL + SENHA) */}
          {loginType === 'FUNCIONARIO' && (
            <div className="space-y-4">
              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <UserCheck className="w-4 h-4" />
                  <span>Acceso de Empleado / Equipo</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Ingrese su Nombre, Gmail y Contraseña registrados por el administrador para acceder al sistema.
                </p>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nombre del Empleado:
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Ej: Marcelo"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Gmail / Correo de Acceso:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="empleado@gmail.com"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Contraseña de Acceso:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 text-[10px] font-semibold cursor-pointer"
                    >
                      {showStaffPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </button>
              </form>

              {/* Lista de Funcionários Cadastrados para 1-Clique */}
              {activeNonAdminStaff.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-stone-800">
                  <label className="block text-[11px] font-semibold text-stone-400">
                    O seleccione su perfil registrado:
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                    {activeNonAdminStaff.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelectQuickStaff(w.name, w.email, w.password)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          staffEmail.toLowerCase() === w.email.toLowerCase()
                            ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{w.name}</div>
                          <div className="text-[10px] text-amber-400 font-mono truncate">
                            {w.email}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-800 shrink-0 ml-2">
                          {w.role === 'GARCOM' ? 'MOZO' : w.role === 'CAIXA' ? 'CAJERO' : w.role === 'COZINHA' ? 'COCINA' : w.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Demo Access Bar */}
        <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Acceso Rápido de Demostración:</span>
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
              <div className="text-[10px] text-stone-400 mt-0.5">ADMIN (Acceso Total)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType('FUNCIONARIO');
                const waiter = employees.find((e) => e.role === 'GARCOM' && e.active) || employees[0];
                handleSelectQuickStaff(waiter.name, waiter.email, waiter.password);
              }}
              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-stone-200 font-bold">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                <span>Marcelo "Gaúcho"</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">MOZO (Nombre + Gmail + Contraseña)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
