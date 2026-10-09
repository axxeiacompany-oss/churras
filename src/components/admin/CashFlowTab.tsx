import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import {
  CashMovement,
  ExpenseBill,
  ExpenseCategory,
  PaymentMethod,
  CashClosingRecord,
  CashMovementType,
} from '../../types';
import { formatCurrency, formatTime, formatDate, getPaymentMethodLabel } from '../../utils/format';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Minus,
  Lock,
  Unlock,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  X,
  FileText,
  Clock,
  Sparkles,
  Scale,
  RefreshCw,
  Percent,
  Check,
  Building,
  Flame,
  Zap,
  Mail,
  MessageSquare,
  Copy,
} from 'lucide-react';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FORNECEDOR_CARNE: 'Fornecedor de Carnes Nobres',
  GAS_CARVAO: 'Gás & Carvão / Lenha',
  BEBIDAS_ESTOQUE: 'Bebidas & Chopp (Estoque)',
  HORTIFRUTI: 'Hortifrúti & Saladas',
  ALUGUEL: 'Aluguel do Imóvel Comercial',
  ENERGIA_AGUA: 'Energia Elétrica & Água',
  SALARIOS: 'Salários & Folha de Pagamento',
  IMPOSTOS: 'Tributos & Impostos Fiscais (DAS)',
  MANUTENCAO: 'Manutenção da Grelha e Cozinha',
  OUTROS: 'Outras Despesas Operacionais',
};

export const CashFlowTab: React.FC = () => {
  const {
    cashSession,
    comandas,
    employees,
    settings,
    bills,
    cashClosings,
    addCashMovement,
    addExpenseBill,
    payExpenseBill,
    deleteExpenseBill,
    closeShiftCash,
    refundComanda,
    releaseTipsDistribution,
    processMonthlyCommissions,
    showToast,
  } = useChurras();

  // Navigation subtabs
  const [subTab, setSubTab] = useState<
    'LIVRO_CAIXA' | 'CONTAS_PAGAR' | 'CONTA_GORJETAS' | 'FECHAMENTOS' | 'GRAFICO'
  >('LIVRO_CAIXA');

  // Search & Filters for Movements
  const [movementSearch, setMovementSearch] = useState<string>('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');

  // Search & Filters for Bills
  const [billStatusFilter, setBillStatusFilter] = useState<'ALL' | 'PENDENTE' | 'ATRASADO' | 'PAGO'>('ALL');
  const [billCategoryFilter, setBillCategoryFilter] = useState<string>('ALL');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showSangriaModal, setShowSangriaModal] = useState<boolean>(false);
  const [showSuprimentoModal, setShowSuprimentoModal] = useState<boolean>(false);
  const [showClosingModal, setShowClosingModal] = useState<boolean>(false);
  const [showTipsModal, setShowTipsModal] = useState<boolean>(false);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState<boolean>(false);
  const [closingSummaryRecord, setClosingSummaryRecord] = useState<CashClosingRecord | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Forms state
  // 1. New Expense Bill Form
  const [expDesc, setExpDesc] = useState<string>('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('FORNECEDOR_CARNE');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDueDate, setExpDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expSupplier, setExpSupplier] = useState<string>('');
  const [expReceipt, setExpReceipt] = useState<string>('');
  const [expPayNow, setExpPayNow] = useState<boolean>(false);
  const [expPaymentMethod, setExpPaymentMethod] = useState<PaymentMethod>('PIX');
  const [expNotes, setExpNotes] = useState<string>('');

  // 2. Sangria / Suprimento Form
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickDesc, setQuickDesc] = useState<string>('');

  // 3. Closing Form (Esperado x Contado)
  const [closingType, setClosingType] = useState<'TURNO' | 'MENSAL'>('TURNO');
  const [closingPeriod, setClosingPeriod] = useState<string>(`Turno Atual - ${formatDate(new Date().toISOString())}`);
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');

  // 4. Refund Form
  const [refundComandaId, setRefundComandaId] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Cancelamento solicitado pelo cliente');

  // 5. Tips Distribution Form
  const [tipsDistAmount, setTipsDistAmount] = useState<string>('');
  const [tipsDistDesc, setTipsDistDesc] = useState<string>('Repasse quinzenal da taxa de serviço à equipe');

  // --- Financial Ledger Calculations ---
  const ledgerMetrics = useMemo(() => {
    let totalEntries = 0;
    let totalExits = 0;
    let cashEntries = 0;
    let cashExits = 0;

    cashSession.movements.forEach((m) => {
      const isEntry = m.type === 'VENDA' || m.type === 'SUPRIMENTO';
      if (isEntry) {
        totalEntries += m.amount;
        if (m.paymentMethod === 'DINHEIRO') cashEntries += m.amount;
      } else {
        totalExits += m.amount;
        if (m.paymentMethod === 'DINHEIRO') cashExits += m.amount;
      }
    });

    const initial = cashSession.initialCash || 0;
    const currentCashInDrawer = Math.max(0, initial + cashEntries - cashExits);
    const netCashFlow = totalEntries - totalExits;

    // Projected Balance: Current Cash + Open Comandas Expected - Pending Bills
    const openComandasRevenue = comandas
      .filter((c) => c.status === 'ABERTA' || c.status === 'CONTA_SOLICITADA')
      .reduce((sum, c) => sum + c.total, 0);

    const pendingBillsTotal = bills
      .filter((b) => b.status === 'PENDENTE' || b.status === 'ATRASADO')
      .reduce((sum, b) => sum + b.amount, 0);

    const projectedBalance = netCashFlow + openComandasRevenue - pendingBillsTotal;

    // Tips and Service Fee Account:
    // 10% from all paid comandas that included service
    const totalTipsCollected = comandas
      .filter((c) => c.status === 'PAGA')
      .reduce((sum, c) => sum + (c.includeService ? c.serviceFee : 0), 0);

    const totalTipsRepassed = cashSession.movements
      .filter((m) => m.type === 'REPASSE_GORJETA' || m.type === 'COMISSAO')
      .reduce((sum, m) => sum + m.amount, 0);

    const tipsAccountBalance = Math.max(0, totalTipsCollected - totalTipsRepassed);

    // Overdue or warning bills
    const todayStr = new Date().toISOString().split('T')[0];
    const urgentBills = bills.filter((b) => {
      if (b.status === 'PAGO') return false;
      return b.dueDate <= todayStr || b.status === 'ATRASADO';
    });

    return {
      totalEntries,
      totalExits,
      netCashFlow,
      currentCashInDrawer,
      projectedBalance,
      openComandasRevenue,
      pendingBillsTotal,
      totalTipsCollected,
      totalTipsRepassed,
      tipsAccountBalance,
      urgentBillsCount: urgentBills.length,
      urgentBillsTotal: urgentBills.reduce((s, b) => s + b.amount, 0),
    };
  }, [cashSession, comandas, bills]);

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return cashSession.movements.filter((m) => {
      if (movementTypeFilter !== 'ALL' && m.type !== movementTypeFilter) return false;
      if (paymentMethodFilter !== 'ALL' && m.paymentMethod !== paymentMethodFilter) return false;
      if (movementSearch) {
        const q = movementSearch.toLowerCase();
        return (
          m.description.toLowerCase().includes(q) ||
          m.operatorName.toLowerCase().includes(q) ||
          (m.comandaCode && m.comandaCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cashSession.movements, movementTypeFilter, paymentMethodFilter, movementSearch]);

  // Filtered bills list
  const filteredBills = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return bills.filter((b) => {
      const isOverdue = b.status !== 'PAGO' && b.dueDate < todayStr;
      if (billStatusFilter === 'ATRASADO' && !isOverdue) return false;
      if (billStatusFilter === 'PENDENTE' && b.status !== 'PENDENTE') return false;
      if (billStatusFilter === 'PAGO' && b.status !== 'PAGO') return false;
      if (billCategoryFilter !== 'ALL' && b.category !== billCategoryFilter) return false;
      return true;
    });
  }, [bills, billStatusFilter, billCategoryFilter]);

  // Submit Handlers
  const handleCreateExpenseBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0) {
      showToast('Digite um valor numérico válido para a despesa.', 'warning');
      return;
    }

    addExpenseBill({
      description: expDesc.trim(),
      category: expCategory,
      amount,
      dueDate: expDueDate,
      status: expPayNow ? 'PAGO' : 'PENDENTE',
      paymentDate: expPayNow ? new Date().toISOString().split('T')[0] : undefined,
      paymentMethod: expPayNow ? expPaymentMethod : undefined,
      supplier: expSupplier.trim() || undefined,
      receiptNumber: expReceipt.trim() || undefined,
      notes: expNotes.trim() || undefined,
      registeredBy: 'Administrador',
    });

    setShowExpenseModal(false);
    setExpDesc('');
    setExpAmount('');
    setExpSupplier('');
    setExpReceipt('');
    setExpNotes('');
    setExpPayNow(false);
  };

  const handleConfirmSangria = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!amt || amt <= 0) return;

    addCashMovement(
      'SANGRIA',
      amt,
      'DINHEIRO',
      quickDesc.trim() || 'Sangria de segurança para o cofre central'
    );
    showToast(`Sangria de ${formatCurrency(amt)} registrada!`, 'success');
    setShowSangriaModal(false);
    setQuickAmount('');
    setQuickDesc('');
  };

  const handleConfirmSuprimento = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!amt || amt <= 0) return;

    addCashMovement(
      'SUPRIMENTO',
      amt,
      'DINHEIRO',
      quickDesc.trim() || 'Suprimento de troco para a gaveta'
    );
    showToast(`Suprimento de ${formatCurrency(amt)} adicionado ao caixa!`, 'success');
    setShowSuprimentoModal(false);
    setQuickAmount('');
    setQuickDesc('');
  };

  const handleConfirmClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCashInput);
    if (isNaN(counted)) {
      showToast('Informe o valor contado na gaveta.', 'warning');
      return;
    }

    const record = closeShiftCash({
      type: closingType,
      periodLabel: closingPeriod.trim() || 'Fechamento de Turno',
      countedCash: counted,
      notes: closingNotes.trim() || undefined,
    });

    setShowClosingModal(false);
    setCountedCashInput('');
    setClosingNotes('');
    setClosingSummaryRecord(record);
  };

  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundComandaId) return;

    refundComanda(refundComandaId, refundReason.trim());
    setShowRefundModal(false);
    setRefundComandaId('');
  };

  const handleConfirmTipsDist = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(tipsDistAmount);
    if (!amt || amt <= 0) return;

    releaseTipsDistribution(amt, tipsDistDesc.trim());
    setShowTipsModal(false);
    setTipsDistAmount('');
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'ID Movimento',
      'Data/Hora',
      'Tipo',
      'Descrição',
      'Forma de Pagamento',
      'Operador',
      'Comanda Ref.',
      'Valor (R$)',
    ];

    const rows = cashSession.movements.map((m) => [
      m.id,
      m.timestamp,
      m.type,
      `"${m.description.replace(/"/g, '""')}"`,
      m.paymentMethod || 'N/A',
      `"${m.operatorName}"`,
      m.comandaCode || '-',
      (m.type === 'VENDA' || m.type === 'SUPRIMENTO' ? m.amount : -m.amount).toFixed(2),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fluxo_de_caixa_churrascaria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha Excel (.csv) exportada com sucesso!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Cards */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-100 tracking-tight">
                Fluxo de Caixa Automatizado & DRE
              </h2>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                GESTÃO FINANCEIRA
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Controle de entradas automáticas, despesas manuais, contas a pagar, comissões e conciliação
            </p>
          </div>

          {/* Action buttons toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Lançar Despesa
            </button>

            <button
              onClick={() => setShowSuprimentoModal(true)}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />
              Suprimento (+)
            </button>

            <button
              onClick={() => setShowSangriaModal(true)}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
              Sangria (-)
            </button>

            <button
              onClick={() => setShowClosingModal(true)}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              Conferir / Fechar Caixa
            </button>

            <button
              onClick={() => processMonthlyCommissions('Outubro/2026')}
              className="px-3 py-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Apurar comissões de todos os garçons e lançar saída no caixa"
            >
              <Percent className="w-3.5 h-3.5" />
              Apurar Comissões
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-emerald-400 rounded-xl transition cursor-pointer"
              title="Exportar para Excel (.csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowPrintReportModal(true)}
              className="p-2 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl transition cursor-pointer"
              title="Relatório / Imprimir PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Saldo em Gaveta */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/90 shadow-md">
            <span className="text-[11px] font-semibold text-stone-400 block">Dinheiro em Gaveta</span>
            <div className="text-xl font-black text-amber-300 font-mono mt-1 tabular-nums">
              {formatCurrency(ledgerMetrics.currentCashInDrawer)}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Fundo inicial: {formatCurrency(cashSession.initialCash || 0)}
            </div>
          </div>

          {/* Card 2: Entradas Totais */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/90 shadow-md">
            <span className="text-[11px] font-semibold text-emerald-400 block">Entradas Acumuladas</span>
            <div className="text-xl font-black text-emerald-300 font-mono mt-1 tabular-nums">
              {formatCurrency(ledgerMetrics.totalEntries)}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Vendas + Suprimentos recebidos
            </div>
          </div>

          {/* Card 3: Saídas Totais */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/90 shadow-md">
            <span className="text-[11px] font-semibold text-red-400 block">Saídas & Despesas</span>
            <div className="text-xl font-black text-red-400 font-mono mt-1 tabular-nums">
              {formatCurrency(ledgerMetrics.totalExits)}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Despesas + Sangrias + Estornos
            </div>
          </div>

          {/* Card 4: Saldo Projetado */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/90 shadow-md">
            <span className="text-[11px] font-semibold text-blue-400 block">Saldo Projetado</span>
            <div className="text-xl font-black text-blue-300 font-mono mt-1 tabular-nums">
              {formatCurrency(ledgerMetrics.projectedBalance)}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              -{formatCurrency(ledgerMetrics.pendingBillsTotal)} a pagar
            </div>
          </div>

          {/* Card 5: Conta Gorjetas & Taxa */}
          <div className="p-4 rounded-xl bg-stone-950 border border-purple-500/30 shadow-md bg-purple-950/10 col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-purple-400 block">Conta de Gorjetas (10%)</span>
            <div className="text-xl font-black text-purple-300 font-mono mt-1 tabular-nums">
              {formatCurrency(ledgerMetrics.tipsAccountBalance)}
            </div>
            <button
              onClick={() => setShowTipsModal(true)}
              className="text-[10px] text-purple-400 hover:underline font-semibold mt-1 block cursor-pointer"
            >
              Realizar Repasse aos Funcionários →
            </button>
          </div>
        </div>

        {/* Urgent Bills Warning Banner */}
        {ledgerMetrics.urgentBillsCount > 0 && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> {ledgerMetrics.urgentBillsCount} conta(s) a pagar com vencimento
                hoje ou em atraso ({formatCurrency(ledgerMetrics.urgentBillsTotal)}).
              </span>
            </div>
            <button
              onClick={() => {
                setSubTab('CONTAS_PAGAR');
                setBillStatusFilter('ATRASADO');
              }}
              className="px-2.5 py-1 rounded-lg bg-red-800/50 hover:bg-red-800 text-white font-bold text-[11px] transition cursor-pointer"
            >
              Ver Contas Urgentes
            </button>
          </div>
        )}
      </div>

      {/* 2. Subnavigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 pb-3">
        {(
          [
            { id: 'LIVRO_CAIXA', label: 'Livro Caixa (Extrato em Tempo Real)', count: cashSession.movements.length },
            { id: 'CONTAS_PAGAR', label: 'Contas a Pagar & Despesas', count: bills.filter((b) => b.status !== 'PAGO').length },
            { id: 'CONTA_GORJETAS', label: 'Conta de Gorjetas / Repasses', count: null },
            { id: 'FECHAMENTOS', label: 'Histórico de Fechamentos (Auditoria)', count: cashClosings.length },
            { id: 'GRAFICO', label: 'Gráfico Entradas x Saídas', count: null },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === tab.id
                ? 'bg-stone-800 text-white shadow-sm border border-stone-700'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="px-1.5 py-0.2 rounded-md bg-stone-950 text-stone-300 font-mono text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: LIVRO CAIXA (MOVIMENTAÇÕES) */}
      {subTab === 'LIVRO_CAIXA' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-3 rounded-2xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                placeholder="Buscar movimentação, descrição..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Type filter */}
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="VENDA">Vendas (Entrada)</option>
                <option value="DESPESA">Despesas (Saída)</option>
                <option value="SANGRIA">Sangrias (-)</option>
                <option value="SUPRIMENTO">Suprimentos (+)</option>
                <option value="ESTORNO">Estornos (-)</option>
                <option value="REPASSE_GORJETA">Repasse Gorjeta</option>
                <option value="COMISSAO">Comissões Garçom</option>
              </select>

              {/* Payment Method filter */}
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Todas Formas Pgto</option>
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CREDITO">Cartão Crédito</option>
                <option value="DEBITO">Cartão Débito</option>
                <option value="VR_VA">VR / VA</option>
              </select>

              <button
                onClick={() => setShowRefundModal(true)}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Estornar Comanda
              </button>
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Data/Hora</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Descrição da Movimentação</th>
                    <th className="py-3 px-3">Forma Pgto</th>
                    <th className="py-3 px-3">Operador</th>
                    <th className="py-3 px-3 text-right">Valor Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        Nenhuma movimentação financeira encontrada com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isEntry = m.type === 'VENDA' || m.type === 'SUPRIMENTO';

                      const typeColor =
                        m.type === 'VENDA'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : m.type === 'SUPRIMENTO'
                          ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                          : m.type === 'SANGRIA'
                          ? 'bg-red-950/60 text-red-400 border-red-800/60'
                          : m.type === 'ESTORNO'
                          ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                          : m.type === 'REPASSE_GORJETA' || m.type === 'COMISSAO'
                          ? 'bg-purple-950/60 text-purple-400 border-purple-800/60'
                          : 'bg-stone-800 text-stone-300 border-stone-700';

                      return (
                        <tr key={m.id} className="hover:bg-stone-800/40 transition">
                          <td className="py-3 px-3 font-mono text-stone-400 whitespace-nowrap">
                            {formatTime(m.timestamp)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor}`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-stone-100">{m.description}</div>
                            {m.comandaCode && (
                              <span className="text-[10px] text-amber-500 font-mono">
                                Ref: {m.comandaCode}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-300 whitespace-nowrap">
                            {m.paymentMethod ? getPaymentMethodLabel(m.paymentMethod) : '-'}
                          </td>
                          <td className="py-3 px-3 text-stone-400 whitespace-nowrap">
                            {m.operatorName}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                            <span className={isEntry ? 'text-emerald-400' : 'text-red-400'}>
                              {isEntry ? '+' : '-'} {formatCurrency(m.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAS A PAGAR & DESPESAS MANUAIS */}
      {subTab === 'CONTAS_PAGAR' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-3 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter tabs */}
              {(['ALL', 'PENDENTE', 'ATRASADO', 'PAGO'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setBillStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    billStatusFilter === st
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-stone-950 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Todas as Contas'
                    : st === 'PENDENTE'
                    ? 'A Vencer'
                    : st === 'ATRASADO'
                    ? 'Vencidas / Alerta'
                    : 'Pagas'}
                </button>
              ))}

              {/* Category filter */}
              <select
                value={billCategoryFilter}
                onChange={(e) => setBillCategoryFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Todas as Categorias</option>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Conta a Pagar
            </button>
          </div>

          {/* Bills List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.length === 0 ? (
              <div className="col-span-full bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center text-stone-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40 mb-2" />
                <p className="text-sm font-semibold text-stone-300">Nenhuma conta encontrada nesta seleção.</p>
                <p className="text-xs text-stone-500 mt-0.5">Todas as contas filtradas estão em dia.</p>
              </div>
            ) : (
              filteredBills.map((bill) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = bill.status !== 'PAGO' && bill.dueDate < todayStr;
                const isDueToday = bill.status !== 'PAGO' && bill.dueDate === todayStr;

                return (
                  <div
                    key={bill.id}
                    className={`bg-stone-900 border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition ${
                      bill.status === 'PAGO'
                        ? 'border-stone-800 opacity-80'
                        : isOverdue
                        ? 'border-red-500/70 bg-red-950/10'
                        : isDueToday
                        ? 'border-amber-500/70 bg-amber-950/10'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-800">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                            {EXPENSE_CATEGORY_LABELS[bill.category] || bill.category}
                          </span>
                          <h4 className="font-bold text-stone-100 text-sm mt-0.5 leading-tight">
                            {bill.description}
                          </h4>
                        </div>
                        <span className="text-base font-black font-mono text-stone-100 whitespace-nowrap">
                          {formatCurrency(bill.amount)}
                        </span>
                      </div>

                      <div className="py-3 text-xs space-y-1.5 text-stone-300">
                        {bill.supplier && (
                          <div className="flex justify-between text-stone-400">
                            <span>Fornecedor:</span>
                            <span className="text-stone-200 font-medium">{bill.supplier}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-stone-400">
                          <span>Vencimento:</span>
                          <span
                            className={`font-mono font-bold ${
                              isOverdue
                                ? 'text-red-400'
                                : isDueToday
                                ? 'text-amber-400'
                                : 'text-stone-200'
                            }`}
                          >
                            {bill.dueDate} {isOverdue && '(ATRASADO)'} {isDueToday && '(VENCE HOJE)'}
                          </span>
                        </div>
                        {bill.receiptNumber && (
                          <div className="flex justify-between text-stone-400">
                            <span>Comprovante / NF:</span>
                            <span className="font-mono text-stone-300">{bill.receiptNumber}</span>
                          </div>
                        )}
                        {bill.notes && (
                          <div className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-800/80">
                            "{bill.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          bill.status === 'PAGO'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isOverdue
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {bill.status === 'PAGO' ? 'PAGO' : isOverdue ? 'VENCIDO' : 'A PAGAR'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {bill.status !== 'PAGO' && (
                          <button
                            onClick={() => payExpenseBill(bill.id, 'PIX')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Dar Baixa (Pagar)
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Excluir conta "${bill.description}"?`)) {
                              deleteExpenseBill(bill.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition cursor-pointer"
                          title="Excluir"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONTA DE GORJETAS & REPASSES */}
      {subTab === 'CONTA_GORJETAS' && (
        <div className="space-y-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-100 text-base">
                  Conta de Taxa de Serviço & Gorjetas da Equipe
                </h3>
                <p className="text-xs text-stone-400">
                  Os 10% cobrados nas comandas são segregados nesta conta exclusiva para repasse aos colaboradores
                </p>
              </div>

              <button
                onClick={() => setShowTipsModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Lançar Repasse / Distribuição
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-xs text-stone-400">Total Arrecadado (10% Comandas Pagas)</span>
                <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                  {formatCurrency(ledgerMetrics.totalTipsCollected)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-xs text-stone-400">Repasses Já Efetuados</span>
                <div className="text-2xl font-black text-stone-200 font-mono mt-1">
                  {formatCurrency(ledgerMetrics.totalTipsRepassed)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-purple-500/40 bg-purple-950/10">
                <span className="text-xs text-purple-400 font-semibold">Saldo Atual Disponível para Repasse</span>
                <div className="text-2xl font-black text-purple-300 font-mono mt-1">
                  {formatCurrency(ledgerMetrics.tipsAccountBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* Garçons Breakdown */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="font-bold text-stone-200 text-sm">Rateio Individual de Gorjetas por Garçom</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees
                .filter((e) => e.role === 'GARCOM' && e.active)
                .map((g) => {
                  const empComandas = comandas.filter((c) => c.waiterId === g.id && c.status === 'PAGA');
                  const sales = empComandas.reduce((s, c) => s + c.total, 0);
                  const tipShare = sales * ((g.commissionRate || 10) / 100);

                  return (
                    <div key={g.id} className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                          {g.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-stone-200 text-xs block">{g.name}</span>
                          <span className="text-[10px] text-stone-500">Taxa: {g.commissionRate}% de rateio</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-purple-400 block">{formatCurrency(tipShare)}</span>
                        <span className="text-[10px] text-stone-500">{empComandas.length} mesas</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTÓRICO DE FECHAMENTOS (AUDITORIA) */}
      {subTab === 'FECHAMENTOS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-100 text-sm">
              Histórico de Fechamentos de Caixa (Turnos & Mensais)
            </h3>
            <button
              onClick={() => setShowClosingModal(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Novo Fechamento com Conferência
            </button>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Data / Período</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3 text-right">Valor Esperado</th>
                  <th className="py-3 px-3 text-right">Valor Contado</th>
                  <th className="py-3 px-3 text-right">Diferença</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {cashClosings.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-200">{c.periodLabel}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{formatTime(c.date)}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-400">{c.type}</td>
                    <td className="py-3 px-3 text-stone-300">{c.operatorName}</td>
                    <td className="py-3 px-3 text-right font-mono text-stone-200">
                      {formatCurrency(c.expectedCash)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-100">
                      {formatCurrency(c.countedCash)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        c.discrepancy === 0
                          ? 'text-emerald-400'
                          : c.discrepancy < 0
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {c.discrepancy === 0
                        ? 'R$ 0,00'
                        : `${c.discrepancy > 0 ? '+' : ''}${formatCurrency(c.discrepancy)}`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          c.status === 'CONCILIADO'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GRÁFICO ENTRADAS X SAÍDAS */}
      {subTab === 'GRAFICO' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-100 text-sm">Balanço Comparativo: Entradas x Saídas</h3>
              <p className="text-xs text-stone-400">Visão consolidada de receitas operacionais contra custos e despesas</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-stone-300">
                <span className="w-3 h-3 rounded bg-emerald-500" /> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-stone-300">
                <span className="w-3 h-3 rounded bg-red-500" /> Saídas
              </span>
            </div>
          </div>

          {/* Simple comparative illustration */}
          <div className="h-60 flex items-end justify-around gap-6 pt-6 px-4 border-b border-stone-800">
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="font-mono font-bold text-xs text-emerald-400 mb-2">
                {formatCurrency(ledgerMetrics.totalEntries)}
              </span>
              <div
                className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-xl transition-all"
                style={{ height: '180px' }}
              />
              <span className="text-xs font-semibold text-stone-300 mt-2">Total Entradas</span>
            </div>

            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="font-mono font-bold text-xs text-red-400 mb-2">
                {formatCurrency(ledgerMetrics.totalExits)}
              </span>
              <div
                className="w-full bg-gradient-to-t from-red-700 to-red-500 rounded-t-xl transition-all"
                style={{
                  height: `${Math.max(30, Math.round((ledgerMetrics.totalExits / (ledgerMetrics.totalEntries || 1)) * 180))}px`,
                }}
              />
              <span className="text-xs font-semibold text-stone-300 mt-2">Total Saídas</span>
            </div>

            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="font-mono font-bold text-xs text-amber-400 mb-2">
                {formatCurrency(ledgerMetrics.netCashFlow)}
              </span>
              <div
                className="w-full bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-xl transition-all"
                style={{
                  height: `${Math.max(20, Math.round((ledgerMetrics.netCashFlow / (ledgerMetrics.totalEntries || 1)) * 180))}px`,
                }}
              />
              <span className="text-xs font-semibold text-stone-300 mt-2">Resultado Líquido</span>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Modal: Lançar Despesa / Conta a Pagar */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full shadow-2xl p-5 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm">Lançar Nova Despesa / Conta a Pagar</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpenseBill} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Descrição da Despesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frigorífico VPJ - 50kg Picanha Angus"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Categoria *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={expDueDate}
                    onChange={(e) => setExpDueDate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Fornecedor / Favorecido</label>
                  <input
                    type="text"
                    placeholder="Ex: Friboi / Enel"
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Nº Comprovante / Nota Fiscal</label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 88192"
                  value={expReceipt}
                  onChange={(e) => setExpReceipt(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Toggle: Pagar Imediatamente */}
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expPayNow}
                    onChange={(e) => setExpPayNow(e.target.checked)}
                    className="rounded bg-stone-900 border-stone-700 text-amber-500"
                  />
                  <span className="font-semibold text-stone-200">
                    Pagar e debitar do caixa agora
                  </span>
                </label>

                {expPayNow && (
                  <div>
                    <label className="block text-stone-400 text-[11px] mb-1">Forma de Saída:</label>
                    <div className="flex gap-2">
                      {(['PIX', 'DINHEIRO', 'DEBITO'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setExpPaymentMethod(m)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            expPaymentMethod === m
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-900 text-stone-400'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sangria */}
      {showSangriaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-stone-100 text-sm">Registrar Sangria (Retirada de Dinheiro)</h3>
            <form onSubmit={handleConfirmSangria} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Valor em Dinheiro (R$)</label>
                <input
                  type="number"
                  step="5"
                  required
                  placeholder="0,00"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Motivo / Destino</label>
                <input
                  type="text"
                  placeholder="Ex: Envio ao cofre central"
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSangriaModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                >
                  Confirmar Sangria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suprimento */}
      {showSuprimentoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-stone-100 text-sm">Registrar Suprimento (Entrada de Troco)</h3>
            <form onSubmit={handleConfirmSuprimento} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Valor em Dinheiro (R$)</label>
                <input
                  type="number"
                  step="5"
                  required
                  placeholder="0,00"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Reforço de moedas e notas de 10"
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuprimentoModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Confirmar Suprimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conferência e Fechamento de Caixa (Esperado x Contado) */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm">Conferência & Fechamento de Caixa</h3>
              <button onClick={() => setShowClosingModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmClosing} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setClosingType('TURNO')}
                  className={`py-1.5 rounded-lg font-bold text-xs ${
                    closingType === 'TURNO' ? 'bg-amber-600 text-white' : 'text-stone-400'
                  }`}
                >
                  Fechamento Turno
                </button>
                <button
                  type="button"
                  onClick={() => setClosingType('MENSAL')}
                  className={`py-1.5 rounded-lg font-bold text-xs ${
                    closingType === 'MENSAL' ? 'bg-amber-600 text-white' : 'text-stone-400'
                  }`}
                >
                  Fechamento Mensal
                </button>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Identificação do Período</label>
                <input
                  type="text"
                  value={closingPeriod}
                  onChange={(e) => setClosingPeriod(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              {/* Expected vs Counted */}
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Valor Esperado na Gaveta:</span>
                  <span className="font-mono font-bold text-stone-100 text-sm">
                    {formatCurrency(ledgerMetrics.currentCashInDrawer)}
                  </span>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    Valor Contado em Dinheiro Vivo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="w-full bg-stone-900 border border-amber-500 rounded-xl px-3 py-2 text-stone-100 font-mono text-sm"
                  />
                </div>

                {countedCashInput && (
                  <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-xs">
                    <span className="text-stone-400 font-semibold">Diferença (Quebra/Sobra):</span>
                    <span
                      className={`font-mono font-black text-sm ${
                        Math.abs(parseFloat(countedCashInput) - ledgerMetrics.currentCashInDrawer) < 0.05
                          ? 'text-emerald-400'
                          : parseFloat(countedCashInput) < ledgerMetrics.currentCashInDrawer
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {formatCurrency(parseFloat(countedCashInput) - ledgerMetrics.currentCashInDrawer)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Observações da Auditoria</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ex: Contagem conferida pelo gerente e operador."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowClosingModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relatório Diário e Notificação ao Fechar o Caixa */}
      {closingSummaryRecord && (() => {
        const hasDiscrepancy = Math.abs(closingSummaryRecord.discrepancy) >= (settings.cashDiscrepancyThreshold || 10);
        const cleanPhone = (settings.adminPhone || '11998761234').replace(/\D/g, '');
        const summaryText = `🥩 *CHURRASGESTÃO - FECHAMENTO DE CAIXA (${closingSummaryRecord.type})* 🥩\nRestaurante: ${settings.name}\nPeríodo: ${closingSummaryRecord.periodLabel}\nOperador: ${closingSummaryRecord.operatorName}\nData: ${formatDate(closingSummaryRecord.date)} às ${formatTime(closingSummaryRecord.date)}\n\n💰 *FINANCEIRO*\n• Vendas / Entradas: ${formatCurrency(closingSummaryRecord.totalEntries)}\n• Saídas / Despesas: ${formatCurrency(closingSummaryRecord.totalExits)}\n• Gaveta Esperada: ${formatCurrency(closingSummaryRecord.expectedCash)}\n• Gaveta Contada: ${formatCurrency(closingSummaryRecord.countedCash)}\n• Diferença (Quebra/Sobra): ${formatCurrency(closingSummaryRecord.discrepancy)} (${closingSummaryRecord.status})\n\n📊 *STATUS*: ${closingSummaryRecord.status === 'CONCILIADO' ? '✅ Caixa Conferido & Conciliado' : '⚠️ DIVERGÊNCIA IDENTIFICADA'}\n\n_Enviado automaticamente pelo ChurrasGestão._`;
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(summaryText)}`;
        const mailtoUrl = `mailto:${encodeURIComponent(settings.adminEmail || 'admin@churrascaria.com')}?subject=${encodeURIComponent(`Fechamento de Caixa - ${closingSummaryRecord.periodLabel}`)}&body=${encodeURIComponent(summaryText)}`;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-stone-100 text-sm">Fechamento Concluído com Sucesso!</h3>
                </div>
                <button
                  onClick={() => setClosingSummaryRecord(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {hasDiscrepancy && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Alerta de Diferença no Fechamento:</span>
                    <span>
                      Houve uma divergência de {formatCurrency(closingSummaryRecord.discrepancy)} entre o valor contado e o esperado.
                      Este evento foi registrado no histórico para auditoria.
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-xs text-stone-200 space-y-2">
                <div className="flex justify-between border-b border-stone-800/80 pb-1.5 text-stone-400">
                  <span>Período:</span>
                  <span className="text-stone-200 font-bold">{closingSummaryRecord.periodLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total de Entradas:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(closingSummaryRecord.totalEntries)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total de Saídas:</span>
                  <span className="text-red-400 font-bold">{formatCurrency(closingSummaryRecord.totalExits)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Dinheiro Esperado:</span>
                  <span className="font-bold">{formatCurrency(closingSummaryRecord.expectedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Dinheiro Contado:</span>
                  <span className="font-bold">{formatCurrency(closingSummaryRecord.countedCash)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-stone-800 text-sm">
                  <span className="font-bold">Diferença / Quebra:</span>
                  <span className={`font-black ${closingSummaryRecord.status === 'CONCILIADO' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(closingSummaryRecord.discrepancy)} ({closingSummaryRecord.status})
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs text-stone-400 font-medium">
                  Envie o relatório diário diretamente para a gerência/admin:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar via WhatsApp
                  </a>

                  <a
                    href={mailtoUrl}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-950/40 transition cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    Enviar por E-mail
                  </a>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryText);
                      setCopiedReport(true);
                      showToast('Relatório copiado!', 'success');
                      setTimeout(() => setCopiedReport(false), 2000);
                    }}
                    className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedReport ? 'Copiado!' : 'Copiar Texto'}
                  </button>

                  <button
                    onClick={() => {
                      setClosingSummaryRecord(null);
                      setShowPrintReportModal(true);
                    }}
                    className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir DRE
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setClosingSummaryRecord(null)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Estorno de Comanda */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-stone-100 text-sm">Estornar Comanda Paga</h3>
            <form onSubmit={handleConfirmRefund} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Selecione a Comanda Paga</label>
                <select
                  required
                  value={refundComandaId}
                  onChange={(e) => setRefundComandaId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-2 text-stone-200"
                >
                  <option value="">Selecione...</option>
                  {comandas
                    .filter((c) => c.status === 'PAGA')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.tableLabel} ({formatCurrency(c.total)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Motivo do Estorno</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                >
                  Confirmar Estorno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repasse de Gorjetas */}
      {showTipsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-stone-100 text-sm">Repasse da Taxa de Serviço à Equipe</h3>
            <form onSubmit={handleConfirmTipsDist} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <span className="text-stone-400 block">Saldo disponível para repasse:</span>
                <span className="text-base font-bold text-purple-400 font-mono">
                  {formatCurrency(ledgerMetrics.tipsAccountBalance)}
                </span>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Valor do Repasse (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={tipsDistAmount}
                  onChange={(e) => setTipsDistAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Descrição</label>
                <input
                  type="text"
                  value={tipsDistDesc}
                  onChange={(e) => setTipsDistDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTipsModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Confirmar Repasse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relatório Financeiro Impresso / PDF */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm">Relatório Financeiro & DRE de Caixa</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Salvar PDF
                </button>
                <button onClick={() => setShowPrintReportModal(false)} className="text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Surface */}
            <div className="p-6 bg-white text-stone-900 rounded-xl font-sans text-xs space-y-4 print:p-0">
              <div className="text-center pb-3 border-b border-stone-300">
                <h2 className="text-base font-extrabold uppercase tracking-tight">{settings.name}</h2>
                <div className="text-[11px] text-stone-600">CNPJ: {settings.cnpj} · {settings.address}</div>
                <div className="text-xs font-bold text-stone-800 mt-1">
                  DEMONSTRATIVO DE FLUXO DE CAIXA E AUDITORIA OPERACIONAL
                </div>
                <div className="text-[10px] text-stone-500">
                  Emitido em: {formatDate(new Date().toISOString())} às {formatTime(new Date().toISOString())}
                </div>
              </div>

              {/* DRE Summary Table */}
              <div className="space-y-2 border border-stone-300 rounded-lg p-3 bg-stone-50">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>(+) RECEITA BRUTA OPERACIONAL (VENDAS):</span>
                  <span className="font-mono">{formatCurrency(ledgerMetrics.totalEntries)}</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>(-) DESPESAS OPERACIONAIS & FORNECEDORES:</span>
                  <span className="font-mono">{formatCurrency(ledgerMetrics.totalExits)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-stone-900 pt-1 border-t border-stone-300 text-sm">
                  <span>(=) RESULTADO OPERACIONAL LÍQUIDO DO PERÍODO:</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(ledgerMetrics.netCashFlow)}</span>
                </div>
              </div>

              {/* Breakdown by payment method */}
              <div className="pt-2">
                <h4 className="font-bold text-stone-800 text-[11px] uppercase mb-1">
                  Discriminação por Meio de Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between border-b border-stone-200 py-0.5">
                    <span>PIX Instantâneo:</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(
                        cashSession.movements
                          .filter((m) => m.paymentMethod === 'PIX' && m.type === 'VENDA')
                          .reduce((s, m) => s + m.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 py-0.5">
                    <span>Cartão de Crédito:</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(
                        cashSession.movements
                          .filter((m) => m.paymentMethod === 'CREDITO' && m.type === 'VENDA')
                          .reduce((s, m) => s + m.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 py-0.5">
                    <span>Cartão de Débito:</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(
                        cashSession.movements
                          .filter((m) => m.paymentMethod === 'DEBITO' && m.type === 'VENDA')
                          .reduce((s, m) => s + m.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 py-0.5">
                    <span>Dinheiro em Espécie:</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(
                        cashSession.movements
                          .filter((m) => m.paymentMethod === 'DINHEIRO' && m.type === 'VENDA')
                          .reduce((s, m) => s + m.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-stone-600">
                <div className="border-t border-stone-400 pt-1">
                  Operador de Caixa: {cashSession.operatorName}
                </div>
                <div className="border-t border-stone-400 pt-1">
                  Gerente Geral / Administrador
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
