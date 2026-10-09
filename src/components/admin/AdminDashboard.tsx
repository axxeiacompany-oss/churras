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
    showToast('Script SQL copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churrasgestao_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Arquivo churrasgestao_schema.sql baixado com sucesso!', 'success');
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
    setEmpFormError(null);
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpFormError(null);

    // Validate PIN (must be 4 digits)
    if (!/^\d{4}$/.test(empFormPin.trim())) {
      setEmpFormError('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    if (!empFormEmail.trim()) {
      setEmpFormError('Informe o e-mail do colaborador.');
      return;
    }

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
      });

      if (!res.success) {
        setEmpFormError(res.error || 'Erro ao criar conta.');
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
      showToast('O novo PIN deve ter exatamente 4 dígitos.', 'warning');
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
      showToast('Nome/número da mesa é obrigatório.', 'error');
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
              <span>Visão Geral & Métricas</span>
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
              <span>Controle de Funcionários ({employees.length})</span>
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
              <span>Produtos ({menuItems.length})</span>
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
              <span>Relatório Diário (PDF)</span>
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
              <span>Mapa do Salão ({tables.length} mesas)</span>
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
              <span>Fluxo de Caixa & Auditoria</span>
            </button>

            <button
              onClick={() => setActiveTab('AUTOMATIONS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'AUTOMATIONS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Automações & Alertas</span>
              {alertsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                  {alertsCount}
                </span>
              )}
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
              <span>Relatórios & BI</span>
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
              <span>Configurações</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && <DailyMonitoringTab />}

      {/* TAB 2: EMPLOYEES */}
      {activeTab === 'EMPLOYEES' && (() => {
        // Compute filtered employees
        const filteredEmployees = employees.filter((emp) => {
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
          <div className="space-y-4">
            {/* Header & Add Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Cadastro de Funcionários & Equipe ({employees.length})
                </h3>
                <p className="text-xs text-stone-400">
                  Gestão completa de dados cadastrais, remuneração, metas e controle de permissões.
                </p>
              </div>
              <button
                onClick={handleOpenAddEmployee}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Funcionário</span>
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou C.I...."
                    value={empSearch}
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      setEmpCurrentPage(1);
                    }}
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Filter by Role */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <select
                    value={empRoleFilter}
                    onChange={(e) => {
                      setEmpRoleFilter(e.target.value as UserRole | 'ALL');
                      setEmpCurrentPage(1);
                    }}
                    className="w-full bg-transparent text-stone-200 focus:outline-none text-xs"
                  >
                    <option value="ALL">Todos os Cargos</option>
                    <option value="ADMIN">Admin / Gerente</option>
                    <option value="CAIXA">Caixa</option>
                    <option value="GARCOM">Garçom</option>
                  </select>
                </div>

                {/* Filter by Shift */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <select
                    value={empShiftFilter}
                    onChange={(e) => {
                      setEmpShiftFilter(e.target.value as ShiftType | 'ALL');
                      setEmpCurrentPage(1);
                    }}
                    className="w-full bg-transparent text-stone-200 focus:outline-none text-xs"
                  >
                    <option value="ALL">Todos os Turnos</option>
                    <option value="ALMOCO">Turno Almoço</option>
                    <option value="JANTAR">Turno Jantar</option>
                    <option value="AMBOS">Ambos (Integral)</option>
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
                    <option value="ALL">Todos os Status</option>
                    <option value="ACTIVE">Apenas Ativos</option>
                    <option value="INACTIVE">Apenas Inativos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Empty state */}
            {filteredEmployees.length === 0 ? (
              <div className="bg-stone-900 border border-dashed border-stone-800 rounded-2xl p-10 text-center text-xs text-stone-400 space-y-2">
                <Users className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="font-semibold text-stone-200">Nenhum funcionário encontrado com os filtros atuais.</p>
                <button
                  onClick={() => {
                    setEmpSearch('');
                    setEmpRoleFilter('ALL');
                    setEmpShiftFilter('ALL');
                    setEmpStatusFilter('ALL');
                  }}
                  className="text-amber-400 underline font-medium"
                >
                  Limpar todos os filtros
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
                          {emp.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>

                      {/* Detail Fields Grid */}
                      <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 text-xs space-y-1.5">
                        <div className="flex justify-between text-stone-400">
                          <span>C.I. / Doc:</span>
                          <span className="text-stone-200 font-mono text-[11px] font-semibold">{emp.cpf || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>E-mail:</span>
                          <span className="text-stone-200 font-mono text-[11px] truncate max-w-[170px]">{emp.email}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Telefone:</span>
                          <span className="text-stone-200">{emp.phone || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Turno:</span>
                          <span className="text-stone-200 font-semibold">{emp.shift}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Admissão:</span>
                          <span className="text-stone-300">
                            {emp.admissionDate ? new Date(emp.admissionDate + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Salário Base:</span>
                          <span className="text-stone-200 font-mono font-semibold">{formatCurrency(emp.baseSalary || 0)}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Comissão:</span>
                          <span className="text-amber-400 font-mono font-bold">{emp.commissionRate}%</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Meta Mensal:</span>
                          <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(emp.monthlyTarget || 0)}</span>
                        </div>
                        <div className="flex justify-between text-stone-400 pt-1 border-t border-stone-900">
                          <span>PIN de Acesso:</span>
                          <span className="font-mono text-stone-200 font-bold bg-stone-900 px-2 py-0.5 rounded text-[11px]">
                            {emp.pin}
                          </span>
                        </div>
                      </div>

                      {/* Performance & History Action Button */}
                      <button
                        onClick={() => setSelectedHistoryEmp(emp)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/40 text-amber-300 text-xs font-bold transition-all"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Histórico de Vendas & Gorjetas</span>
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
                          {emp.active ? 'Desativar' : 'Ativar Conta'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenResetCredentials(emp)}
                            title="Redefinir Senha ou PIN de Acesso"
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 text-stone-300 hover:text-amber-400 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditEmployee(emp)}
                            title="Editar Dados Cadastrais"
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {employees.length > 1 && (
                            <button
                              onClick={() => deleteEmployee(emp.id)}
                              title="Remover Colaborador"
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
              <h3 className="text-base font-bold text-white">Produtos</h3>
              <p className="text-xs text-stone-400">
                Ajuste preços, pause itens esgotados e adicione novidades ao rodízio ou à la carte.
              </p>
            </div>
            <button
              onClick={handleOpenAddMenuItem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar produto..."
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
              <option value="ALL">Todas as Categorias</option>
              <option value="CORTES_NOBRES">Cortes Nobres</option>
              <option value="RODIZIO">Rodízio</option>
              <option value="ENTRADAS_GUARNACOES">Guarnições & Entradas</option>
              <option value="CHOPP_DRINKS">Chopp & Drinks</option>
              <option value="BEBIDAS">Bebidas Sem Álcool</option>
              <option value="SOBREMESAS">Sobremesas</option>
            </select>
          </div>

          {/* Items Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Produto / Descrição</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Preço Venda</th>
                    <th className="p-3.5">Preço Custo</th>
                    <th className="p-3.5 text-center">Qtd Estoque (p/ venda)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
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
                            {item.available ? 'Disponível' : 'Pausado'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMenuItem(item)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteMenuItem(item.id)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 transition cursor-pointer"
                              title="Excluir Produto"
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
              <h3 className="text-base font-bold text-white">Salão & Mesas</h3>
              <p className="text-xs text-stone-400">
                Gerenciamento exclusivo do Administrador: crie, edite a capacidade e exclua mesas desocupadas.
              </p>
            </div>
            <button
              onClick={handleOpenAddTable}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Mesa</span>
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
                      {table.status}
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
                      title="Editar nome e capacidade da mesa"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (isOccupied) {
                          showToast('Não é possível excluir uma mesa ocupada!', 'error');
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
                      title={isOccupied ? 'Mesa em atendimento' : 'Excluir esta mesa'}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
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

      {/* TAB 6: AUTOMATIONS & ALERTS */}
      {activeTab === 'AUTOMATIONS' && <AutomationsTab />}

      {/* TAB 8: RELATÓRIOS & BI */}
      {activeTab === 'REPORTS' && <ReportsTab />}

      {/* TAB 9: RESTAURANT SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg max-w-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Configurações Gerais da Churrascaria</h3>
            <p className="text-xs text-stone-400">
              Personalize dados para o cupom não fiscal e parâmetros de cobrança.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Nome Fantasia do Restaurante:
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSettings({ name: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">CNPJ:</label>
                <input
                  type="text"
                  value={settings.cnpj}
                  onChange={(e) => updateSettings({ cnpj: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Telefone:</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => updateSettings({ phone: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">Endereço:</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => updateSettings({ address: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Rodízio Adulto (₲):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.rodizioAdultPrice}
                  onChange={(e) =>
                    updateSettings({ rodizioAdultPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Rodízio Infantil (₲):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.rodizioChildPrice}
                  onChange={(e) =>
                    updateSettings({ rodizioChildPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Rodízio Idoso / 60+ (₲):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.rodizioSeniorPrice}
                  onChange={(e) =>
                    updateSettings({ rodizioSeniorPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Buffet por Quilo (₲/kg):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.kiloPrice}
                  onChange={(e) =>
                    updateSettings({ kiloPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Taxa Serviço (%):
                </label>
                <input
                  type="number"
                  value={settings.serviceTaxPercentage}
                  onChange={(e) =>
                    updateSettings({ serviceTaxPercentage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {/* SEÇÃO: CONTROLE DE PERMISSÕES DA EQUIPE (EXCLUSIVO DO ADMINISTRADOR) */}
            <div className="pt-5 border-t border-stone-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Permissões de Operações da Equipe
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Somente o Administrador tem a função de permitir ou restringir operações aos funcionários.
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-stone-950 p-3.5 rounded-xl border border-stone-800/80">
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900 transition cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Permitir Garçom cancelar itens/pedidos</span>
                    <span className="text-[10px] text-stone-400">Se desativado, apenas o Administrador pode estornar ou cancelar lançamentos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowStaffCancelOrder || false}
                    onChange={(e) => updateSettings({ allowStaffCancelOrder: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900 transition cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Permitir Garçom aplicar descontos</span>
                    <span className="text-[10px] text-stone-400">Se desativado, concessão de desconto na conta exige senha de Administrador</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowStaffDiscounts || false}
                    onChange={(e) => updateSettings({ allowStaffDiscounts: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900 transition cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Permitir Garçom fechar e receber contas (PDV)</span>
                    <span className="text-[10px] text-stone-400">Se desativado, o garçom apenas solicita a conta para quitação no Caixa</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowStaffCloseBill || false}
                    onChange={(e) => updateSettings({ allowStaffCloseBill: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900 transition cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Permitir Funcionário registrar compras de produtos (+Estoque)</span>
                    <span className="text-[10px] text-stone-400">Se desativado, somente o Administrador pode dar entrada de aquisição</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowStaffAddStock || false}
                    onChange={(e) => updateSettings({ allowStaffAddStock: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900 transition cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Permitir Garçom transferir ou juntar mesas</span>
                    <span className="text-[10px] text-stone-400">Controle de movimentações de salão e agrupamento de comandas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowStaffManageTables !== false}
                    onChange={(e) => updateSettings({ allowStaffManageTables: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Seção de Entrega & Banco de Dados (Supabase / SQL) */}
          <div className="pt-6 border-t border-stone-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Banco de Dados & Script SQL (Supabase)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Entrega
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Schema completo com 14 tabelas, triggers inteligentes, RLS de segurança e carga inicial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    copiedSql
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                  }`}
                  title="Copiar SQL completo"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
                  title="Baixar arquivo schema.sql"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .sql</span>
                </button>
              </div>
            </div>

            {/* Informações do Administrador Inicial e Credenciais */}
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Credenciais do Administrador Inicial (Entrega):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-stone-300">
                <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block text-[10px]">E-mail Admin:</span>
                  <span className="text-amber-300 font-bold">admin@churrascaria.com</span>
                </div>
                <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block text-[10px]">Senha Padrão:</span>
                  <span className="text-amber-300 font-bold">admin</span>
                </div>
                <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block text-[10px]">PIN Rápido (4 dígitos):</span>
                  <span className="text-amber-300 font-bold">1234</span>
                </div>
              </div>
            </div>

            {/* Toggle para visualizar o código SQL */}
            <div>
              <button
                type="button"
                onClick={() => setShowSqlViewer(!showSqlViewer)}
                className="text-xs font-semibold text-stone-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                <span>{showSqlViewer ? 'Ocultar código do Script SQL' : 'Visualizar código do Script SQL (/supabase/schema.sql)'}</span>
              </button>

              {showSqlViewer && (
                <div className="mt-2 relative">
                  <pre className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-[10px] font-mono text-stone-300 max-h-64 overflow-y-auto overflow-x-auto whitespace-pre">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Employee */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingEmployee ? 'Editar Dados do Funcionário' : 'Novo Funcionário (Criar Conta)'}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Cadastro exclusivo administrativo. O colaborador usará estes dados para acessar o sistema.
            </p>

            {empFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{empFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silveira"
                  value={empFormName}
                  onChange={(e) => setEmpFormName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">E-mail de Acesso:</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@churrascaria.com"
                    value={empFormEmail}
                    onChange={(e) => setEmpFormEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">C.I. / Documento:</label>
                  <input
                    type="text"
                    required
                    placeholder="C.I. 3.456.789-0"
                    value={empFormCpf}
                    onChange={(e) => setEmpFormCpf(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={empFormPhone}
                    onChange={(e) => setEmpFormPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Data de Admissão:</label>
                  <input
                    type="date"
                    required
                    value={empFormAdmissionDate}
                    onChange={(e) => setEmpFormAdmissionDate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Perfil / Cargo:</label>
                  <select
                    value={empFormRole}
                    onChange={(e) => setEmpFormRole(e.target.value as UserRole)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ADMIN">ADMIN (Dono/Gerente)</option>
                    <option value="CAIXA">CAIXA (Operador)</option>
                    <option value="GARCOM">GARÇOM (Salão)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Turno de Trabalho:</label>
                  <select
                    value={empFormShift}
                    onChange={(e) => setEmpFormShift(e.target.value as ShiftType)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ALMOCO">Almoço</option>
                    <option value="JANTAR">Jantar</option>
                    <option value="AMBOS">Ambos (Integral)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Salário Base (₲):</label>
                  <input
                    type="number"
                    step="100000"
                    required
                    placeholder="3200000"
                    value={empFormBaseSalary}
                    onChange={(e) => setEmpFormBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Comissão / Gorjeta (%):</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={empFormCommission}
                    onChange={(e) => setEmpFormCommission(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Meta Mensal de Vendas (₲):</label>
                  <input
                    type="number"
                    step="500000"
                    placeholder="45000000"
                    value={empFormMonthlyTarget}
                    onChange={(e) => setEmpFormMonthlyTarget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Status da Conta:</label>
                  <select
                    value={empFormActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEmpFormActive(e.target.value === 'ACTIVE')}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ACTIVE">Ativo (Permitido Acesso)</option>
                    <option value="INACTIVE">Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-800">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    {editingEmployee ? 'Senha (em branco mantém):' : 'Senha de Acesso:'}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={empFormPassword}
                    onChange={(e) => setEmpFormPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">PIN Numérico (4 Dígitos):</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="Ex: 1234"
                    value={empFormPin}
                    onChange={(e) => setEmpFormPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm font-bold"
                  />
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
                  {editingEmployee ? 'Salvar Alterações' : 'Criar Colaborador'}
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
                <h3 className="text-base font-bold text-white">Redefinir Senha e PIN</h3>
                <p className="text-xs text-stone-400">
                  Colaborador: <strong className="text-stone-200">{resetTargetEmp.name}</strong> ({getRoleLabel(resetTargetEmp.role)})
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-4 bg-stone-950 p-3 rounded-xl border border-stone-800">
              Altere a senha de acesso por e-mail ou o PIN numérico rápido de 4 dígitos para terminais de atendimento.
            </p>

            <form onSubmit={handleConfirmResetCredentials} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nova Senha de Acesso (E-mail):
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para manter a atual"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Novo PIN Numérico (4 Dígitos):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Ex: 7788"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-base font-bold"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  PIN atual deste usuário: <strong className="text-amber-400">{resetTargetEmp.pin}</strong>
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
                  Confirmar Redefinição
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
                {editingMenuItem ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <p className="text-xs text-stone-400">
                Cadastre o produto com a quantidade em estoque para venda pelo garçom.
              </p>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Picanha Prime 500g, Chopp 500ml..."
                  value={menuFormName}
                  onChange={(e) => setMenuFormName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Categoria:</label>
                  <select
                    value={menuFormCategory}
                    onChange={(e) => setMenuFormCategory(e.target.value as MenuCategory)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CORTES_NOBRES">Cortes Nobres</option>
                    <option value="RODIZIO">Rodízio</option>
                    <option value="ENTRADAS_GUARNACOES">Guarnições & Entradas</option>
                    <option value="CHOPP_DRINKS">Chopp & Drinks</option>
                    <option value="BEBIDAS">Bebidas Sem Álcool</option>
                    <option value="SOBREMESAS">Sobremesas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Preço de Venda (₲ / R$):
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
                    Custo / Compra (₲ / R$):
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
                    Qtd em Estoque (p/ venda):
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
                <label className="block font-semibold text-stone-300 mb-1">Descrição (Opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais do produto..."
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
                  Salvar Produto
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
                {editingTable ? `Editar ${editingTable.label}` : 'Cadastrar Nova Mesa'}
              </h3>
              <p className="text-xs text-stone-400">
                Configure a identificação da mesa e a quantidade de lugares.
              </p>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nome / Número da Mesa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mesa 15, Camarote VIP..."
                  value={tableFormLabel}
                  onChange={(e) => setTableFormLabel(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Capacidade (Lugares):
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
                  {editingTable ? 'Salvar Alterações' : 'Criar Mesa'}
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
                <h3 className="text-base font-bold text-white">Excluir Mesa?</h3>
                <p className="text-xs text-stone-400">
                  {tableToDelete.label} ({tableToDelete.capacity} lugares)
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300">
              Tem certeza que deseja remover esta mesa do salão? Ação exclusiva do administrador.
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
                Confirmar Exclusão
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
