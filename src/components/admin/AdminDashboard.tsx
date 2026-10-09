import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import {
  Employee,
  MenuItem,
  UserRole,
  ShiftType,
  MenuCategory,
  PrepStation,
  PaymentMethod,
  Comanda,
  RecipeIngredient,
  Table,
  EmployeePermissions,
} from '../../types';
import { formatCurrency, formatTime, getRoleLabel, getPaymentMethodLabel } from '../../utils/format';
import {
  TrendingUp,
  Users,
  UtensilsCrossed,
  DollarSign,
  Plus,
  Flame,
  Settings,
  Layers,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  ChefHat,
  Search,
  Percent,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  Target,
  FileText,
  UserCheck,
  Package,
  AlertTriangle,
  Zap,
  Image as ImageIcon,
  FileSpreadsheet,
  Database,
  Download,
  Copy,
  FileCode,
  ShoppingCart,
} from 'lucide-react';
import { EmployeeHistoryModal } from './EmployeeHistoryModal';
import { ReceiptModal } from '../modals/ReceiptModal';
import { DailyMonitoringTab } from './DailyMonitoringTab';
import { CashFlowTab } from './CashFlowTab';
import { AutomationsTab } from './AutomationsTab';
import { ReportsTab } from './ReportsTab';
import { DailyBuySellTab } from './DailyBuySellTab';
import { SUPABASE_SQL_SCHEMA } from '../../data/supabaseSchemaSql';

export type AdminTab =
  | 'OVERVIEW'
  | 'EMPLOYEES'
  | 'MENU'
  | 'BUY_SELL'
  | 'TABLES'
  | 'CASH_FLOW'
  | 'AUTOMATIONS'
  | 'REPORTS'
  | 'SETTINGS';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  hideTabBar?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'OVERVIEW',
  hideTabBar = false,
}) => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    resetCredentials,
    menuItems,
    addMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    deleteMenuItem,
    tables,
    addTable,
    updateTable,
    deleteTable,
    comandas,
    cashSession,
    settings,
    updateSettings,
    ingredients,
    lowStockIngredients,
    bills,
    showToast,
  } = useChurras();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const alertsCount =
    lowStockIngredients.length +
    (bills || []).filter(
      (b) => b.status !== 'PAGO' && b.dueDate <= new Date().toISOString().split('T')[0]
    ).length;

  // Employee modal form state
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empFormName, setEmpFormName] = useState<string>('');
  const [empFormEmail, setEmpFormEmail] = useState<string>('');
  const [empFormPassword, setEmpFormPassword] = useState<string>('');
  const [empFormRole, setEmpFormRole] = useState<UserRole>('GARCOM');
  const [empFormPin, setEmpFormPin] = useState<string>('1234');
  const [empFormPhone, setEmpFormPhone] = useState<string>('');
  const [empFormCpf, setEmpFormCpf] = useState<string>('');
  const [empFormCommission, setEmpFormCommission] = useState<number>(10);
  const [empFormShift, setEmpFormShift] = useState<ShiftType>('ALMOCO');
  const [empFormAdmissionDate, setEmpFormAdmissionDate] = useState<string>('2024-01-15');
  const [empFormBaseSalary, setEmpFormBaseSalary] = useState<number>(3200000);
  const [empFormMonthlyTarget, setEmpFormMonthlyTarget] = useState<number>(45000000);
  const [empFormActive, setEmpFormActive] = useState<boolean>(true);
  const [empFormPermissions, setEmpFormPermissions] = useState<EmployeePermissions>({
    canCancelOrders: false,
    canApplyDiscounts: false,
    canCloseBills: true,
    canAddStock: false,
    canManageTables: true,
  });
  const [empFormError, setEmpFormError] = useState<string | null>(null);

  // Employee List Search, Filter & Pagination
  const [empSearch, setEmpSearch] = useState<string>('');
  const [empRoleFilter, setEmpRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [empShiftFilter, setEmpShiftFilter] = useState<ShiftType | 'ALL'>('ALL');
  const [empStatusFilter, setEmpStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [empCurrentPage, setEmpCurrentPage] = useState<number>(1);
  const empItemsPerPage = 6;

  // History Detail Modal state
  const [selectedHistoryEmp, setSelectedHistoryEmp] = useState<Employee | null>(null);
  const [historyReceiptModalComanda, setHistoryReceiptModalComanda] = useState<Comanda | null>(null);

  // Reset Credentials Modal state
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetTargetEmp, setResetTargetEmp] = useState<Employee | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');

  // Menu item modal state
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuFormName, setMenuFormName] = useState<string>('');
  const [menuFormCategory, setMenuFormCategory] = useState<MenuCategory>('CORTES_NOBRES');
  const [menuFormPrice, setMenuFormPrice] = useState<string>('');
  const [menuFormCostPrice, setMenuFormCostPrice] = useState<string>('');
  const [menuFormStockQuantity, setMenuFormStockQuantity] = useState<string>('30');
  const [menuFormDesc, setMenuFormDesc] = useState<string>('');
  const [menuFormStation, setMenuFormStation] = useState<PrepStation>('GRELHA');
  const [menuFormDoneness, setMenuFormDoneness] = useState<boolean>(false);

  // Table Modal & Delete State (Admin)
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableFormLabel, setTableFormLabel] = useState<string>('');
  const [tableFormCapacity, setTableFormCapacity] = useState<number>(4);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // Search in menu
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('ALL');

  // SQL Script Viewer & Copy state
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showSqlViewer, setShowSqlViewer] = useState<boolean>(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast('¡Script SQL copiado al portapapeles!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churrasgestion_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('¡Archivo churrasgestion_schema.sql descargado con éxito!', 'success');
  };

  // Financial calculations
  const totalSalesRevenue = comandas
    .filter((c) => c.status === 'PAGA')
    .reduce((acc, c) => acc + c.total, 0);

  const activeComandasRevenue = comandas
    .filter((c) => c.status === 'ABERTA' || c.status === 'CONTA_SOLICITADA')
    .reduce((acc, c) => acc + c.total, 0);

  const totalComandasCount = comandas.filter((c) => c.status === 'PAGA').length;
  const avgTicket = totalComandasCount > 0 ? totalSalesRevenue / totalComandasCount : 0;

  const totalPeopleServed = comandas
    .filter((c) => c.status === 'PAGA')
    .reduce((acc, c) => acc + c.peopleCount, 0);

  const totalServiceFee = comandas
    .filter((c) => c.status === 'PAGA')
    .reduce((acc, c) => acc + (c.includeService ? c.serviceFee : 0), 0);

  // Payment Breakdown
  const paymentsByMethod: Record<PaymentMethod, number> = {
    PIX: 0,
    CREDITO: 0,
    DEBITO: 0,
    DINHEIRO: 0,
    VR_VA: 0,
  };

  comandas.forEach((cmd) => {
    cmd.payments.forEach((p) => {
      paymentsByMethod[p.method] = (paymentsByMethod[p.method] || 0) + p.amount;
    });
  });

  // Top Selling Items
  const itemsSoldTally: Record<string, { name: string; qty: number; revenue: number }> = {};
  comandas.forEach((cmd) => {
    cmd.items.forEach((it) => {
      if (!itemsSoldTally[it.name]) {
        itemsSoldTally[it.name] = { name: it.name, qty: 0, revenue: 0 };
      }
      itemsSoldTally[it.name].qty += it.quantity;
      itemsSoldTally[it.name].revenue += it.quantity * it.price;
    });
  });

  const topSellingItems = Object.values(itemsSoldTally)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Waiter Rankings
  const waiterStats = employees
    .filter((e) => e.role === 'GARCOM')
    .map((waiter) => {
      const waiterComandas = comandas.filter((c) => c.waiterId === waiter.id && c.status === 'PAGA');
      const sales = waiterComandas.reduce((acc, c) => acc + c.total, 0);
      const commission = sales * ((waiter.commissionRate || 10) / 100);
      return {
        ...waiter,
        sales,
        commission,
        ordersCount: waiterComandas.length,
      };
    })
    .sort((a, b) => b.sales - a.sales);

  const getDefaultPermissionsForRole = (role: UserRole): EmployeePermissions => {
    if (role === 'ADMIN') {
      return {
        canCancelOrders: true,
        canApplyDiscounts: true,
        canCloseBills: true,
        canAddStock: true,
        canManageTables: true,
      };
    }
    if (role === 'CAIXA') {
      return {
        canCancelOrders: true,
        canApplyDiscounts: true,
        canCloseBills: true,
        canAddStock: false,
        canManageTables: true,
      };
    }
    return {
      canCancelOrders: settings.allowStaffCancelOrder || false,
      canApplyDiscounts: settings.allowStaffDiscounts || false,
      canCloseBills: settings.allowStaffCloseBill || false,
      canAddStock: settings.allowStaffAddStock || false,
      canManageTables: settings.allowStaffManageTables !== false,
    };
  };

  const getEmployeePermissions = (emp: Employee): EmployeePermissions => {
    if (emp.role === 'ADMIN') {
      return {
        canCancelOrders: true,
        canApplyDiscounts: true,
        canCloseBills: true,
        canAddStock: true,
        canManageTables: true,
      };
    }
    if (emp.permissions) {
      return emp.permissions;
    }
    return getDefaultPermissionsForRole(emp.role);
  };

  const handleToggleEmployeePermission = (
    emp: Employee,
    permKey: keyof EmployeePermissions
  ) => {
    if (emp.role === 'ADMIN') {
      showToast('Los administradores tienen todas las funciones habilitadas por defecto.', 'info');
      return;
    }
    const currentPerms = getEmployeePermissions(emp);
    const updatedPerms: EmployeePermissions = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey],
    };
    updateEmployee(emp.id, { permissions: updatedPerms });
  };

  // Handlers for Employees
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpFormName('');
    setEmpFormEmail('');
    setEmpFormPassword('123456');
    setEmpFormRole('GARCOM');
    setEmpFormPin(Math.floor(1000 + Math.random() * 9000).toString());
    setEmpFormPhone('');
    setEmpFormCpf('');
    setEmpFormCommission(10);
    setEmpFormShift('ALMOCO');
    setEmpFormAdmissionDate(new Date().toISOString().split('T')[0]);
    setEmpFormBaseSalary(3200000);
    setEmpFormMonthlyTarget(45000000);
    setEmpFormActive(true);
    setEmpFormPermissions(getDefaultPermissionsForRole('GARCOM'));
    setEmpFormError(null);
    setShowEmployeeModal(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpFormName(emp.name);
    setEmpFormEmail(emp.email);
    setEmpFormPassword(emp.password || '');
    setEmpFormRole(emp.role);
    setEmpFormPin(emp.pin);
    setEmpFormPhone(emp.phone);
    setEmpFormCpf(emp.cpf || '');
    setEmpFormCommission(emp.commissionRate);
    setEmpFormShift(emp.shift);
    setEmpFormAdmissionDate(emp.admissionDate || new Date().toISOString().split('T')[0]);
    setEmpFormBaseSalary(emp.baseSalary || 3200000);
    setEmpFormMonthlyTarget(emp.monthlyTarget || 45000000);
    setEmpFormActive(emp.active);
    setEmpFormPermissions(getEmployeePermissions(emp));
    setEmpFormError(null);
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpFormError(null);

    if (!empFormEmail.trim()) {
      setEmpFormError('Ingrese el Gmail/correo del colaborador.');
      return;
    }

    const finalPermissions: EmployeePermissions =
      empFormRole === 'ADMIN'
        ? {
            canCancelOrders: true,
            canApplyDiscounts: true,
            canCloseBills: true,
            canAddStock: true,
            canManageTables: true,
          }
        : empFormPermissions;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: empFormName,
        email: empFormEmail.trim().toLowerCase(),
        password: empFormPassword.trim() || editingEmployee.password,
        role: empFormRole,
        pin: empFormPin.trim(),
        phone: empFormPhone,
        cpf: empFormCpf.trim(),
        commissionRate: empFormCommission,
        shift: empFormShift,
        admissionDate: empFormAdmissionDate,
        baseSalary: empFormBaseSalary,
        monthlyTarget: empFormMonthlyTarget,
        active: empFormActive,
        permissions: finalPermissions,
      });
      setShowEmployeeModal(false);
    } else {
      const res = addEmployee({
        name: empFormName,
        email: empFormEmail.trim().toLowerCase(),
        password: empFormPassword.trim() || '123456',
        role: empFormRole,
        pin: empFormPin.trim(),
        phone: empFormPhone,
        cpf: empFormCpf.trim(),
        commissionRate: empFormCommission,
        shift: empFormShift,
        admissionDate: empFormAdmissionDate,
        baseSalary: empFormBaseSalary,
        monthlyTarget: empFormMonthlyTarget,
        active: empFormActive,
        colorTag: 'amber',
        permissions: finalPermissions,
      });

      if (!res.success) {
        setEmpFormError(res.error || 'Error al crear la cuenta.');
        return;
      }
      setShowEmployeeModal(false);
    }
  };

  const handleOpenResetCredentials = (emp: Employee) => {
    setResetTargetEmp(emp);
    setNewPasswordInput('');
    setNewPinInput(emp.pin);
    setShowResetModal(true);
  };

  const handleConfirmResetCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetEmp) return;

    if (newPinInput.trim() && !/^\d{4}$/.test(newPinInput.trim())) {
      showToast('El nuevo PIN debe tener exactamente 4 dígitos.', 'warning');
      return;
    }

    resetCredentials(
      resetTargetEmp.id,
      newPasswordInput.trim() || undefined,
      newPinInput.trim() || undefined
    );
    setShowResetModal(false);
    setResetTargetEmp(null);
  };

  // Handlers for Menu Items
  const handleOpenAddMenuItem = () => {
    setEditingMenuItem(null);
    setMenuFormName('');
    setMenuFormCategory('CORTES_NOBRES');
    setMenuFormPrice('');
    setMenuFormCostPrice('');
    setMenuFormStockQuantity('30');
    setMenuFormDesc('');
    setMenuFormStation('GRELHA');
    setMenuFormDoneness(false);
    setShowMenuModal(true);
  };

  const handleOpenEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuFormName(item.name);
    setMenuFormCategory(item.category);
    setMenuFormPrice(item.price.toString());
    setMenuFormCostPrice(item.costPrice ? item.costPrice.toString() : '');
    setMenuFormStockQuantity((item.stockQuantity ?? 30).toString());
    setMenuFormDesc(item.description || '');
    setMenuFormStation(item.prepStation);
    setMenuFormDoneness(item.allowsDoneness || false);
    setShowMenuModal(true);
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(menuFormPrice) || 0;
    const costNum = parseFloat(menuFormCostPrice) || 0;
    const stockQtyNum = parseInt(menuFormStockQuantity) || 0;

    if (editingMenuItem) {
      updateMenuItem(editingMenuItem.id, {
        name: menuFormName,
        category: menuFormCategory,
        price: priceNum,
        costPrice: costNum,
        stockQuantity: stockQtyNum,
        description: menuFormDesc,
      });
    } else {
      addMenuItem({
        name: menuFormName,
        category: menuFormCategory,
        price: priceNum,
        costPrice: costNum,
        stockQuantity: stockQtyNum,
        description: menuFormDesc,
        prepStation: 'GRELHA',
        available: true,
      });
    }
    setShowMenuModal(false);
  };

  // Table Handlers (Admin)
  const handleOpenAddTable = () => {
    setEditingTable(null);
    const nextNum = tables.length + 1;
    setTableFormLabel(`Mesa ${nextNum < 10 ? '0' + nextNum : nextNum}`);
    setTableFormCapacity(4);
    setShowTableModal(true);
  };

  const handleOpenEditTable = (table: Table) => {
    setEditingTable(table);
    setTableFormLabel(table.label);
    setTableFormCapacity(table.capacity);
    setShowTableModal(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFormLabel.trim()) {
      showToast('El nombre/número de la mesa es obligatorio.', 'error');
      return;
    }
    if (editingTable) {
      updateTable(editingTable.id, {
        label: tableFormLabel.trim(),
        capacity: tableFormCapacity,
      });
    } else {
      addTable(tableFormLabel.trim(), tableFormCapacity);
    }
    setShowTableModal(false);
  };

  const handleConfirmDeleteTable = () => {
    if (!tableToDelete) return;
    deleteTable(tableToDelete.id);
    setTableToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Admin Subnav Tabs */}
      {!hideTabBar && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2 sm:p-2.5 shadow-lg">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Visión General & Métricas</span>
            </button>

            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Empleados & Equipo ({employees.filter((e) => e.role !== 'ADMIN').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('MENU')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'MENU'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Productos ({menuItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('BUY_SELL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'BUY_SELL'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Informe Diario (PDF)</span>
            </button>

            <button
              onClick={() => setActiveTab('TABLES')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'TABLES'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mapa del Salón ({tables.length} mesas)</span>
            </button>

            <button
              onClick={() => setActiveTab('CASH_FLOW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'CASH_FLOW'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Flujo de Caja & Auditoría</span>
            </button>

            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'REPORTS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Informes & BI</span>
            </button>

            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'SETTINGS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuraciones</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && <DailyMonitoringTab />}

      {/* TAB 2: EMPLOYEES */}
      {activeTab === 'EMPLOYEES' && (() => {
        const staffEmployeesOnly = employees.filter((e) => e.role !== 'ADMIN');
        const adminAccounts = employees.filter((e) => e.role === 'ADMIN');

        // Compute filtered employees (only staff/equipe, excluding ADMIN/Gerente)
        const filteredEmployees = staffEmployeesOnly.filter((emp) => {
          const q = empSearch.toLowerCase().trim();
          const matchesSearch =
            !q ||
            emp.name.toLowerCase().includes(q) ||
            emp.email.toLowerCase().includes(q) ||
            (emp.cpf && emp.cpf.toLowerCase().includes(q));

          const matchesRole = empRoleFilter === 'ALL' || emp.role === empRoleFilter;
          const matchesShift = empShiftFilter === 'ALL' || emp.shift === empShiftFilter;
          const matchesStatus =
            empStatusFilter === 'ALL' ||
            (empStatusFilter === 'ACTIVE' && emp.active) ||
            (empStatusFilter === 'INACTIVE' && !emp.active);

          return matchesSearch && matchesRole && matchesShift && matchesStatus;
        });

        const totalEmpPages = Math.ceil(filteredEmployees.length / empItemsPerPage) || 1;
        const safeCurrentPage = Math.min(empCurrentPage, totalEmpPages);
        const startIndex = (safeCurrentPage - 1) * empItemsPerPage;
        const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + empItemsPerPage);

        return (
          <div className="space-y-5">
            {/* Bloco Separado: Diretoria / Admin & Gerente */}
            <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                      Admin & Gerencia (Separado del Equipo)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                      Acceso Total
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5">
                    {adminAccounts.map((a) => `${a.name} (${a.email})`).join(' • ')}
                  </p>
                </div>
              </div>
              {adminAccounts[0] && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenResetCredentials(adminAccounts[0])}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Cambiar Contraseña Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Header & Add Button (Somente Funcionários & Equipe) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Empleados & Equipo Operativo ({staffEmployeesOnly.length})
                </h3>
                <p className="text-xs text-stone-400">
                  Registro exclusivo de empleados y equipo (Mozos, Cajeros y Cocina/Parrillero).
                </p>
              </div>
              <button
                onClick={handleOpenAddEmployee}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Empleado</span>
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar empleado por nombre, Gmail o C.I...."
                    value={empSearch}
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      setEmpCurrentPage(1);
                    }}
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Filter by Role (Somente Equipe) */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <select
                    value={empRoleFilter === 'ADMIN' ? 'ALL' : empRoleFilter}
                    onChange={(e) => {
                      setEmpRoleFilter(e.target.value as UserRole | 'ALL');
                      setEmpCurrentPage(1);
                    }}
                    className="w-full bg-transparent text-stone-200 focus:outline-none text-xs"
                  >
                    <option value="ALL">Todas las Funciones del Equipo</option>
                    <option value="GARCOM">Mozo (Salón)</option>
                    <option value="CAIXA">Cajero (Operador de Caja)</option>
                    <option value="COZINHA">Cocina / Parrillero</option>
                  </select>
                </div>

                {/* Filter by Status */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <select
                    value={empStatusFilter}
                    onChange={(e) => {
                      setEmpStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                      setEmpCurrentPage(1);
                    }}
                    className="w-full bg-transparent text-stone-200 focus:outline-none text-xs"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">Solo Activos</option>
                    <option value="INACTIVE">Solo Inactivos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Empty state */}
            {filteredEmployees.length === 0 ? (
              <div className="bg-stone-900 border border-dashed border-stone-800 rounded-2xl p-10 text-center text-xs text-stone-400 space-y-2">
                <Users className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="font-semibold text-stone-200">No se encontró ningún empleado con los filtros actuales.</p>
                <button
                  onClick={() => {
                    setEmpSearch('');
                    setEmpRoleFilter('ALL');
                    setEmpShiftFilter('ALL');
                    setEmpStatusFilter('ALL');
                  }}
                  className="text-amber-400 underline font-medium"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              /* Employees Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedEmployees.map((emp) => {
                  const empComandas = comandas.filter((c) => c.waiterId === emp.id && c.status === 'PAGA');
                  const empTotalSales = empComandas.reduce((acc, c) => acc + c.total, 0);

                  return (
                    <div
                      key={emp.id}
                      className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3 hover:border-stone-700 transition-all"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 to-stone-900 border border-amber-500/30 text-amber-300 font-bold text-sm flex items-center justify-center shadow-inner tracking-wider">
                            {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{emp.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                                {getRoleLabel(emp.role)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            emp.active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {emp.active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>

                      {/* Detail Fields Grid */}
                      <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 text-xs space-y-1.5">
                        <div className="flex justify-between text-stone-400">
                          <span>Gmail / Correo:</span>
                          <span className="text-amber-300 font-mono text-[11px] font-bold truncate max-w-[170px]">{emp.email}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>C.I. / Doc:</span>
                          <span className="text-stone-200 font-mono text-[11px] font-semibold">{emp.cpf || 'No informado'}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Teléfono:</span>
                          <span className="text-stone-200">{emp.phone || 'No informado'}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Ingreso:</span>
                          <span className="text-stone-300">
                            {emp.admissionDate ? new Date(emp.admissionDate + 'T00:00:00').toLocaleDateString('es-PY') : '--'}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Salario Base:</span>
                          <span className="text-stone-200 font-mono font-semibold">{formatCurrency(emp.baseSalary || 0)}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Meta Mensual:</span>
                          <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(emp.monthlyTarget || 0)}</span>
                        </div>
                        <div className="flex justify-between text-stone-400 pt-1 border-t border-stone-900">
                          <span>Acceso al Sistema:</span>
                          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded text-[10px]">
                            Nombre + Gmail + Contraseña
                          </span>
                        </div>
                      </div>

                      {/* Role Selector & Individual Functions in the same card */}
                      {(() => {
                        const empPerms = getEmployeePermissions(emp);
                        const isEmpAdmin = emp.role === 'ADMIN';
                        return (
                          <div className="p-3 bg-stone-950 rounded-xl border border-amber-500/25 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5" /> Función Principal:
                              </span>
                              <select
                                value={emp.role}
                                onChange={(e) => {
                                  const nextRole = e.target.value as UserRole;
                                  updateEmployee(emp.id, {
                                    role: nextRole,
                                    permissions: getDefaultPermissionsForRole(nextRole),
                                  });
                                }}
                                className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                              >
                                <option value="GARCOM">MOZO (Salón)</option>
                                <option value="CAIXA">CAJERO (Operador)</option>
                                <option value="COZINHA">COCINA (Parrillero)</option>
                              </select>
                            </div>

                            <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                Funciones & Permisos Habilitados para {emp.name.split(' ')[0]}:
                              </span>
                              <div className="grid grid-cols-1 gap-1">
                                {[
                                  { key: 'canCloseBills' as const, label: 'Cerrar y cobrar cuentas' },
                                  { key: 'canManageTables' as const, label: 'Transferir / unir mesas' },
                                  { key: 'canCancelOrders' as const, label: 'Cancelar ítems / pedidos' },
                                  { key: 'canApplyDiscounts' as const, label: 'Aplicar descuentos' },
                                  { key: 'canAddStock' as const, label: 'Registrar compras (+Stock)' },
                                ].map((permItem) => (
                                  <label
                                    key={permItem.key}
                                    className={`flex items-center justify-between px-2 py-1 rounded-lg border transition ${
                                      empPerms[permItem.key]
                                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                                        : 'bg-stone-900/60 border-stone-800 text-stone-400'
                                    } ${isEmpAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:border-amber-500/40'}`}
                                  >
                                    <span className="text-[11px] font-medium">{permItem.label}</span>
                                    <input
                                      type="checkbox"
                                      disabled={isEmpAdmin}
                                      checked={empPerms[permItem.key]}
                                      onChange={() => handleToggleEmployeePermission(emp, permItem.key)}
                                      className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Performance & History Action Button */}
                      <button
                        onClick={() => setSelectedHistoryEmp(emp)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/40 text-amber-300 text-xs font-bold transition-all"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Historial de Ventas & Propinas</span>
                      </button>

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                        <button
                          onClick={() => updateEmployee(emp.id, { active: !emp.active })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            emp.active
                              ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {emp.active ? 'Desactivar' : 'Activar Cuenta'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenResetCredentials(emp)}
                            title="Restablecer Contraseña o PIN de Acceso"
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 text-stone-300 hover:text-amber-400 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditEmployee(emp)}
                            title="Editar Datos de Registro"
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {employees.length > 1 && (
                            <button
                              onClick={() => deleteEmployee(emp.id)}
                              title="Eliminar Colaborador"
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-950 text-stone-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredEmployees.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-800 text-xs text-stone-400">
                <div>
                  Mostrando <strong className="text-white">{startIndex + 1}</strong> a{' '}
                  <strong className="text-white">{Math.min(startIndex + empItemsPerPage, filteredEmployees.length)}</strong> de{' '}
                  <strong className="text-white">{filteredEmployees.length}</strong> colaboradores
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEmpCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 disabled:cursor-not-allowed border border-stone-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalEmpPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setEmpCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        safeCurrentPage === pageNum
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setEmpCurrentPage((p) => Math.min(totalEmpPages, p + 1))}
                    disabled={safeCurrentPage === totalEmpPages}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 disabled:cursor-not-allowed border border-stone-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 3: MENU & PRODUTOS */}
      {activeTab === 'MENU' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Productos</h3>
              <p className="text-xs text-stone-400">
                Ajuste precios, pause productos agotados y agregue novedades al rodízio o a la carta.
              </p>
            </div>
            <button
              onClick={handleOpenAddMenuItem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={menuCategoryFilter}
              onChange={(e) => setMenuCategoryFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="CORTES_NOBRES">Cortes Nobles</option>
              <option value="RODIZIO">Rodízio</option>
              <option value="ENTRADAS_GUARNACOES">Guarniciones & Entradas</option>
              <option value="CHOPP_DRINKS">Chopp & Tragos</option>
              <option value="BEBIDAS">Bebidas Sin Alcohol</option>
              <option value="SOBREMESAS">Postres</option>
            </select>
          </div>

          {/* Items Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Producto / Descripción</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Precio Venta</th>
                    <th className="p-3.5">Precio Costo</th>
                    <th className="p-3.5 text-center">Cant. Stock (p/ venta)</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70 text-stone-300">
                  {menuItems
                    .filter((item) => {
                      const matchesCategory =
                        menuCategoryFilter === 'ALL' || item.category === menuCategoryFilter;
                      const matchesSearch =
                        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
                      return matchesCategory && matchesSearch;
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-stone-850 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-stone-500 max-w-xs truncate">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-400 font-medium">{item.category}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="p-3.5 font-mono text-stone-400">
                          {item.costPrice ? formatCurrency(item.costPrice) : '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs ${
                              (item.stockQuantity ?? 30) > 10
                                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                                : (item.stockQuantity ?? 30) > 0
                                ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                                : 'bg-red-950/70 text-red-400 border border-red-800/50'
                            }`}
                          >
                            {item.stockQuantity ?? 30} un
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => toggleMenuItemAvailability(item.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              item.available
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                                : 'bg-red-950/80 text-red-400 border-red-800/60'
                            }`}
                          >
                            {item.available ? 'Disponible' : 'Pausado'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMenuItem(item)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Editar Producto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteMenuItem(item.id)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 transition cursor-pointer"
                              title="Eliminar Producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RELATÓRIO DIÁRIO OFICIAL (PDF) */}
      {activeTab === 'BUY_SELL' && <DailyBuySellTab />}

      {/* TAB 4: TABLES MAP (COM EDITAR E EXCLUIR MESAS PELO ADMIN) */}
      {activeTab === 'TABLES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Salón & Mesas</h3>
              <p className="text-xs text-stone-400">
                Gestión exclusiva del Administrador: cree, edite la capacidad y elimine mesas desocupadas.
              </p>
            </div>
            <button
              onClick={handleOpenAddTable}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Mesa</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.map((table) => {
              const tableComanda = table.currentComandaId
                ? comandas.find((c) => c.id === table.currentComandaId)
                : null;
              const isOccupied = table.status === 'OCUPADA' || table.status === 'CONTA_SOLICITADA';

              return (
                <div
                  key={table.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[140px] relative group ${
                    table.status === 'LIVRE'
                      ? 'bg-stone-900 border-dashed border-stone-800'
                      : table.status === 'CONTA_SOLICITADA'
                      ? 'bg-yellow-950/40 border-yellow-700'
                      : 'bg-stone-900 border-amber-600/70 shadow'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-white">{table.label}</div>
                      <div className="text-[10px] text-stone-500">{table.capacity} lugares</div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        table.status === 'LIVRE'
                          ? 'bg-emerald-950 text-emerald-400'
                          : table.status === 'CONTA_SOLICITADA'
                          ? 'bg-yellow-950 text-yellow-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {table.status === 'LIVRE' ? 'LIBRE' : table.status === 'CONTA_SOLICITADA' ? 'CUENTA' : table.status}
                    </span>
                  </div>

                  {tableComanda ? (
                    <div className="my-1.5 space-y-0.5 text-xs">
                      <div className="text-stone-200 font-semibold truncate text-[11px]">
                        {tableComanda.customerName}
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>{tableComanda.code}</span>
                        <span className="font-mono font-bold text-amber-400">
                          {formatCurrency(tableComanda.total)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="my-1.5 text-[11px] text-stone-500">Mesa desocupada</div>
                  )}

                  {/* Admin Table Actions: Editar e Excluir */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEditTable(table)}
                      className="px-2 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-[10px] font-semibold text-stone-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      title="Editar nombre y capacidad de la mesa"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (isOccupied) {
                          showToast('¡No es posible eliminar una mesa ocupada!', 'error');
                        } else {
                          setTableToDelete(table);
                        }
                      }}
                      disabled={isOccupied}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        isOccupied
                          ? 'opacity-30 cursor-not-allowed text-stone-600'
                          : 'bg-stone-950 hover:bg-red-950 text-stone-400 hover:text-red-400'
                      }`}
                      title={isOccupied ? 'Mesa en atención' : 'Eliminar esta mesa'}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CASH FLOW & AUDIT */}
      {activeTab === 'CASH_FLOW' && <CashFlowTab />}

      {/* TAB 8: RELATÓRIOS & BI */}
      {activeTab === 'REPORTS' && <ReportsTab />}

      {/* TAB 9: RESTAURANT SETTINGS & ADMIN CONTROL CENTER */}
      {activeTab === 'SETTINGS' && (() => {
        const staffEmployeesOnly = employees.filter((e) => e.role !== 'ADMIN');
        const adminAccounts = employees.filter((e) => e.role === 'ADMIN');

        const activeStaffCount = staffEmployeesOnly.filter((e) => e.active).length;
        const freeTablesCount = tables.filter((t) => t.status === 'LIVRE').length;

        return (
          <div className="space-y-6">
            {/* 1. Header Executivo do Painel de Administração */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/40 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white tracking-tight">
                      Central Administrativa & Configuraciones
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                      Admin & Gerencia
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Gestione la cuenta del Administrador/Gerente, configure las mesas del salón y agregue productos al menú.
                  </p>
                </div>
              </div>

              {/* Ações Rápidas do Admin (Sem adicionar funcionário aqui) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenAddTable}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Nueva Mesa</span>
                </button>
                <button
                  onClick={handleOpenAddMenuItem}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Nuevo Producto</span>
                </button>
              </div>
            </div>

            {/* 1.5. CONTA DO GERENTE / ADMIN (SEPARADO DA EQUIPE) */}
            <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    AD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        Gerente & Administrador (Acceso General Aparte)
                      </h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                        Separado del Equipo
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Cuenta exclusiva de la gerencia y administración del sistema.
                    </p>
                  </div>
                </div>

                {adminAccounts.map((adminAcc) => (
                  <div
                    key={adminAcc.id}
                    className="flex flex-wrap items-center gap-3 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{adminAcc.name}</div>
                      <div className="text-[11px] text-amber-400 font-mono">{adminAcc.email}</div>
                    </div>
                    <button
                      onClick={() => handleOpenResetCredentials(adminAcc)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Cambiar Contraseña</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Resumo Rápido de Recursos do Admin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 font-semibold block">Admin / Gerencia</span>
                  <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">
                    {adminAccounts.length}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    gestión separada ({activeStaffCount} en la pestaña Empleados)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 font-semibold block">Mesas del Salón</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                    {tables.length}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {freeTablesCount} libres ahora
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 font-semibold block">Productos en el Menú</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                    {menuItems.length}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {menuItems.filter((m) => m.available).length} disponibles p/ venta
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 4. CONFIGURAÇÃO DE MESAS DO SALÃO */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Configuración de Mesas del Salón ({tables.length})
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Agregue nuevas mesas, cambie la capacidad de lugares o elimine mesas libres.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenAddTable}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Mesa</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {tables.map((table) => {
                  const isOccupied = table.status === 'OCUPADA' || table.status === 'CONTA_SOLICITADA';
                  return (
                    <div
                      key={table.id}
                      className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-white">{table.label}</div>
                          <div className="text-[10px] text-stone-400">{table.capacity} lugares</div>
                        </div>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            table.status === 'LIVRE'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {table.status === 'LIVRE' ? 'LIBRE' : table.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-stone-900">
                        <button
                          onClick={() => handleOpenEditTable(table)}
                          className="text-[10px] font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            if (isOccupied) {
                              showToast('¡No es posible eliminar una mesa ocupada!', 'error');
                            } else {
                              setTableToDelete(table);
                            }
                          }}
                          disabled={isOccupied}
                          className={`text-[10px] font-semibold flex items-center gap-1 cursor-pointer ${
                            isOccupied ? 'opacity-30 cursor-not-allowed text-stone-600' : 'text-red-400 hover:underline'
                          }`}
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Add/Edit Employee */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingEmployee ? 'Editar Empleado del Equipo' : 'Agregar Empleado & Equipo'}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Registro exclusivo para empleados y equipo operativo (el Gerente/Admin queda separado).
            </p>

            {empFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{empFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Nombre del Empleado (para Acceso):</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo"
                  value={empFormName}
                  onChange={(e) => setEmpFormName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-amber-400 mb-1">Gmail de Acceso al Sistema:</label>
                <input
                  type="email"
                  required
                  placeholder="empleado@gmail.com"
                  value={empFormEmail}
                  onChange={(e) => setEmpFormEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-amber-400 mb-1">
                  {editingEmployee ? 'Contraseña de Acceso (deje en blanco para mantener la actual):' : 'Contraseña de Acceso:'}
                </label>
                <input
                  type="text"
                  required={!editingEmployee}
                  placeholder="Escriba la contraseña del empleado..."
                  value={empFormPassword}
                  onChange={(e) => setEmpFormPassword(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  El empleado accederá al sistema informando su Nombre, Gmail y esta Contraseña.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">C.I. / Documento (Opcional):</label>
                  <input
                    type="text"
                    placeholder="C.I. 3.456.789-0"
                    value={empFormCpf}
                    onChange={(e) => setEmpFormCpf(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="+595 981 000-000"
                    value={empFormPhone}
                    onChange={(e) => setEmpFormPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Seletor de Função na Equipe + Quais Funções o Funcionário Terá (no mesmo local) */}
              <div className="p-3.5 bg-stone-950 border border-amber-500/30 rounded-xl space-y-3">
                <div>
                  <label className="block font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Función en el Equipo (Solo Empleados):
                  </label>
                  <select
                    value={empFormRole === 'ADMIN' ? 'GARCOM' : empFormRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setEmpFormRole(nextRole);
                      setEmpFormPermissions(getDefaultPermissionsForRole(nextRole));
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="GARCOM">MOZO (Atención de Salón)</option>
                    <option value="CAIXA">CAJERO (Operador de Caja)</option>
                    <option value="COZINHA">COCINA / PARRILLERO (Equipo)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-stone-800 space-y-1.5">
                  <span className="block font-bold text-stone-200 text-[11px]">
                    Decidir qué funciones tendrá este empleado en el sistema:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      {
                        key: 'canCloseBills' as const,
                        label: 'Cerrar y cobrar cuentas de mesas',
                        desc: 'Permite liquidar pagos directamente en la comanda',
                      },
                      {
                        key: 'canManageTables' as const,
                        label: 'Transferir o unir mesas en el salón',
                        desc: 'Permite mover ítems y unificar comandas',
                      },
                      {
                        key: 'canCancelOrders' as const,
                        label: 'Cancelar ítems o pedidos registrados',
                        desc: 'Permite anular/cancelar ítems de comandas abiertas',
                      },
                      {
                        key: 'canApplyDiscounts' as const,
                        label: 'Aplicar descuentos en la cuenta',
                        desc: 'Permite otorgar descuento comercial en el cierre',
                      },
                      {
                        key: 'canAddStock' as const,
                        label: 'Registrar compras y entrada de stock (+Stock)',
                        desc: 'Permite cargar compras en el informe diario',
                      },
                    ].map((perm) => {
                      const isChecked = empFormPermissions[perm.key];
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer hover:border-amber-500/40 ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-stone-100'
                              : 'bg-stone-900/60 border-stone-800 text-stone-400'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block text-[11px]">{perm.label}</span>
                            <span className="text-[10px] text-stone-400 block">{perm.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setEmpFormPermissions((prev) => ({
                                ...prev,
                                [perm.key]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Salario Base (₲):</label>
                  <input
                    type="number"
                    step="100000"
                    placeholder="3200000"
                    value={empFormBaseSalary}
                    onChange={(e) => setEmpFormBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Estado de la Cuenta:</label>
                  <select
                    value={empFormActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEmpFormActive(e.target.value === 'ACTIVE')}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ACTIVE">Activo (Acceso Permitido)</option>
                    <option value="INACTIVE">Inactivo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Crear Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Credentials (Password & PIN) */}
      {showResetModal && resetTargetEmp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-600/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Restablecer Contraseña y PIN</h3>
                <p className="text-xs text-stone-400">
                  Colaborador: <strong className="text-stone-200">{resetTargetEmp.name}</strong> ({getRoleLabel(resetTargetEmp.role)})
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-4 bg-stone-950 p-3 rounded-xl border border-stone-800">
              Cambie la contraseña de acceso por correo o el PIN numérico rápido de 4 dígitos para terminales de atención.
            </p>

            <form onSubmit={handleConfirmResetCredentials} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nueva Contraseña de Acceso (Correo):
                </label>
                <input
                  type="text"
                  placeholder="Deje en blanco para mantener la actual"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nuevo PIN Numérico (4 Dígitos):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Ej: 7788"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-base font-bold"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  PIN actual de este usuario: <strong className="text-amber-400">{resetTargetEmp.pin}</strong>
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Confirmar Restablecimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Product (Simplificado com Quantidade para Venda) */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">
                {editingMenuItem ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <p className="text-xs text-stone-400">
                Registre el producto con la cantidad en stock para la venta por el mozo.
              </p>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nombre del Producto:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Picaña Prime 500g, Chopp 500ml..."
                  value={menuFormName}
                  onChange={(e) => setMenuFormName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Categoría:</label>
                  <select
                    value={menuFormCategory}
                    onChange={(e) => setMenuFormCategory(e.target.value as MenuCategory)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CORTES_NOBRES">Cortes Nobles</option>
                    <option value="RODIZIO">Rodízio</option>
                    <option value="ENTRADAS_GUARNACOES">Guarniciones & Entradas</option>
                    <option value="CHOPP_DRINKS">Chopp & Tragos</option>
                    <option value="BEBIDAS">Bebidas Sin Alcohol</option>
                    <option value="SOBREMESAS">Postres</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Precio de Venta (₲):
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    placeholder="180000"
                    value={menuFormPrice}
                    onChange={(e) => setMenuFormPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Costo / Compra (₲):
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="55000"
                    value={menuFormCostPrice}
                    onChange={(e) => setMenuFormCostPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-400 mb-1">
                    Cant. en Stock (p/ venta):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="30"
                    value={menuFormStockQuantity}
                    onChange={(e) => setMenuFormStockQuantity(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-600/70 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Descripción (Opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales del producto..."
                  value={menuFormDesc}
                  onChange={(e) => setMenuFormDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Table (Admin) */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">
                {editingTable ? `Editar ${editingTable.label}` : 'Registrar Nueva Mesa'}
              </h3>
              <p className="text-xs text-stone-400">
                Configure la identificación de la mesa y la cantidad de lugares.
              </p>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nombre / Número de la Mesa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mesa 15, Camarote VIP..."
                  value={tableFormLabel}
                  onChange={(e) => setTableFormLabel(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Capacidad (Lugares):
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={tableFormCapacity}
                  onChange={(e) => setTableFormCapacity(parseInt(e.target.value) || 2)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  {editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Table (Admin) */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-800/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-600/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Mesa?</h3>
                <p className="text-xs text-stone-400">
                  {tableToDelete.label} ({tableToDelete.capacity} lugares)
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300">
              ¿Está seguro de que desea eliminar esta mesa del salón? Acción exclusiva del administrador.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTable}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Employee Sales & Tips History Drill-down */}
      {selectedHistoryEmp && (
        <EmployeeHistoryModal
          employee={selectedHistoryEmp}
          comandas={comandas}
          settings={settings}
          onClose={() => setSelectedHistoryEmp(null)}
          onViewReceipt={(cmd) => setHistoryReceiptModalComanda(cmd)}
        />
      )}

      {/* Modal: Receipt viewer triggered from Employee History */}
      {historyReceiptModalComanda && (
        <ReceiptModal
          comanda={historyReceiptModalComanda}
          settings={settings}
          onClose={() => setHistoryReceiptModalComanda(null)}
        />
      )}
    </div>
  );
};
