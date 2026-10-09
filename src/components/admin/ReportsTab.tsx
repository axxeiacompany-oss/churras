import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatGuarani,
  formatCurrencyDual,
  GUARANI_EXCHANGE_RATE,
} from '../../utils/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  AuditLogEntry,
  AuditActionType,
  PaymentMethod,
  UserRole,
  ShiftType,
  MenuCategory,
} from '../../types';
import { generate30DayMetrics } from '../../utils/dashboardMetrics';
import {
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  User,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Percent,
  UtensilsCrossed,
  Flame,
  Package,
  Info,
  X,
  FileSpreadsheet,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

type ReportSection = 'SALES' | 'CMV' | 'COMMISSIONS' | 'DRE' | 'AUDIT';
type PeriodOption = 'HOJE' | 'ONTEM' | '7D' | '30D' | 'MES_ATUAL' | 'MES_ANTERIOR';

export const ReportsTab: React.FC = () => {
  const {
    comandas,
    menuItems,
    employees,
    cashClosings,
    bills,
    settings,
    auditLogs,
    addAuditLog,
    addCashMovement,
    showToast,
  } = useChurras();

  const [activeSection, setActiveSection] = useState<ReportSection>('SALES');
  const [periodOption, setPeriodOption] = useState<PeriodOption>('MES_ATUAL');
  
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const renderMoney = (amount: number) => {
    return formatCurrency(amount);
  };

  // Filters for Sales Report
  const [salesEmployeeFilter, setSalesEmployeeFilter] = useState<string>('TODOS');
  const [salesShiftFilter, setSalesShiftFilter] = useState<'TODOS' | 'ALMOCO' | 'JANTAR'>('TODOS');
  const [salesPaymentMethodFilter, setSalesPaymentMethodFilter] = useState<string>('TODOS');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState<string>('TODOS');
  const [salesSearch, setSalesSearch] = useState<string>('');

  // Filters for CMV Report
  const [cmvCategoryFilter, setCmvCategoryFilter] = useState<string>('TODOS');
  const [cmvSearch, setCmvSearch] = useState<string>('');
  const [cmvSortBy, setCmvSortBy] = useState<'margin_asc' | 'margin_desc' | 'sales_desc' | 'cost_desc'>('margin_desc');

  // Filters for Audit Report
  const [auditActionFilter, setAuditActionFilter] = useState<string>('TODOS');
  const [auditActorFilter, setAuditActorFilter] = useState<string>('TODOS');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // State for commissions payout confirmation
  const [paidCommissions, setPaidCommissions] = useState<Record<string, boolean>>({});

  // 30 Days historical dataset for period aggregations
  const history30Days = useMemo(() => {
    return generate30DayMetrics(comandas);
  }, [comandas]);

  // Date range calculation
  const dateRangeLabel = useMemo(() => {
    switch (periodOption) {
      case 'HOJE':
        return 'Hoje (09/10/2026)';
      case 'ONTEM':
        return 'Ontem (08/10/2026)';
      case '7D':
        return 'Últimos 7 dias (03/10/2026 a 09/10/2026)';
      case '30D':
        return 'Últimos 30 dias (10/09/2026 a 09/10/2026)';
      case 'MES_ATUAL':
        return 'Mês Atual (Outubro/2026)';
      case 'MES_ANTERIOR':
        return 'Mês Anterior (Setembro/2026)';
      default:
        return 'Período Geral';
    }
  }, [periodOption]);

  // Multiplier or baseline for synthetic historical periods
  const periodMultiplier = useMemo(() => {
    switch (periodOption) {
      case 'HOJE':
        return 1;
      case 'ONTEM':
        return 0.94;
      case '7D':
        return 6.8;
      case '30D':
        return 28.5;
      case 'MES_ATUAL':
        return 8.9; // ~9 days into current month
      case 'MES_ANTERIOR':
        return 29.5;
      default:
        return 1;
    }
  }, [periodOption]);

  // ==========================================
  // 1. VENDAS MULTIDIMENSIONAL
  // ==========================================
  const salesDataset = useMemo(() => {
    // Collect all items sold in comandas
    const validComandas = comandas.filter((c) => {
      if (salesEmployeeFilter !== 'TODOS' && c.waiterId !== salesEmployeeFilter) return false;
      if (salesShiftFilter !== 'TODOS') {
        const hour = new Date(c.openedAt).getHours();
        const isLunch = hour >= 11 && hour < 17;
        if (salesShiftFilter === 'ALMOCO' && !isLunch) return false;
        if (salesShiftFilter === 'JANTAR' && isLunch) return false;
      }
      return true;
    });

    const paidComandas = validComandas.filter((c) => c.status === 'PAGA');
    const openComandas = validComandas.filter((c) => c.status === 'ABERTA' || c.status === 'CONTA_SOLICITADA');

    // Aggregate payment methods
    const paymentBreakdown: Record<PaymentMethod, { count: number; total: number }> = {
      DINHEIRO: { count: 0, total: 0 },
      CREDITO: { count: 0, total: 0 },
      DEBITO: { count: 0, total: 0 },
      PIX: { count: 0, total: 0 },
      VR_VA: { count: 0, total: 0 },
    };

    paidComandas.forEach((c) => {
      c.payments.forEach((p) => {
        if (paymentBreakdown[p.method]) {
          paymentBreakdown[p.method].count += 1;
          paymentBreakdown[p.method].total += p.amount;
        }
      });
    });

    // If historical period, scale realistically
    const baseClosedSales = paidComandas.reduce((sum, c) => sum + c.total, 0) || 28500000;
    const scaledTotalSales = Math.round(baseClosedSales * periodMultiplier * 100) / 100;
    const baseOrdersCount = Math.max(paidComandas.length, 32);
    const scaledOrdersCount = Math.round(baseOrdersCount * periodMultiplier);
    const scaledPax = Math.round(scaledOrdersCount * 2.85);
    const avgTicket = scaledOrdersCount > 0 ? scaledTotalSales / scaledOrdersCount : 0;
    const avgPerPax = scaledPax > 0 ? scaledTotalSales / scaledPax : 0;
    const scaledServiceTax = Math.round(scaledTotalSales * 0.1 * 100) / 100;
    const scaledDiscounts = Math.round(scaledTotalSales * 0.015 * 100) / 100;

    // Aggregate sales by product
    const productStatsMap: Record<
      string,
      {
        name: string;
        category: MenuCategory;
        quantity: number;
        revenue: number;
        unitPrice: number;
      }
    > = {};

    menuItems.forEach((item) => {
      productStatsMap[item.id] = {
        name: item.name,
        category: item.category,
        quantity: 0,
        revenue: 0,
        unitPrice: item.price,
      };
    });

    // Extract item quantities from comandas
    validComandas.forEach((c) => {
      c.items.forEach((it) => {
        if (productStatsMap[it.menuItemId]) {
          productStatsMap[it.menuItemId].quantity += it.quantity;
          productStatsMap[it.menuItemId].revenue += it.price * it.quantity;
        }
      });
    });

    // If quantity is zero in current live state for some items, give realistic baseline proportional to multiplier
    const productRows = Object.entries(productStatsMap)
      .map(([id, stat]) => {
        const itemObj = menuItems.find((m) => m.id === id);
        const baselineQty = Math.round((Math.max(stat.quantity, itemObj?.category === 'RODIZIO' ? 12 : 6)) * periodMultiplier);
        const baselineRevenue = Math.round(baselineQty * stat.unitPrice * 100) / 100;

        return {
          id,
          name: stat.name,
          category: stat.category,
          quantity: baselineQty,
          revenue: baselineRevenue,
          unitPrice: stat.unitPrice,
          percentOfTotal: scaledTotalSales > 0 ? (baselineRevenue / scaledTotalSales) * 100 : 0,
        };
      })
      .filter((row) => {
        if (salesCategoryFilter !== 'TODOS' && row.category !== salesCategoryFilter) return false;
        if (salesSearch.trim() && !row.name.toLowerCase().includes(salesSearch.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Sales by shift breakdown
    const lunchRevenue = Math.round(scaledTotalSales * 0.42 * 100) / 100;
    const dinnerRevenue = Math.round(scaledTotalSales * 0.58 * 100) / 100;

    return {
      totalSales: scaledTotalSales,
      ordersCount: scaledOrdersCount,
      paxCount: scaledPax,
      avgTicket,
      avgPerPax,
      serviceTax: scaledServiceTax,
      discounts: scaledDiscounts,
      lunchRevenue,
      dinnerRevenue,
      productRows,
      paymentBreakdown,
    };
  }, [
    comandas,
    menuItems,
    periodMultiplier,
    salesEmployeeFilter,
    salesShiftFilter,
    salesCategoryFilter,
    salesSearch,
  ]);

  // ==========================================
  // 2. CMV & MARGEM POR PRODUTO
  // ==========================================
  const cmvAnalysis = useMemo(() => {
    // Standard recipe food costs if not explicitly set in MenuItem
    const defaultCostEstimates: Record<MenuCategory, number> = {
      RODIZIO: 46.5, // ~31% CMV
      CORTES_NOBRES: 48.0, // ~35% CMV
      PRATOS_A_LA_CARTE: 26.0, // ~32% CMV
      POR_QUILO: 32.0, // ~32% CMV
      ENTRADAS_GUARNACOES: 6.5, // ~22% CMV
      BEBIDAS: 3.2, // ~28% CMV
      CHOPP_DRINKS: 4.5, // ~25% CMV
      SOBREMESAS: 8.0, // ~24% CMV
      ADICIONAIS: 4.0, // ~25% CMV
    };

    let totalAnalysisRevenue = 0;
    let totalAnalysisCost = 0;

    const itemsWithMetrics = menuItems.map((item) => {
      const cost = item.costPrice && item.costPrice > 0 ? item.costPrice : defaultCostEstimates[item.category] || item.price * 0.32;
      const profit = Math.max(0, item.price - cost);
      const marginPct = item.price > 0 ? (profit / item.price) * 100 : 0;
      const cmvPct = item.price > 0 ? (cost / item.price) * 100 : 0;

      // Realistic period units sold
      const baseUnits = item.category === 'RODIZIO' ? 85 : item.category === 'CHOPP_DRINKS' ? 120 : 35;
      const unitsSold = Math.round(baseUnits * periodMultiplier);
      const totalItemRevenue = unitsSold * item.price;
      const totalItemCost = unitsSold * cost;

      totalAnalysisRevenue += totalItemRevenue;
      totalAnalysisCost += totalItemCost;

      // Quality rating
      let status: 'ALTA_MARGEM' | 'SAUDAVEL' | 'ALERTA_CMV' = 'SAUDAVEL';
      if (marginPct >= 65) status = 'ALTA_MARGEM';
      else if (cmvPct >= 38 || marginPct < 52) status = 'ALERTA_CMV';

      return {
        ...item,
        cost,
        profit,
        marginPct,
        cmvPct,
        unitsSold,
        totalItemRevenue,
        totalItemCost,
        status,
      };
    });

    const filteredItems = itemsWithMetrics.filter((item) => {
      if (cmvCategoryFilter !== 'TODOS' && item.category !== cmvCategoryFilter) return false;
      if (cmvSearch.trim() && !item.name.toLowerCase().includes(cmvSearch.toLowerCase())) return false;
      return true;
    });

    // Sorting
    filteredItems.sort((a, b) => {
      if (cmvSortBy === 'margin_desc') return b.marginPct - a.marginPct;
      if (cmvSortBy === 'margin_asc') return a.marginPct - b.marginPct;
      if (cmvSortBy === 'sales_desc') return b.totalItemRevenue - a.totalItemRevenue;
      if (cmvSortBy === 'cost_desc') return b.cost - a.cost;
      return 0;
    });

    const overallGrossProfit = totalAnalysisRevenue - totalAnalysisCost;
    const overallCmvPct = totalAnalysisRevenue > 0 ? (totalAnalysisCost / totalAnalysisRevenue) * 100 : 31.8;
    const overallMarginPct = 100 - overallCmvPct;

    return {
      items: filteredItems,
      totalAnalysisRevenue,
      totalAnalysisCost,
      overallGrossProfit,
      overallCmvPct,
      overallMarginPct,
    };
  }, [menuItems, cmvCategoryFilter, cmvSearch, cmvSortBy, periodMultiplier]);

  // ==========================================
  // 3. COMISSÕES & GORJETAS A PAGAR
  // ==========================================
  const staffCommissions = useMemo(() => {
    const activeWaiters = employees.filter((e) => e.active && (e.role === 'GARCOM' || e.role === 'CAIXA'));
    const totalRevenue = salesDataset.totalSales;

    // Attribute sales proportion to waiters
    const rows = activeWaiters.map((emp, idx) => {
      const share = idx === 0 ? 0.45 : idx === 1 ? 0.35 : 0.20;
      const attributedSales = Math.round(totalRevenue * share * 100) / 100;
      const serviceTaxGenerated = Math.round(attributedSales * 0.1 * 100) / 100;
      const voluntaryTips = Math.round(attributedSales * 0.015 * 100) / 100;
      const rate = emp.commissionRate || 10;
      const commissionAmount = Math.round((attributedSales * (rate / 100)) * 100) / 100;
      const totalToPay = Math.round((commissionAmount + voluntaryTips) * 100) / 100;
      const isPaid = !!paidCommissions[emp.id];

      return {
        employee: emp,
        attributedSales,
        serviceTaxGenerated,
        voluntaryTips,
        commissionRate: rate,
        commissionAmount,
        totalToPay,
        isPaid,
      };
    });

    const totalCommissionsToPay = rows.reduce((sum, r) => sum + (r.isPaid ? 0 : r.totalToPay), 0);
    const totalCommissionsPaid = rows.reduce((sum, r) => sum + (r.isPaid ? r.totalToPay : 0), 0);
    const grandTotal = rows.reduce((sum, r) => sum + r.totalToPay, 0);

    return {
      rows,
      totalCommissionsToPay,
      totalCommissionsPaid,
      grandTotal,
    };
  }, [employees, salesDataset.totalSales, paidCommissions]);

  // Handle paying an employee's commission
  const handlePayCommission = (empId: string, empName: string, amount: number) => {
    setPaidCommissions((prev) => ({ ...prev, [empId]: true }));
    addCashMovement(
      'COMISSAO',
      amount,
      'PIX',
      `Quitação de Comissões e Gorjetas - ${empName} (${dateRangeLabel})`
    );
    addAuditLog({
      actionType: 'SANGRIA_CAIXA',
      targetType: 'CAIXA',
      targetReference: `Folha / Comissões: ${empName}`,
      details: `Pagamento de comissão/gorjeta no valor de ${formatCurrency(amount)} liquidado via PIX`,
      reason: 'Quitação de comissões apuradas no fechamento',
      amountImpact: amount,
    });
    showToast(`Comissão de ${empName} no valor de ${formatCurrency(amount)} quitada com sucesso!`, 'success');
  };

  // ==========================================
  // 4. DRE SIMPLIFICADO (DEMONSTRATIVO)
  // ==========================================
  const dreReport = useMemo(() => {
    // 1. Receita Bruta de Vendas
    const grossRevenue = salesDataset.totalSales;
    const rodizioRevenue = Math.round(grossRevenue * 0.62 * 100) / 100;
    const carnesNobresRevenue = Math.round(grossRevenue * 0.18 * 100) / 100;
    const bebidasRevenue = Math.round(grossRevenue * 0.14 * 100) / 100;
    const outrosRevenue = Math.round((grossRevenue - (rodizioRevenue + carnesNobresRevenue + bebidasRevenue)) * 100) / 100;

    // 2. Deduções da Receita Bruta
    const cancelamentosEstornos = Math.round(grossRevenue * 0.008 * 100) / 100;
    const descontosComerciais = salesDataset.discounts;
    const totalDeducoes = cancelamentosEstornos + descontosComerciais;

    // 3. Receita Operacional Líquida (ROL) = 100%
    const rol = Math.max(1, grossRevenue - totalDeducoes);

    // 4. CMV (Custo da Mercadoria Vendida)
    const cmvCarnes = Math.round(rol * 0.225 * 100) / 100; // carnes 22.5%
    const cmvBebidas = Math.round(rol * 0.045 * 100) / 100; // bebidas 4.5%
    const cmvCarvaoGas = Math.round(rol * 0.025 * 100) / 100; // carvao/gas 2.5%
    const cmvHortifrutiOutros = Math.round(rol * 0.025 * 100) / 100; // outros 2.5%
    const cmvTotal = cmvCarnes + cmvBebidas + cmvCarvaoGas + cmvHortifrutiOutros; // ~32%

    // 5. Lucro Bruto Operacional
    const lucroBruto = rol - cmvTotal;
    const margemBrutaPct = (lucroBruto / rol) * 100;

    // 6. Despesas Operacionais
    const despesasFolhaSalarios = Math.round(rol * 0.15 * 100) / 100; // salarios base
    const despesasComissoesGorjetas = Math.round(rol * 0.08 * 100) / 100; // comissoes
    const despesasAluguel = Math.round(rol * 0.07 * 100) / 100; // aluguel e predial
    const despesasEnergiaAgua = Math.round(rol * 0.04 * 100) / 100; // camaras frias / energia
    const despesasManutencaoGeral = Math.round(rol * 0.02 * 100) / 100;
    const totalDespesasOperacionais =
      despesasFolhaSalarios +
      despesasComissoesGorjetas +
      despesasAluguel +
      despesasEnergiaAgua +
      despesasManutencaoGeral;

    // 7. Resultado Operacional (EBITDA / LAJIDA)
    const ebitda = lucroBruto - totalDespesasOperacionais;
    const ebitdaMarginPct = (ebitda / rol) * 100;

    // 8. Tributos e Impostos (Simples Nacional ~6.5%)
    const impostosSimples = Math.round(rol * 0.065 * 100) / 100;

    // 9. Lucro Líquido do Exercício
    const lucroLiquido = ebitda - impostosSimples;
    const margemLiquidaPct = (lucroLiquido / rol) * 100;

    return {
      grossRevenue,
      rodizioRevenue,
      carnesNobresRevenue,
      bebidasRevenue,
      outrosRevenue,
      cancelamentosEstornos,
      descontosComerciais,
      totalDeducoes,
      rol,
      cmvCarnes,
      cmvBebidas,
      cmvCarvaoGas,
      cmvHortifrutiOutros,
      cmvTotal,
      lucroBruto,
      margemBrutaPct,
      despesasFolhaSalarios,
      despesasComissoesGorjetas,
      despesasAluguel,
      despesasEnergiaAgua,
      despesasManutencaoGeral,
      totalDespesasOperacionais,
      ebitda,
      ebitdaMarginPct,
      impostosSimples,
      lucroLiquido,
      margemLiquidaPct,
    };
  }, [salesDataset]);

  // ==========================================
  // 5. AUDITORIA: QUEM CANCELOU, DESCONTOU OU ALTEROU
  // ==========================================
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== 'TODOS' && log.actionType !== auditActionFilter) return false;
      if (auditActorFilter !== 'TODOS' && log.actorId !== auditActorFilter) return false;
      if (auditSearch.trim()) {
        const query = auditSearch.toLowerCase();
        const matchesRef = log.targetReference.toLowerCase().includes(query);
        const matchesDetails = log.details.toLowerCase().includes(query);
        const matchesActor = log.actorName.toLowerCase().includes(query);
        const matchesReason = (log.reason || '').toLowerCase().includes(query);
        if (!matchesRef && !matchesDetails && !matchesActor && !matchesReason) return false;
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditActorFilter, auditSearch]);

  const auditMetrics = useMemo(() => {
    const totalDiscountsImpact = auditLogs
      .filter((l) => l.actionType === 'DESCONTO_CONCEDIDO')
      .reduce((sum, l) => sum + (l.amountImpact || 0), 0);

    const totalCancellationsImpact = auditLogs
      .filter((l) => l.actionType === 'CANCELAMENTO_COMANDA' || l.actionType === 'CANCELAMENTO_ITEM' || l.actionType === 'ESTORNO_PAGAMENTO')
      .reduce((sum, l) => sum + (l.amountImpact || 0), 0);

    const totalWasteImpact = auditLogs
      .filter((l) => l.actionType === 'AJUSTE_ESTOQUE')
      .reduce((sum, l) => sum + (l.amountImpact || 0), 0);

    return {
      totalDiscountsImpact,
      totalCancellationsImpact,
      totalWasteImpact,
      totalEventsCount: auditLogs.length,
    };
  }, [auditLogs]);

  // Helper for action badge
  const renderAuditActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CANCELAMENTO_ITEM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Item Cancelado
          </span>
        );
      case 'CANCELAMENTO_COMANDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3 h-3" /> Comanda Cancelada
          </span>
        );
      case 'ESTORNO_PAGAMENTO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <TrendingDown className="w-3 h-3" /> Estorno / Reembolso
          </span>
        );
      case 'DESCONTO_CONCEDIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Percent className="w-3 h-3" /> Desconto Concedido
          </span>
        );
      case 'ALTERACAO_PRECO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <TrendingUp className="w-3 h-3" /> Alteração de Preço
          </span>
        );
      case 'AJUSTE_ESTOQUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <Package className="w-3 h-3" /> Ajuste / Quebra Estoque
          </span>
        );
      case 'SANGRIA_CAIXA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-700/50 text-stone-300 border border-stone-600">
            <DollarSign className="w-3 h-3" /> Sangria / Repasse
          </span>
        );
      case 'DIFERENCA_FECHAMENTO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3" /> Quebra de Caixa
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to export CSV
  const handleExportCSV = () => {
    let filename = `relatorio_${activeSection.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = '\uFEFF'; // UTF-8 BOM

    if (activeSection === 'SALES') {
      csvContent += 'Produto;Categoria;Preco Unitario;Qtd Vendida;Faturamento;Participacao %\n';
      salesDataset.productRows.forEach((r) => {
        csvContent += `"${r.name}";"${r.category}";${r.unitPrice.toFixed(2)};${r.quantity};${r.revenue.toFixed(2)};${r.percentOfTotal.toFixed(2)}%\n`;
      });
    } else if (activeSection === 'CMV') {
      csvContent += 'Produto;Categoria;Preco Venda;Custo Insumos;Lucro Bruto Unit;Margem %;CMV %;Qtd Vendida;Faturamento;CMV Total\n';
      cmvAnalysis.items.forEach((it) => {
        csvContent += `"${it.name}";"${it.category}";${it.price.toFixed(2)};${it.cost.toFixed(2)};${it.profit.toFixed(2)};${it.marginPct.toFixed(1)}%;${it.cmvPct.toFixed(1)}%;${it.unitsSold};${it.totalItemRevenue.toFixed(2)};${it.totalItemCost.toFixed(2)}\n`;
      });
    } else if (activeSection === 'COMMISSIONS') {
      csvContent += 'Funcionario;Cargo;Vendas Atribuidas;Taxa Servico 10%;Gorjeta Extra;% Comissao;Total a Pagar;Status\n';
      staffCommissions.rows.forEach((r) => {
        csvContent += `"${r.employee.name}";"${r.employee.role}";${r.attributedSales.toFixed(2)};${r.serviceTaxGenerated.toFixed(2)};${r.voluntaryTips.toFixed(2)};${r.commissionRate}%;${r.totalToPay.toFixed(2)};"${r.isPaid ? 'PAGO' : 'PENDENTE'}"\n`;
      });
    } else if (activeSection === 'DRE') {
      csvContent += 'Linha DRE;Valor (₲);Analise Vertical %\n';
      csvContent += `(+) RECEITA OPERACIONAL BRUTA;${dreReport.grossRevenue.toFixed(2)};${((dreReport.grossRevenue / dreReport.rol) * 100).toFixed(1)}%\n`;
      csvContent += `(-) DEDUÇÕES E ESTORNOS;${dreReport.totalDeducoes.toFixed(2)};${((dreReport.totalDeducoes / dreReport.rol) * 100).toFixed(1)}%\n`;
      csvContent += `(=) RECEITA OPERACIONAL LÍQUIDA (ROL);${dreReport.rol.toFixed(2)};100.0%\n`;
      csvContent += `(-) CUSTO DAS MERCADORIAS VENDIDAS (CMV);${dreReport.cmvTotal.toFixed(2)};${((dreReport.cmvTotal / dreReport.rol) * 100).toFixed(1)}%\n`;
      csvContent += `(=) LUCRO BRUTO OPERACIONAL;${dreReport.lucroBruto.toFixed(2)};${dreReport.margemBrutaPct.toFixed(1)}%\n`;
      csvContent += `(-) DESPESAS OPERACIONAIS;${dreReport.totalDespesasOperacionais.toFixed(2)};${((dreReport.totalDespesasOperacionais / dreReport.rol) * 100).toFixed(1)}%\n`;
      csvContent += `(=) RESULTADO OPERACIONAL (EBITDA);${dreReport.ebitda.toFixed(2)};${dreReport.ebitdaMarginPct.toFixed(1)}%\n`;
      csvContent += `(-) TRIBUTOS E IMPOSTOS (Simples Nacional);${dreReport.impostosSimples.toFixed(2)};${((dreReport.impostosSimples / dreReport.rol) * 100).toFixed(1)}%\n`;
      csvContent += `(=) LUCRO LÍQUIDO DO EXERCÍCIO;${dreReport.lucroLiquido.toFixed(2)};${dreReport.margemLiquidaPct.toFixed(1)}%\n`;
    } else if (activeSection === 'AUDIT') {
      csvContent += 'Data/Hora;Responsavel;Cargo;Acao;Referencia;Detalhes;Motivo;Impacto Financeiro (₲)\n';
      filteredAuditLogs.forEach((l) => {
        csvContent += `"${formatDate(l.timestamp)} ${formatTime(l.timestamp)}";"${l.actorName}";"${l.actorRole}";"${l.actionType}";"${l.targetReference}";"${l.details}";"${l.reason || ''}";${(l.amountImpact || 0).toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    showToast('Planilha Excel/CSV gerada com sucesso!', 'success');
  };

  // --- RECHARTS DATASETS (COM SUPORTE A GUARANI E BRL) ---
  const shiftChartData = useMemo(() => [
    { name: 'Almoço (11h-17h)', valor: salesDataset.lunchRevenue, color: '#f59e0b' },
    { name: 'Jantar (17h-23h+)', valor: salesDataset.dinnerRevenue, color: '#6366f1' },
  ], [salesDataset]);

  const paymentChartData = useMemo(() => {
    const bd = salesDataset.paymentBreakdown;
    const total = salesDataset.totalSales;
    return [
      { name: 'PIX (Instantâneo)', value: bd.PIX?.total || Math.round(total * 0.36), color: '#10b981' },
      { name: 'Cartão Crédito', value: bd.CREDITO?.total || Math.round(total * 0.38), color: '#3b82f6' },
      { name: 'Cartão Débito', value: bd.DEBITO?.total || Math.round(total * 0.16), color: '#f59e0b' },
      { name: 'Dinheiro Espécie', value: bd.DINHEIRO?.total || Math.round(total * 0.07), color: '#a8a29e' },
      { name: 'Vale Refeição', value: bd.VR_VA?.total || Math.round(total * 0.03), color: '#a855f7' },
    ];
  }, [salesDataset]);

  const dailyTrendData = useMemo(() => {
    return history30Days.slice(-12).map((d) => ({
      dia: d.displayDate,
      faturamento: d.totalSales,
      clientes: d.pax,
    }));
  }, [history30Days]);

  const cmvCategoryChartData = useMemo(() => {
    const catMap: Record<string, { faturamento: number; cmv: number; lucro: number }> = {};
    cmvAnalysis.items.forEach((it) => {
      const catKey = it.category.replace('_', ' ');
      if (!catMap[catKey]) {
        catMap[catKey] = { faturamento: 0, cmv: 0, lucro: 0 };
      }
      catMap[catKey].faturamento += it.totalItemRevenue;
      catMap[catKey].cmv += it.totalItemCost;
      catMap[catKey].lucro += it.profit * it.unitsSold;
    });
    return Object.entries(catMap).map(([categoria, vals]) => ({
      categoria,
      Faturamento: Math.round(vals.faturamento),
      CMV: Math.round(vals.cmv),
      LucroBruto: Math.round(vals.lucro),
    })).slice(0, 6);
  }, [cmvAnalysis]);

  const commissionsChartData = useMemo(() => {
    return staffCommissions.rows.map((r) => ({
      nome: r.employee.name.split(' ')[0],
      vendas: Math.round(r.attributedSales),
      comissao: Math.round(r.totalToPay),
    }));
  }, [staffCommissions]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-stone-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Central de Relatórios & Business Intelligence
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
              GESTÃO AVANÇADA
            </span>
          </div>
          <p className="text-stone-400 text-xs mt-1">
            Análises multidimensionais de vendas, margem e CMV por produto, fechamento de comissões, DRE gerencial e auditoria de perdas.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Moeda Local Guaraní */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
            <span className="text-sm">🇵🇾</span>
            <span>Moeda Oficial: Guaraní (₲ / PYG)</span>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={periodOption}
              onChange={(e) => setPeriodOption(e.target.value as PeriodOption)}
              className="bg-transparent text-stone-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="HOJE" className="bg-stone-900">Hoje</option>
              <option value="ONTEM" className="bg-stone-900">Ontem</option>
              <option value="7D" className="bg-stone-900">Últimos 7 Dias</option>
              <option value="30D" className="bg-stone-900">Últimos 30 Dias</option>
              <option value="MES_ATUAL" className="bg-stone-900">Mês Atual (Out/26)</option>
              <option value="MES_ANTERIOR" className="bg-stone-900">Mês Anterior (Set/26)</option>
            </select>
          </div>

          {/* Export CSV / Excel */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Baixar planilha compatível com Microsoft Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            title="Imprimir relatório oficial para prestação de contas"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-stone-800">
        <button
          onClick={() => setActiveSection('SALES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'SALES'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-stone-400 hover:text-white hover:bg-stone-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Vendas Multidimensional</span>
        </button>

        <button
          onClick={() => setActiveSection('CMV')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'CMV'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-stone-400 hover:text-white hover:bg-stone-900'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          <span>2. CMV & Margens por Produto</span>
        </button>

        <button
          onClick={() => setActiveSection('DRE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'DRE'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-stone-400 hover:text-white hover:bg-stone-900'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>3. DRE Simplificado</span>
        </button>

        <button
          onClick={() => setActiveSection('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'AUDIT'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-stone-400 hover:text-white hover:bg-stone-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>4. Auditoria & Prevenção de Perdas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. RELATÓRIO DE VENDAS MULTIDIMENSIONAL */}
      {/* ======================================================== */}
      {activeSection === 'SALES' && (
        <div className="space-y-5">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Faturamento Total</div>
              <div className="text-xl font-black text-amber-400 mt-1">
                {formatCurrency(salesDataset.totalSales)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">{dateRangeLabel}</div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Comandas</div>
              <div className="text-xl font-black text-stone-100 mt-1">
                {salesDataset.ordersCount}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">pedidos fechados</div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Ticket Médio</div>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {formatCurrency(salesDataset.avgTicket)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">por comanda</div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Clientes (Pax)</div>
              <div className="text-xl font-black text-stone-100 mt-1">
                {salesDataset.paxCount}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {formatCurrency(salesDataset.avgPerPax)}/pessoa
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Taxa de Serviço</div>
              <div className="text-xl font-black text-blue-400 mt-1">
                {formatCurrency(salesDataset.serviceTax)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">10% arrecadado</div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Descontos Concedidos</div>
              <div className="text-xl font-black text-purple-400 mt-1">
                {formatCurrency(salesDataset.discounts)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">cortesias & cupons</div>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome de produto..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Garçom */}
                <select
                  value={salesEmployeeFilter}
                  onChange={(e) => setSalesEmployeeFilter(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 font-medium focus:outline-none"
                >
                  <option value="TODOS">Todos os Garçons</option>
                  {employees
                    .filter((e) => e.role === 'GARCOM' || e.role === 'CAIXA')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                </select>

                {/* Categoria */}
                <select
                  value={salesCategoryFilter}
                  onChange={(e) => setSalesCategoryFilter(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 font-medium focus:outline-none"
                >
                  <option value="TODOS">Todas as Categorias</option>
                  <option value="RODIZIO">Rodízio Completo</option>
                  <option value="CORTES_NOBRES">Cortes Nobres na Brasa</option>
                  <option value="PRATOS_A_LA_CARTE">À La Carte</option>
                  <option value="CHOPP_DRINKS">Chopp & Drinks</option>
                  <option value="BEBIDAS">Bebidas & Não Alcoólicos</option>
                  <option value="ENTRADAS_GUARNACOES">Guarnições</option>
                  <option value="SOBREMESAS">Sobremesas</option>
                </select>
              </div>

              <div className="text-xs text-stone-400 font-medium">
                Exibindo <span className="font-bold text-stone-200">{salesDataset.productRows.length}</span> produtos
              </div>
            </div>
          </div>

          {/* Breakdown: Formas de Pagamento (Recharts) */}
          <div className="grid grid-cols-1 gap-4">
            {/* Formas de Pagamento com Recharts PieChart */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  Vendas por Forma de Pagamento (Recharts)
                </span>
                <span className="text-xs text-stone-500 font-medium">Mix de Recebimentos</span>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-pay-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: any) => [renderMoney(Number(val) || 0), 'Total Recebido']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-5 gap-1.5 text-center">
                {paymentChartData.map((p) => (
                  <div key={p.name} className="p-1.5 bg-stone-950/70 border border-stone-800/80 rounded-lg">
                    <div className="w-2 h-2 rounded-full mx-auto mb-0.5" style={{ backgroundColor: p.color }} />
                    <div className="text-[9px] text-stone-400 font-bold truncate">{p.name.split(' ')[0]}</div>
                    <div className="text-[10px] font-black font-mono mt-0.5" style={{ color: p.color }}>
                      {renderMoney(p.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evolução Diária no Período com Recharts AreaChart */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Curva de Faturamento Diário no Período (Moeda Oficial: Guaraní ₲)
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {dateRangeLabel}
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="dia" stroke="#a8a29e" fontSize={10} />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={10}
                    tickFormatter={(val) => `₲ ${Math.round(val / 1000000)}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any) => [renderMoney(Number(val) || 0), 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="faturamento" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Product Sales Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-stone-800 bg-stone-950/40 flex items-center justify-between">
              <h3 className="font-bold text-stone-200 text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                Ranking de Produtos Vendidos no Período
              </h3>
              <span className="text-[11px] text-stone-500">
                Ordenado por maior faturamento total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider bg-stone-950/60">
                    <th className="py-3 px-4"># Ranking & Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Preço Unitário</th>
                    <th className="py-3 px-4 text-center">Qtd Vendida</th>
                    <th className="py-3 px-4 text-right">Faturamento Total</th>
                    <th className="py-3 px-4 text-right">% Participação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {salesDataset.productRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-4 font-semibold text-stone-100 flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          index === 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : index === 1
                            ? 'bg-stone-300/20 text-stone-200 border border-stone-400/40'
                            : index === 2
                            ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                            : 'bg-stone-800 text-stone-400'
                        }`}>
                          {index + 1}
                        </span>
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-300">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-300">
                        {formatCurrency(row.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-100">
                        {row.quantity} un
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-stone-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, row.percentOfTotal * 2.5)}%` }}
                            />
                          </div>
                          <span className="font-mono text-stone-400 w-10 text-right">
                            {row.percentOfTotal.toFixed(1)}%
                          </span>
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

      {/* ======================================================== */}
      {/* 2. CMV (CUSTO DA MERCADORIA VENDIDA) & MARGENS */}
      {/* ======================================================== */}
      {activeSection === 'CMV' && (
        <div className="space-y-5">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <span>CMV Médio da Casa</span>
                <span className="text-emerald-400 text-xs">Meta: 28% a 35%</span>
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {cmvAnalysis.overallCmvPct.toFixed(1)}%
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Custo total de insumos vs faturamento apurado
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Margem Bruta Média
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {cmvAnalysis.overallMarginPct.toFixed(1)}%
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Margem de contribuição média nos pratos e rodízios
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                CMV Total (₲)
              </div>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {formatCurrency(cmvAnalysis.totalAnalysisCost)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Custo de carnes nobres, carvão, chopp e insumos
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Lucro Bruto Total
              </div>
              <div className="text-2xl font-black text-stone-100 mt-1">
                {formatCurrency(cmvAnalysis.overallGrossProfit)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Receita líquida antes das despesas de folha e aluguel
              </p>
            </div>
          </div>

          {/* Strategic Insights Banner */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-200">
                  Engenharia de Produtos & Vendas
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Carnes nobres (Picanha, Ancho) têm CMV de ~35%, mas geram alto valor absoluto (₲). Chopp Brahma e Sobremesas atingem margens superiores a 72% e equilibram a rentabilidade global.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                ⭐ Alta Margem (&gt;65%)
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                🟢 Saudável (50-65%)
              </span>
              <span className="flex items-center gap-1 text-red-400 font-bold">
                ⚠️ Alerta CMV (&gt;38%)
              </span>
            </div>
          </div>

          {/* Recharts BarChart: CMV vs Faturamento vs Lucro Bruto por Categoria */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                Comparativo Recharts: Faturamento x CMV x Lucro Bruto por Categoria (Guaraní ₲)
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                Engenharia de Custos
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cmvCategoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="categoria" stroke="#a8a29e" fontSize={10} />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={10}
                    tickFormatter={(val) => `₲ ${Math.round(val / 1000000)}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any, name: any) => [renderMoney(Number(val) || 0), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Faturamento" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CMV" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="LucroBruto" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Pesquisar produto ou corte..."
                  value={cmvSearch}
                  onChange={(e) => setCmvSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={cmvCategoryFilter}
                onChange={(e) => setCmvCategoryFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="TODOS">Todas as Categorias</option>
                <option value="RODIZIO">Rodízio Completo</option>
                <option value="CORTES_NOBRES">Cortes Nobres na Brasa</option>
                <option value="PRATOS_A_LA_CARTE">À La Carte</option>
                <option value="CHOPP_DRINKS">Chopp & Drinks</option>
                <option value="BEBIDAS">Bebidas</option>
                <option value="SOBREMESAS">Sobremesas</option>
                <option value="ENTRADAS_GUARNACOES">Guarnições</option>
              </select>

              <select
                value={cmvSortBy}
                onChange={(e) => setCmvSortBy(e.target.value as any)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="margin_desc">Maior Margem (%)</option>
                <option value="margin_asc">Menor Margem (%)</option>
                <option value="sales_desc">Maior Faturamento (₲)</option>
                <option value="cost_desc">Maior Custo Unitário (₲)</option>
              </select>
            </div>

            <div className="text-xs text-stone-400">
              Mostrando <span className="font-bold text-stone-200">{cmvAnalysis.items.length}</span> produtos analisados
            </div>
          </div>

          {/* Full CMV Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider bg-stone-950/60">
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Preço de Venda</th>
                    <th className="py-3 px-4 text-right">Custo Insumos (Ficha)</th>
                    <th className="py-3 px-4 text-right">Lucro Bruto Unit.</th>
                    <th className="py-3 px-4 text-center">Margem (%)</th>
                    <th className="py-3 px-4 text-center">CMV (%)</th>
                    <th className="py-3 px-4 text-center">Classificação</th>
                    <th className="py-3 px-4 text-right">CMV Total Acum.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {cmvAnalysis.items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-4 font-bold text-stone-100">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-200">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-200">
                        {item.marginPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400">
                        {item.cmvPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'ALTA_MARGEM' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Alta Margem
                          </span>
                        )}
                        {item.status === 'SAUDAVEL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Saudável
                          </span>
                        )}
                        {item.status === 'ALERTA_CMV' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                            Alerta CMV Alto
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-400">
                        {formatCurrency(item.totalItemCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. COMISSÕES E GORJETAS A PAGAR */}
      {/* ======================================================== */}
      {activeSection === 'COMMISSIONS' && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Total a Quitar (Pendente)
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {formatCurrency(staffCommissions.totalCommissionsToPay)}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Valores apurados aguardando repasse ao salão
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Já Quitado / Repassado
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrency(staffCommissions.totalCommissionsPaid)}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Comissões e gorjetas liquidadas no período
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Taxa de Serviço Total Gerada
              </div>
              <div className="text-2xl font-black text-blue-400 mt-1">
                {renderMoney(salesDataset.serviceTax)}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                10% retido de comandas fechadas
              </p>
            </div>
          </div>

          {/* Recharts BarChart: Comissões e Gorjetas a Pagar por Garçom */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Comissões & Gorjetas Apuradas por Colaborador (Guaraní ₲)
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                Fechamento de Folha & Taxa 10%
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commissionsChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="nome" stroke="#a8a29e" fontSize={11} />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={10}
                    tickFormatter={(val) => `₲ ${Math.round(val / 1000000)}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any, name: any) => [
                      renderMoney(Number(val) || 0),
                      name === 'vendas' ? 'Vendas Geradas' : 'Comissão/Gorjeta',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="vendas" name="Vendas Atribuídas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comissao" name="Comissão/Gorjeta Total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-stone-800 bg-stone-950/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-200 text-xs">
                  Demonstrativo Individual de Comissões e Gorjetas
                </h3>
                <p className="text-[11px] text-stone-500">
                  Cálculo automático baseado nas vendas atribuídas a cada funcionário no período
                </p>
              </div>

              <span className="text-xs text-stone-400 font-medium">
                {staffCommissions.rows.length} colaboradores
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider bg-stone-950/60">
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Função</th>
                    <th className="py-3 px-4 text-right">Vendas Atribuídas</th>
                    <th className="py-3 px-4 text-right">Taxa 10% Gerada</th>
                    <th className="py-3 px-4 text-right">Gorjetas Extras</th>
                    <th className="py-3 px-4 text-center">% Comissão</th>
                    <th className="py-3 px-4 text-right">Total a Pagar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {staffCommissions.rows.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-4 font-bold text-stone-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {row.employee.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span>{row.employee.name}</span>
                      </td>
                      <td className="py-3 px-4 text-stone-400">
                        {row.employee.role}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-300">
                        {formatCurrency(row.attributedSales)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-400">
                        {formatCurrency(row.serviceTaxGenerated)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-300">
                        {formatCurrency(row.voluntaryTips)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
                        {row.commissionRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        {formatCurrency(row.totalToPay)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.isPaid ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Liquidado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> A Pagar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.isPaid ? (
                          <span className="text-[11px] text-stone-500">Quitação registrada</span>
                        ) : (
                          <button
                            onClick={() => handlePayCommission(row.employee.id, row.employee.name, row.totalToPay)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            Quitar Agora
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DRE SIMPLIFICADO (DEMONSTRATIVO DO RESULTADO) */}
      {/* ======================================================== */}
      {activeSection === 'DRE' && (
        <div className="space-y-5">
          {/* Executive Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Receita Operacional Líquida (ROL)
              </div>
              <div className="text-2xl font-black text-stone-100 mt-1">
                {formatCurrency(dreReport.rol)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Base 100% das apurações</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                EBITDA / Resultado Operacional
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {formatCurrency(dreReport.ebitda)}
              </div>
              <div className="text-[11px] text-amber-400/80 mt-0.5 font-bold">
                Margem EBITDA: {dreReport.ebitdaMarginPct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Lucro Líquido do Exercício
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrency(dreReport.lucroLiquido)}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5 font-bold">
                Margem Líquida: {dreReport.margemLiquidaPct.toFixed(1)}% (Excelente)
              </div>
            </div>
          </div>

          {/* DRE Structured Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-stone-800 bg-stone-950/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-200 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Demonstrativo do Resultado do Exercício (DRE Gerencial)
                </h3>
                <p className="text-[11px] text-stone-500">
                  {settings.name} · CNPJ {settings.cnpj} · Período: {dateRangeLabel}
                </p>
              </div>

              <div className="text-xs text-stone-400 font-mono">
                Competência Mensal
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Table Body formatted */}
              <div className="divide-y divide-stone-800 text-xs">
                {/* 1. Receita Bruta */}
                <div className="py-2.5 flex justify-between items-center font-bold text-stone-100 bg-stone-950/30 px-3 rounded-lg">
                  <span className="flex items-center gap-1.5 text-stone-200">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    (+) RECEITA OPERACIONAL BRUTA
                  </span>
                  <div className="flex items-center gap-6 font-mono">
                    <span>{formatCurrency(dreReport.grossRevenue)}</span>
                    <span className="text-stone-400 w-16 text-right">
                      {((dreReport.grossRevenue / dreReport.rol) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Vendas de Rodízios Completos</span>
                  <span className="font-mono">{formatCurrency(dreReport.rodizioRevenue)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Cortes Nobres na Brasa (Picanha, Ancho, Costela)</span>
                  <span className="font-mono">{formatCurrency(dreReport.carnesNobresRevenue)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Bebidas, Chopp e Drinques</span>
                  <span className="font-mono">{formatCurrency(dreReport.bebidasRevenue)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• À La Carte, Guarnições e Sobremesas</span>
                  <span className="font-mono">{formatCurrency(dreReport.outrosRevenue)}</span>
                </div>

                {/* 2. Deduções */}
                <div className="py-2.5 flex justify-between items-center font-bold text-rose-400 bg-rose-950/10 px-3 rounded-lg mt-2">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    (-) DEDUÇÕES DA RECEITA BRUTA
                  </span>
                  <div className="flex items-center gap-6 font-mono">
                    <span>-{formatCurrency(dreReport.totalDeducoes)}</span>
                    <span className="text-rose-400/80 w-16 text-right">
                      -{((dreReport.totalDeducoes / dreReport.rol) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Cancelamentos e Estornos de Comandas</span>
                  <span className="font-mono">-{formatCurrency(dreReport.cancelamentosEstornos)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Descontos Comerciais e Cortesias Concedidas</span>
                  <span className="font-mono">-{formatCurrency(dreReport.descontosComerciais)}</span>
                </div>

                {/* 3. ROL */}
                <div className="py-2.5 flex justify-between items-center font-black text-amber-400 bg-amber-950/20 px-3 rounded-lg mt-2">
                  <span>(=) RECEITA OPERACIONAL LÍQUIDA (ROL)</span>
                  <div className="flex items-center gap-6 font-mono text-sm">
                    <span>{formatCurrency(dreReport.rol)}</span>
                    <span className="w-16 text-right font-bold">100.0%</span>
                  </div>
                </div>

                {/* 4. CMV */}
                <div className="py-2.5 flex justify-between items-center font-bold text-rose-400 bg-rose-950/10 px-3 rounded-lg mt-2">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    (-) CUSTO DAS MERCADORIAS VENDIDAS (CMV)
                  </span>
                  <div className="flex items-center gap-6 font-mono">
                    <span>-{formatCurrency(dreReport.cmvTotal)}</span>
                    <span className="text-rose-400/80 w-16 text-right">
                      -{((dreReport.cmvTotal / dreReport.rol) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Carnes Nobres e Insumos Bovinos (Frigoríficos)</span>
                  <span className="font-mono">-{formatCurrency(dreReport.cmvCarnes)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Chopp e Bebidas Alcoólicas e Refrigerantes</span>
                  <span className="font-mono">-{formatCurrency(dreReport.cmvBebidas)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Carvão Especial e Lenha para a Parrilla</span>
                  <span className="font-mono">-{formatCurrency(dreReport.cmvCarvaoGas)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Hortifrúti, Mercearia e Acompanhamentos do Buffet</span>
                  <span className="font-mono">-{formatCurrency(dreReport.cmvHortifrutiOutros)}</span>
                </div>

                {/* 5. Lucro Bruto */}
                <div className="py-2.5 flex justify-between items-center font-bold text-stone-100 bg-stone-950/40 px-3 rounded-lg mt-2">
                  <span>(=) LUCRO BRUTO OPERACIONAL</span>
                  <div className="flex items-center gap-6 font-mono font-bold">
                    <span>{formatCurrency(dreReport.lucroBruto)}</span>
                    <span className="text-stone-300 w-16 text-right">
                      {dreReport.margemBrutaPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 6. Despesas Operacionais */}
                <div className="py-2.5 flex justify-between items-center font-bold text-rose-400 bg-rose-950/10 px-3 rounded-lg mt-2">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    (-) DESPESAS OPERACIONAIS FIXAS E VARIÁVEIS
                  </span>
                  <div className="flex items-center gap-6 font-mono">
                    <span>-{formatCurrency(dreReport.totalDespesasOperacionais)}</span>
                    <span className="text-rose-400/80 w-16 text-right">
                      -{((dreReport.totalDespesasOperacionais / dreReport.rol) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Folha de Pagamento & Salários Fixos da Equipe</span>
                  <span className="font-mono">-{formatCurrency(dreReport.despesasFolhaSalarios)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Comissões e Repasses de Gorjetas aos Garçons</span>
                  <span className="font-mono">-{formatCurrency(dreReport.despesasComissoesGorjetas)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Aluguel e Ocupação Comercial do Imóvel</span>
                  <span className="font-mono">-{formatCurrency(dreReport.despesasAluguel)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Energia Elétrica (Câmaras Frias) e Gás Encanado</span>
                  <span className="font-mono">-{formatCurrency(dreReport.despesasEnergiaAgua)}</span>
                </div>
                <div className="pl-6 py-1.5 flex justify-between text-stone-400">
                  <span>• Manutenção, Higienização e Despesas Administrativas</span>
                  <span className="font-mono">-{formatCurrency(dreReport.despesasManutencaoGeral)}</span>
                </div>

                {/* 7. EBITDA */}
                <div className="py-2.5 flex justify-between items-center font-bold text-indigo-300 bg-indigo-950/20 px-3 rounded-lg mt-2">
                  <span>(=) RESULTADO OPERACIONAL ANTES DOS IMPOSTOS (EBITDA)</span>
                  <div className="flex items-center gap-6 font-mono font-bold">
                    <span>{formatCurrency(dreReport.ebitda)}</span>
                    <span className="w-16 text-right">
                      {dreReport.ebitdaMarginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 8. Impostos */}
                <div className="py-2.5 flex justify-between items-center text-rose-400 bg-rose-950/10 px-3 rounded-lg mt-2">
                  <span>(-) PROVISÃO DE TRIBUTOS (Simples Nacional / DAS)</span>
                  <div className="flex items-center gap-6 font-mono font-bold">
                    <span>-{formatCurrency(dreReport.impostosSimples)}</span>
                    <span className="w-16 text-right text-rose-400/80">
                      -{((dreReport.impostosSimples / dreReport.rol) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 9. Lucro Líquido Final */}
                <div className="py-3.5 flex justify-between items-center font-black text-emerald-400 bg-emerald-950/30 px-3 rounded-xl mt-3 text-sm border border-emerald-500/30">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    (=) LUCRO LÍQUIDO DO EXERCÍCIO
                  </span>
                  <div className="flex items-center gap-6 font-mono text-base">
                    <span>{formatCurrency(dreReport.lucroLiquido)}</span>
                    <span className="w-16 text-right font-black">
                      {dreReport.margemLiquidaPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. AUDITORIA: QUEM CANCELOU, DESCONTOU OU ALTEROU */}
      {/* ======================================================== */}
      {activeSection === 'AUDIT' && (
        <div className="space-y-5">
          {/* Audit KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Descontos Concedidos
              </div>
              <div className="text-xl font-black text-purple-400 mt-1">
                {formatCurrency(auditMetrics.totalDiscountsImpact)}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Impacto financeiro acumulado</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Cancelamentos & Estornos
              </div>
              <div className="text-xl font-black text-rose-400 mt-1">
                {formatCurrency(auditMetrics.totalCancellationsImpact)}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Perdas revertidas no caixa</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Perdas & Descartes Estoque
              </div>
              <div className="text-xl font-black text-orange-400 mt-1">
                {formatCurrency(auditMetrics.totalWasteImpact)}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Aparas, queima e avarias</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Total de Registros
              </div>
              <div className="text-xl font-black text-stone-100 mt-1">
                {auditMetrics.totalEventsCount}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Trilhas de auditoria ativas</p>
            </div>
          </div>

          {/* Audit Filters Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Buscar por comanda, mesa, produto..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Type Filter */}
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="TODOS">Todos os Eventos</option>
                <option value="CANCELAMENTO_ITEM">Cancelamentos de Item</option>
                <option value="CANCELAMENTO_COMANDA">Cancelamentos de Comanda</option>
                <option value="ESTORNO_PAGAMENTO">Estornos de Pagamento</option>
                <option value="DESCONTO_CONCEDIDO">Descontos Concedidos</option>
                <option value="ALTERACAO_PRECO">Alterações de Preço</option>
                <option value="AJUSTE_ESTOQUE">Ajustes de Estoque</option>
                <option value="SANGRIA_CAIXA">Sangrias de Caixa</option>
                <option value="DIFERENCA_FECHAMENTO">Divergências de Fechamento</option>
              </select>

              {/* Actor Filter */}
              <select
                value={auditActorFilter}
                onChange={(e) => setAuditActorFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="TODOS">Todos os Responsáveis</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-stone-400">
              Mostrando <span className="font-bold text-stone-200">{filteredAuditLogs.length}</span> registros de auditoria
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider bg-stone-950/60">
                    <th className="py-3 px-4">Data e Hora</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Tipo de Ação</th>
                    <th className="py-3 px-4">Alvo / Referência</th>
                    <th className="py-3 px-4">Detalhes & Motivo</th>
                    <th className="py-3 px-4 text-right">Impacto (₲)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500">
                        Nenhum registro de auditoria encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-800/30 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-400 font-mono">
                          <div>{formatDate(log.timestamp)}</div>
                          <div className="text-[10px] text-stone-500">{formatTime(log.timestamp)}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-stone-200">{log.actorName}</div>
                          <div className="text-[10px] text-amber-500 font-semibold">{log.actorRole}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderAuditActionBadge(log.actionType)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-200">
                          {log.targetReference}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-stone-300 font-medium">{log.details}</div>
                          {log.reason && (
                            <div className="text-[11px] text-stone-500 italic mt-0.5">
                              Justificativa: {log.reason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                          {log.amountImpact && log.amountImpact > 0 ? (
                            <span className="text-rose-400">
                              {formatCurrency(log.amountImpact)}
                            </span>
                          ) : (
                            <span className="text-stone-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: IMPRESSÃO & PDF OFICIAL */}
      {/* ======================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-500" />
                Relatório Gerencial Oficial para Impressão
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Gerar PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Surface */}
            <div className="p-6 bg-white text-stone-900 rounded-xl font-sans text-xs space-y-4 print:p-0">
              <div className="text-center pb-3 border-b border-stone-300">
                <h2 className="text-base font-extrabold uppercase tracking-tight">{settings.name}</h2>
                <div className="text-[11px] text-stone-600">CNPJ: {settings.cnpj} · {settings.address}</div>
                <div className="text-xs font-bold text-stone-800 mt-1 uppercase">
                  RELATÓRIO OFICIAL: {activeSection === 'SALES' ? 'VENDAS MULTIDIMENSIONAL' : activeSection === 'CMV' ? 'ANÁLISE DE CMV E MARGENS' : activeSection === 'COMMISSIONS' ? 'COMISSÕES E GORJETAS' : activeSection === 'DRE' ? 'DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO (DRE)' : 'AUDITORIA E PREVENÇÃO DE PERDAS'}
                </div>
                <div className="text-[10px] text-stone-500">
                  Período: {dateRangeLabel} · Emitido em: {formatDate(new Date().toISOString())} às {formatTime(new Date().toISOString())}
                </div>
              </div>

              {/* Condensed Summary for Print */}
              <div className="space-y-2 border border-stone-300 rounded-lg p-3 bg-stone-50">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>FATURAMENTO BRUTO:</span>
                  <span className="font-mono">{formatCurrency(salesDataset.totalSales)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>RECEITA OPERACIONAL LÍQUIDA (ROL):</span>
                  <span className="font-mono">{formatCurrency(dreReport.rol)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>CMV TOTAL DE INSUMOS:</span>
                  <span className="font-mono">{formatCurrency(cmvAnalysis.totalAnalysisCost)} ({cmvAnalysis.overallCmvPct.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>LUCRO LÍQUIDO DO EXERCÍCIO:</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(dreReport.lucroLiquido)} ({dreReport.margemLiquidaPct.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>TAXA DE SERVIÇO / GORJETAS ARRECADADAS:</span>
                  <span className="font-mono">{formatCurrency(salesDataset.serviceTax)}</span>
                </div>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-stone-600">
                <div className="border-t border-stone-400 pt-1">
                  Gerente Geral / Operador Responsável
                </div>
                <div className="border-t border-stone-400 pt-1">
                  Auditoria Contábil / Diretoria
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
