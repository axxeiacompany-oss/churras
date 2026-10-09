import React, { useState, useEffect } from 'react';
import { useChurras } from './context/ChurrasContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminDashboard, AdminTab } from './components/admin/AdminDashboard';
import { CashierDashboard } from './components/cashier/CashierDashboard';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { KitchenKdsDashboard } from './components/kitchen/KitchenKdsDashboard';
import { DailyMonitoringTab } from './components/admin/DailyMonitoringTab';
import { CashFlowTab } from './components/admin/CashFlowTab';
import { AutomationsTab } from './components/admin/AutomationsTab';
import { ReportsTab } from './components/admin/ReportsTab';
import { DailyBuySellTab } from './components/admin/DailyBuySellTab';
import { UserRole } from './types';
import {
  Flame,
  LayoutDashboard,
  Radio,
  UtensilsCrossed,
  Wallet,
  ChefHat,
  BookOpen,
  Users,
  Package,
  DollarSign,
  FileSpreadsheet,
  Zap,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Menu,
  ChevronRight,
  Store,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
  ShoppingCart,
  FileText,
} from 'lucide-react';

export type NavItemKey =
  | 'DASHBOARD'
  | 'LIVE_SALES'
  | 'TABLES'
  | 'CASHIER'
  | 'KITCHEN'
  | 'MENU'
  | 'BUY_SELL'
  | 'EMPLOYEES'
  | 'CASH_FLOW'
  | 'REPORTS'
  | 'AUTOMATIONS'
  | 'SETTINGS';

export const App: React.FC = () => {
  const {
    currentUser,
    logout,
    switchUser,
    employees,
    settings,
    tables,
    comandas,
    lowStockIngredients,
    bills,
    toasts,
    removeToast,
  } = useChurras();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<NavItemKey>('DASHBOARD');
  const [selectedPeriod, setSelectedPeriod] = useState<'HOJE' | 'ONTEM' | '7D' | '30D' | 'MES'>('HOJE');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Sync initial nav with current user role and enforce admin role guard
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'ADMIN') {
        setActiveNav('TABLES');
      }
    }
  }, [currentUser?.role]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080C16] text-stone-100 flex flex-col justify-center">
        <LoginScreen />
      </div>
    );
  }

  // Real-time counters for badges
  const occupiedTablesCount = tables.filter((t) => t.status === 'OCUPADA' || t.status === 'CONTA_SOLICITADA').length;
  const pendingKitchenOrdersCount = comandas
    .flatMap((c) => c.items)
    .filter((it) => it.status === 'PENDENTE' || it.status === 'EM_PREPARO').length;
  const criticalStockCount = lowStockIngredients.length;
  const pendingBillsCount = (bills || []).filter(
    (b) => b.status !== 'PAGO' && b.dueDate <= new Date().toISOString().split('T')[0]
  ).length;
  const totalAlertsCount = criticalStockCount + pendingBillsCount;

  const handleSelectRole = (role: UserRole) => {
    const target = employees.find((e) => e.role === role && e.active) || employees.find((e) => e.role === role);
    if (target) {
      switchUser(target.id);
    }
  };

  const isAdmin = currentUser.role === 'ADMIN';

  // Nav Groups configuration based on user role (Admin vs Garçom)
  const navGroups: Array<{
    title: string;
    items: Array<{
      key: NavItemKey;
      label: string;
      icon: React.ElementType;
      badge?: string | number;
      badgeColor?: string;
      roleRestriction?: UserRole[];
    }>;
  }> = isAdmin
    ? [
        {
          title: 'DASHBOARD Y VENTAS',
          items: [
            {
              key: 'DASHBOARD',
              label: 'Visión General Ejecutiva',
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: 'OPERACIONES DE SALÓN',
          items: [
            {
              key: 'TABLES',
              label: 'Salón y Mesas',
              icon: UtensilsCrossed,
              badge: occupiedTablesCount > 0 ? `${occupiedTablesCount}/${tables.length}` : undefined,
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            },
            {
              key: 'CASHIER',
              label: 'Frente de Caja',
              icon: Wallet,
            },
          ],
        },
        {
          title: 'PRODUCTOS Y DOCUMENTOS',
          items: [
            {
              key: 'MENU',
              label: 'Productos',
              icon: BookOpen,
            },
            {
              key: 'BUY_SELL',
              label: 'Reporte Diario (PDF)',
              icon: FileText,
            },
          ],
        },
        {
          title: 'GESTIÓN Y BI',
          items: [
            {
              key: 'CASH_FLOW',
              label: 'Flujo de Caja y DRE',
              icon: DollarSign,
            },
            {
              key: 'REPORTS',
              label: 'Reportes e Inteligencia',
              icon: FileSpreadsheet,
            },
          ],
        },
        {
          title: 'SISTEMA Y CONFIGURACIÓN',
          items: [
            {
              key: 'EMPLOYEES',
              label: 'Empleados y Equipo',
              icon: Users,
              badge: employees.filter((e) => e.role !== 'ADMIN').length,
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            },
            {
              key: 'SETTINGS',
              label: 'Configuraciones y Admin',
              icon: Settings,
            },
          ],
        },
      ]
    : [
        {
          title: 'ATENCIÓN DE SALÓN',
          items: [
            {
              key: 'TABLES',
              label: 'Salón y Mesas (Tomar Pedidos)',
              icon: UtensilsCrossed,
              badge: occupiedTablesCount > 0 ? `${occupiedTablesCount}/${tables.length}` : undefined,
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            },
          ],
        },
      ];

  const getBreadcrumbTitle = () => {
    switch (activeNav) {
      case 'DASHBOARD':
        return 'Dashboard / Visión General de Ventas';
      case 'TABLES':
        return 'Operaciones / Salón y Toma de Pedidos';
      case 'CASHIER':
        return 'Operaciones / Frente de Caja';
      case 'KITCHEN':
        return 'Operaciones / Cocina y KDS Parrilla';
      case 'MENU':
        return 'Gestión / Registro de Productos';
      case 'BUY_SELL':
        return 'Gestión / Reporte Diario Oficial (PDF)';
      case 'EMPLOYEES':
        return 'Gestión / Empleados y Equipo';
      case 'CASH_FLOW':
        return 'Finanzas / Flujo de Caja y DRE';
      case 'REPORTS':
        return 'Inteligencia / Reportes y BI';
      case 'SETTINGS':
        return 'Sistema / Configuraciones';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#080C16] text-stone-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <div className="flex flex-1 min-h-screen">
        {/* ============================================================ */}
        {/* 1. UTMfy SIGNATURE SIDEBAR (DESKTOP & DRAWER MOBILE)         */}
        {/* ============================================================ */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B0F19] border-r border-[#1B2436] transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#1B2436]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/40 shrink-0">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-white truncate">
                      {settings.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      PRO
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    Gestión Integrada
                  </span>
                </div>
              )}
            </div>

            {/* Close button on mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store Switcher Selector (UTMfy Signature) */}
          {sidebarOpen && (
            <div className="p-3 border-b border-[#1B2436]/60 bg-[#0E1322]">
              <div className="flex items-center justify-between text-xs text-stone-300 p-2 rounded-xl bg-[#131A2D] border border-[#1E2638]">
                <div className="flex items-center gap-2 truncate">
                  <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-stone-200 text-[11px] truncate">
                      Sucursal Asunción (PY)
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {tables.length} Mesas · Guaraní (₲)
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              </div>
            </div>
          )}

          {/* Nav Items List */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-stone-800">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {sidebarOpen && (
                  <div className="px-2 text-[10px] font-bold tracking-wider text-stone-500 uppercase font-mono">
                    {group.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.key;

                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setActiveNav(item.key);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-[#131A2D]'
                        } ${!sidebarOpen ? 'justify-center' : ''}`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-emerald-400' : 'text-stone-400 group-hover:text-stone-200'
                          }`}
                        />
                        {sidebarOpen && (
                          <span className="truncate flex-1 text-left">{item.label}</span>
                        )}

                        {sidebarOpen && item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono border ${
                              item.badgeColor || 'bg-stone-800 text-stone-300 border-stone-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer User Profile & Role */}
          <div className="p-3 border-t border-[#1B2436] bg-[#0E1322]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600/40 to-stone-900 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
                {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>

              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-stone-200 truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <span>{currentUser.role === 'GARCOM' ? 'MOZO' : currentUser.role === 'CAIXA' ? 'CAJERO' : currentUser.role === 'COZINHA' ? 'COCINA' : currentUser.role}</span>
                  </div>
                </div>
              )}

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop on mobile */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          />
        )}

        {/* ============================================================ */}
        {/* 2. MAIN VIEWPORT & UTMfy TOP NAVIGATION BAR                 */}
        {/* ============================================================ */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          }`}
        >
          {/* UTMfy Top Header */}
          <header className="sticky top-0 z-30 h-16 bg-[#0B0F19]/95 backdrop-blur-md border-b border-[#1B2436] px-4 sm:px-6 flex items-center justify-between gap-4">
            {/* Left: Sidebar Toggle & Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setMobileMenuOpen(!mobileMenuOpen);
                  } else {
                    setSidebarOpen(!sidebarOpen);
                  }
                }}
                className="p-2 rounded-xl bg-[#131A2D] border border-[#1E2638] text-stone-400 hover:text-white transition cursor-pointer"
                title="Alternar Menú Lateral"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
                <span className="text-stone-400 font-bold">ChurrasGestión</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
                <span className="text-stone-200 font-semibold">{getBreadcrumbTitle()}</span>
              </div>
            </div>

            {/* Right: UTMfy Controls (Date Filter, Role Switcher, Alerts) */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Live telemetry indicator (UTMfy Signature) */}
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Transmisión Activa (PYG ₲)</span>
              </div>

              {/* UTMfy Date Filter Tabs */}
              <div className="hidden lg:flex items-center bg-[#101627] p-1 rounded-xl border border-[#1E2638] text-xs">
                {(
                  [
                    { key: 'HOJE', label: 'HOY' },
                    { key: 'ONTEM', label: 'AYER' },
                    { key: '7D', label: '7D' },
                    { key: '30D', label: '30D' },
                    { key: 'MES', label: 'MES' },
                  ] as const
                ).map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      selectedPeriod === period.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Quick Role Switcher Pills (Apenas Visível para o Administrador) */}
              {isAdmin ? (
                <div className="flex items-center bg-[#101627] p-1 rounded-xl border border-[#1E2638] text-xs">
                  {(
                    [
                      { role: 'ADMIN', label: 'Admin', icon: ShieldCheck },
                      { role: 'CAIXA', label: 'Cajero', icon: Wallet },
                      { role: 'GARCOM', label: 'Mozo', icon: UtensilsCrossed },
                    ] as const
                  ).map((r) => {
                    const isCurrent = currentUser.role === r.role;
                    const Icon = r.icon;

                    return (
                      <button
                        key={r.role}
                        onClick={() => handleSelectRole(r.role)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title={`Cambiar a perfil de ${r.label}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Terminal del Mozo</span>
                </div>
              )}

              {/* Notification Bell with Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl bg-[#131A2D] border border-[#1E2638] text-stone-300 hover:text-white transition cursor-pointer relative"
                  title="Alertas y Notificaciones"
                >
                  <Bell className="w-4 h-4" />
                  {totalAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center border border-[#0B0F19]">
                      {totalAlertsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#0E1424] border border-[#1E2638] rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-amber-500" /> Alertas Operacionales
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {totalAlertsCount} pendientes
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {criticalStockCount > 0 && (
                        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-1">
                          <div className="font-bold text-[11px]">Stock Crítico Detectado</div>
                          <div className="text-[10px] text-amber-400/90">
                            {criticalStockCount} insumo(s) por debajo del margen mínimo de seguridad.
                          </div>
                        </div>
                      )}

                      {pendingBillsCount > 0 && (
                        <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 space-y-1">
                          <div className="font-bold text-[11px]">Cuentas que Vencen Hoy</div>
                          <div className="text-[10px] text-red-400/90">
                            {pendingBillsCount} gasto(s) operacional(es) a pagar hoy.
                          </div>
                        </div>
                      )}

                      {totalAlertsCount === 0 && (
                        <div className="py-4 text-center text-stone-500 text-xs">
                          ¡Todo bajo control! Ninguna alerta crítica activa.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ============================================================ */}
          {/* 3. DYNAMIC CONTENT VIEWPORT (RENDERIZA O MÓDULO ATIVO)       */}
          {/* ============================================================ */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
            {activeNav === 'DASHBOARD' && <DailyMonitoringTab />}
            {activeNav === 'LIVE_SALES' && <DailyMonitoringTab />}
            {activeNav === 'TABLES' && <WaiterDashboard />}
            {activeNav === 'CASHIER' && <CashierDashboard />}
            {activeNav === 'KITCHEN' && <KitchenKdsDashboard />}
            {activeNav === 'MENU' && <AdminDashboard initialTab="MENU" hideTabBar />}
            {activeNav === 'BUY_SELL' && <DailyBuySellTab />}
            {activeNav === 'EMPLOYEES' && <AdminDashboard initialTab="EMPLOYEES" hideTabBar />}
            {activeNav === 'CASH_FLOW' && <CashFlowTab />}
            {activeNav === 'REPORTS' && <ReportsTab />}
            {activeNav === 'AUTOMATIONS' && <AutomationsTab />}
            {activeNav === 'SETTINGS' && <AdminDashboard initialTab="SETTINGS" hideTabBar />}
          </main>
        </div>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl flex items-start gap-2.5 text-xs transition animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-[#0E1526]/95 border-emerald-500/50 text-emerald-300'
                : t.type === 'error'
                ? 'bg-[#0E1526]/95 border-red-500/50 text-red-300'
                : t.type === 'warning'
                ? 'bg-[#0E1526]/95 border-amber-500/50 text-amber-300'
                : 'bg-[#0E1526]/95 border-stone-700 text-stone-200'
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
