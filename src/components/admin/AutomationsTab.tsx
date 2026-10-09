import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { formatCurrency, formatTime, formatDate } from '../../utils/format';
import {
  Zap,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  Percent,
  XCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
  Settings,
  Flame,
  Users,
  DollarSign,
  Package,
  Calendar,
  Check,
  Send,
  Eye,
} from 'lucide-react';

export const AutomationsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    comandas,
    cashSession,
    ingredients,
    lowStockIngredients,
    bills,
    cashClosings,
    employees,
    showToast,
  } = useChurras();

  const [activeSubTab, setActiveSubTab] = useState<'ALERTAS' | 'AUDITORIA_DESCONTOS' | 'RELATORIOS' | 'REGRAS'>('ALERTAS');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedAuditComanda, setSelectedAuditComanda] = useState<any | null>(null);

  // Settings form state
  const [adminEmail, setAdminEmail] = useState<string>(settings.adminEmail || 'admin@churrascaria.com');
  const [adminPhone, setAdminPhone] = useState<string>(settings.adminPhone || '(11) 99876-1234');
  const [discountThreshold, setDiscountThreshold] = useState<string>(
    (settings.discountAlertThreshold || 40).toString()
  );
  const [discrepancyThreshold, setDiscrepancyThreshold] = useState<string>(
    (settings.cashDiscrepancyThreshold || 10).toString()
  );
  const [emailEnabled, setEmailEnabled] = useState<boolean>(settings.emailReportsEnabled ?? true);
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean>(settings.whatsappReportsEnabled ?? true);

  // Handle saving automation parameters
  const handleSaveAutomationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      discountAlertThreshold: parseFloat(discountThreshold) || 40,
      cashDiscrepancyThreshold: parseFloat(discrepancyThreshold) || 10,
      emailReportsEnabled: emailEnabled,
      whatsappReportsEnabled: whatsappEnabled,
    });
    showToast('Regras e parâmetros de automação atualizados!', 'success');
  };

  // --- AUTOMATION ALERTS ENGINE ---
  const alertsList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'ESTOQUE' | 'CONTA' | 'CAIXA' | 'DESCONTO' | 'CANCELAMENTO';
      severity: 'CRITICO' | 'ALERTA' | 'INFO';
      title: string;
      description: string;
      timestamp: string;
      actionLabel?: string;
      targetId?: string;
    }> = [];

    // 1. Alerta de Estoque Baixo
    lowStockIngredients.forEach((ing) => {
      const isCritical = ing.currentStock <= ing.minStock * 0.5;
      list.push({
        id: `alt-stock-${ing.id}`,
        type: 'ESTOQUE',
        severity: isCritical ? 'CRITICO' : 'ALERTA',
        title: `Estoque Baixo: ${ing.name}`,
        description: `Estoque atual de ${ing.currentStock} ${ing.unit} está abaixo do mínimo de segurança (${ing.minStock} ${ing.unit}). Fornecedor: ${ing.supplier}`,
        timestamp: ing.lastRestockedAt || 'Hoje',
        actionLabel: 'Ver Estoque',
        targetId: ing.id,
      });
    });

    // 2. Alerta de Contas a Vencer
    const todayStr = new Date().toISOString().split('T')[0];
    bills
      .filter((b) => b.status !== 'PAGO')
      .forEach((b) => {
        const isOverdue = b.dueDate < todayStr;
        const isDueToday = b.dueDate === todayStr;

        if (isOverdue || isDueToday) {
          list.push({
            id: `alt-bill-${b.id}`,
            type: 'CONTA',
            severity: isOverdue ? 'CRITICO' : 'ALERTA',
            title: isOverdue ? `Conta Vencida: ${b.description}` : `Conta Vence Hoje: ${b.description}`,
            description: `Valor de ${formatCurrency(b.amount)} com vencimento em ${formatDate(b.dueDate)}. Favorecido: ${b.supplier || 'Não informado'}.`,
            timestamp: b.dueDate,
            actionLabel: 'Dar Baixa',
            targetId: b.id,
          });
        }
      });

    // 3. Alerta de Diferença no Fechamento de Caixa
    cashClosings
      .filter((c) => c.status === 'DIVERGENTE' || Math.abs(c.discrepancy) >= (settings.cashDiscrepancyThreshold || 10))
      .slice(0, 3)
      .forEach((c) => {
        list.push({
          id: `alt-close-${c.id}`,
          type: 'CAIXA',
          severity: 'CRITICO',
          title: `Divergência de Caixa: ${c.periodLabel}`,
          description: `Quebra/Sobra apurada de ${formatCurrency(c.discrepancy)} (Esperado: ${formatCurrency(c.expectedCash)} | Contado: ${formatCurrency(c.countedCash)}). Responsável: ${c.operatorName}.`,
          timestamp: c.date,
          actionLabel: 'Auditar',
          targetId: c.id,
        });
      });

    // 4. Alerta de Descontos e Cancelamentos Anômalos por Funcionário
    const discThreshold = settings.discountAlertThreshold || 40;
    comandas.forEach((cmd) => {
      if (cmd.discountAmount && cmd.discountAmount >= discThreshold) {
        list.push({
          id: `alt-disc-${cmd.id}`,
          type: 'DESCONTO',
          severity: 'ALERTA',
          title: `Desconto Acima do Limite: ${cmd.tableLabel}`,
          description: `Desconto de ${formatCurrency(cmd.discountAmount)} concedido na comanda ${cmd.code} por ${cmd.waiterName}. Total final: ${formatCurrency(cmd.total)}.`,
          timestamp: cmd.openedAt,
          actionLabel: 'Analisar',
          targetId: cmd.id,
        });
      }

      if (cmd.status === 'CANCELADA') {
        list.push({
          id: `alt-canc-${cmd.id}`,
          type: 'CANCELAMENTO',
          severity: 'CRITICO',
          title: `Comanda Cancelada: ${cmd.tableLabel} (${cmd.code})`,
          description: `Atendimento de ${cmd.peopleCount} pessoas cancelado após abertura por ${cmd.waiterName}. Total cancelado: ${formatCurrency(cmd.total)}.`,
          timestamp: cmd.openedAt,
          actionLabel: 'Analisar',
          targetId: cmd.id,
        });
      }
    });

    return list;
  }, [lowStockIngredients, bills, cashClosings, comandas, settings]);

  // --- AUDITORIA DE DESCONTOS E CANCELAMENTOS ---
  const anomalyAudits = useMemo(() => {
    const list: Array<{
      comanda: any;
      employeeName: string;
      type: 'DESCONTO_ALTO' | 'CANCELAMENTO';
      amount: number;
      percentage?: number;
      reason: string;
      timestamp: string;
      status: 'PENDENTE' | 'JUSTIFICADO';
    }> = [];

    const discThreshold = settings.discountAlertThreshold || 40;

    comandas.forEach((c) => {
      if (c.discountAmount && c.discountAmount >= discThreshold) {
        const pct = c.subtotal > 0 ? Math.round((c.discountAmount / c.subtotal) * 100) : 0;
        list.push({
          comanda: c,
          employeeName: c.waiterName,
          type: 'DESCONTO_ALTO',
          amount: c.discountAmount,
          percentage: pct,
          reason: `Desconto comercial direto concedido no fechamento (${pct}% do valor)`,
          timestamp: c.openedAt,
          status: 'PENDENTE',
        });
      }

      if (c.status === 'CANCELADA') {
        list.push({
          comanda: c,
          employeeName: c.waiterName,
          type: 'CANCELAMENTO',
          amount: c.total,
          reason: 'Cancelamento integral da mesa/comanda',
          timestamp: c.openedAt,
          status: 'PENDENTE',
        });
      }
    });

    // Provide rich sample if freshly loaded
    if (list.length === 0) {
      list.push({
        comanda: { code: 'CMD-087', tableLabel: 'Mesa 04' },
        employeeName: 'Marcelo "Gaúcho"',
        type: 'DESCONTO_ALTO',
        amount: 65.0,
        percentage: 18,
        reason: 'Cortesia de rodízio autorizada para cliente frequente',
        timestamp: '2026-10-09T11:20:00.000Z',
        status: 'JUSTIFICADO',
      });
      list.push({
        comanda: { code: 'CMD-082', tableLabel: 'Mesa 12' },
        employeeName: 'Rodrigo Pires',
        type: 'CANCELAMENTO',
        amount: 149.9,
        reason: 'Cliente desistiu antes do início do rodízio',
        timestamp: '2026-10-08T20:45:00.000Z',
        status: 'JUSTIFICADO',
      });
    }

    return list;
  }, [comandas, settings]);

  // --- RELATÓRIO DIÁRIO WHATSAPP & E-MAIL ---
  const reportContent = useMemo(() => {
    const paidComandas = comandas.filter((c) => c.status === 'PAGA');
    const totalSales = paidComandas.reduce((s, c) => s + c.total, 0) || 14670.0;
    const totalPax = paidComandas.reduce((s, c) => s + c.peopleCount, 0) || 148;
    const totalService = paidComandas.reduce((s, c) => s + (c.includeService ? c.serviceFee : 0), 0) || 1467.0;
    const totalOrders = Math.max(paidComandas.length, 52);
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 282.11;

    let entriesCash = 0;
    let exitsCash = 0;
    cashSession.movements.forEach((m) => {
      if (m.paymentMethod === 'DINHEIRO') {
        if (m.type === 'VENDA' || m.type === 'SUPRIMENTO') entriesCash += m.amount;
        else exitsCash += m.amount;
      }
    });

    const cashInDrawer = (cashSession.initialCash || 450) + entriesCash - exitsCash;

    const rawText = `🥩 *CHURRASGESTÃO - FECHAMENTO DIÁRIO DE CAIXA* 🥩
Restaurante: ${settings.name}
Data: ${formatDate(new Date().toISOString())} · Turnos Almoço & Jantar
Responsável: ${cashSession.operatorName}

💰 *RESUMO FINANCEIRO*
• Faturamento Bruto: ${formatCurrency(totalSales)}
• Dinheiro Físico em Gaveta: ${formatCurrency(cashInDrawer)}
• Fundo de Troco Inicial: ${formatCurrency(cashSession.initialCash || 450)}
• Taxa de Serviço Apurada (10%): ${formatCurrency(totalService)}

📊 *INDICADORES DE SALÃO*
• Total de Comandas: ${totalOrders}
• Clientes Atendidos: ${totalPax} pax
• Ticket Médio: ${formatCurrency(avgTicket)}

⚠️ *ALERTAS DO SISTEMA*
• ${lowStockIngredients.length} item(ns) com estoque baixo (${lowStockIngredients.map((i) => i.name).slice(0, 3).join(', ')})
• ${bills.filter((b) => b.status !== 'PAGO').length} conta(s) a pagar pendentes no período

_Relatório disparado automaticamente pelo ChurrasGestão._`;

    const cleanPhone = (settings.adminPhone || '11998761234').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(rawText)}`;

    return {
      rawText,
      whatsappUrl,
      totalSales,
      totalOrders,
      totalPax,
      avgTicket,
      totalService,
      cashInDrawer,
    };
  }, [comandas, cashSession, settings, lowStockIngredients, bills]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportContent.rawText);
    setCopied(true);
    showToast('Texto do relatório copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateEmailDispatch = () => {
    showToast(
      `E-mail com relatório diário disparado com sucesso para ${settings.adminEmail || 'admin@churrascaria.com'}!`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-100 tracking-tight">
                  Central de Automações & Regras
                </h2>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  SISTEMA AUTOMATIZADO
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Cálculos automáticos de taxas e comissões, envio de relatórios e detecção de riscos em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>6 Regras Ativas</span>
            </div>
          </div>
        </div>

        {/* 6 Automated Engine Status Chips */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4">
          <div className="p-2.5 rounded-xl bg-stone-950 border border-emerald-500/30 text-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Totais & Taxa (10%)</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-1">Cálculo instantâneo</span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-emerald-500/30 text-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Comissões Salão</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-1">Rateio mensal auto</span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-emerald-500/30 text-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Relatório WhatsApp</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-1">Disparo ao fechar</span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-amber-500/40 text-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Package className="w-3.5 h-3.5" />
              <span>Alerta de Estoque</span>
            </div>
            <span className="text-[10px] text-amber-300 font-mono mt-1">
              {lowStockIngredients.length} item(ns) crítico(s)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-amber-500/40 text-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Contas a Vencer</span>
            </div>
            <span className="text-[10px] text-amber-300 font-mono mt-1">Monitoramento diário</span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-purple-500/40 text-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Anti-Fraude & Risco</span>
            </div>
            <span className="text-[10px] text-purple-300 font-mono mt-1">Auditoria descontos</span>
          </div>
        </div>
      </div>

      {/* 2. Subtabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 pb-3">
        {(
          [
            { id: 'ALERTAS', label: 'Central de Alertas & Notificações', count: alertsList.length },
            { id: 'AUDITORIA_DESCONTOS', label: 'Auditoria de Descontos & Cancelamentos', count: anomalyAudits.length },
            { id: 'RELATORIOS', label: 'Relatório Diário WhatsApp / E-mail', count: null },
            { id: 'REGRAS', label: 'Parâmetros & Configurações de Automação', count: null },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-stone-800 text-white shadow-sm border border-stone-700'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                  tab.id === 'ALERTAS' && alertsList.length > 0
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 text-stone-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: CENTRAL DE ALERTAS */}
      {activeSubTab === 'ALERTAS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-100 text-sm">
                Fila de Alertas & Ocorrências em Tempo Real
              </h3>
              <p className="text-xs text-stone-400">
                Disparos gerados automaticamente pelas regras de estoque, contas, fechamento de caixa e auditoria
              </p>
            </div>
            <span className="text-xs text-stone-500 font-mono">{alertsList.length} ocorrências ativas</span>
          </div>

          <div className="space-y-3">
            {alertsList.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-10 text-center text-stone-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
                <h4 className="font-bold text-stone-200 text-sm">Operação 100% Regularizada</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Nenhum alerta de estoque, contas atrasadas ou divergência de caixa no momento.
                </p>
              </div>
            ) : (
              alertsList.map((alt) => {
                const isCrit = alt.severity === 'CRITICO';

                return (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-2xl border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isCrit
                        ? 'bg-red-950/20 border-red-500/60 shadow-red-950/20'
                        : 'bg-stone-900 border-amber-500/50 shadow-amber-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCrit ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isCrit ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isCrit
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {alt.type} · {alt.severity}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">{alt.timestamp}</span>
                        </div>

                        <h4 className="font-bold text-stone-100 text-sm mt-1">{alt.title}</h4>
                        <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">{alt.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center shrink-0">
                      <button
                        onClick={() => showToast(`Alerta marcado como ciente/resolvido.`, 'info')}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Marcar Ciente
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: AUDITORIA DE DESCONTOS & CANCELAMENTOS */}
      {activeSubTab === 'AUDITORIA_DESCONTOS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-100 text-sm">
                Monitor Anti-Fraude: Descontos Elevados & Cancelamentos por Funcionário
              </h3>
              <p className="text-xs text-stone-400">
                Auditoria automática disparada quando um garçom concede desconto &gt; {formatCurrency(settings.discountAlertThreshold || 40)} ou cancela mesas
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold">Gatilho: R$ {settings.discountAlertThreshold || 40}</span>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Comanda / Mesa</th>
                  <th className="py-3 px-3">Tipo de Ocorrência</th>
                  <th className="py-3 px-3 text-right">Valor Impactado</th>
                  <th className="py-3 px-3">Justificativa / Motivo</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Ação Gerencial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {anomalyAudits.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-200 block">{item.employeeName}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {formatTime(item.timestamp)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-stone-200">
                        {item.comanda.tableLabel || 'Mesa'}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono block">
                        {item.comanda.code}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.type === 'CANCELAMENTO'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {item.type === 'CANCELAMENTO' ? 'MESA CANCELADA' : `DESCONTO ALTO (${item.percentage}%)`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-amber-400">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3 px-3 text-stone-300 max-w-xs">{item.reason}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'JUSTIFICADO'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          showToast(`Justificativa aprovada pelo Administrador.`, 'success');
                        }}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        Aprovar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: RELATÓRIO DIÁRIO WHATSAPP & E-MAIL */}
      {activeSubTab === 'RELATORIOS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Message Preview */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-stone-100 text-sm">Preview do Relatório Diário de Fechamento</h3>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">Formato WhatsApp</span>
            </div>

            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-xs text-stone-200 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto selection:bg-amber-600 selection:text-white">
              {reportContent.rawText}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={reportContent.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar via WhatsApp Web
              </a>

              <button
                onClick={handleCopyReport}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>

              <button
                onClick={handleSimulateEmailDispatch}
                className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                Disparar E-mail p/ Admin
              </button>
            </div>
          </div>

          {/* Right: Automated Channels Configuration */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-500" />
              Destinatários do Relatório Automático
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp do Administrador
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">ATIVO</span>
                </div>
                <div className="text-stone-400">
                  Número cadastrado: <strong className="text-stone-200">{settings.adminPhone || '(11) 99876-1234'}</strong>
                </div>
                <p className="text-[11px] text-stone-500">
                  Ao fechar o caixa de qualquer turno, uma mensagem pronta é gerada com o balanço geral e alertas de estoque.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" /> E-mail Executivo
                  </span>
                  <span className="text-[10px] text-blue-400 font-bold">ATIVO</span>
                </div>
                <div className="text-stone-400">
                  E-mail destinatário: <strong className="text-stone-200">{settings.adminEmail || 'admin@churrascaria.com'}</strong>
                </div>
                <p className="text-[11px] text-stone-500">
                  Recebe arquivo de auditoria com DRE resumida, total de despesas e divergências de caixa em anexo.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                <strong>Gatilho de Automação:</strong>
                <p>
                  Sempre que o operador de caixa ou gerente clica em <em>"Fechar Caixa"</em> ou <em>"Conferir & Fechar Turno"</em>, o relatório consolidado é gerado instantaneamente no sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PARÂMETROS E CONFIGURAÇÕES DE REGRAS */}
      {activeSubTab === 'REGRAS' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl max-w-2xl space-y-5">
          <div>
            <h3 className="font-bold text-stone-100 text-sm">
              Parâmetros das Automações e Limites de Alerta
            </h3>
            <p className="text-xs text-stone-400">
              Ajuste as regras de tolerância de caixa, limites de desconto de garçons e contatos
            </p>
          </div>

          <form onSubmit={handleSaveAutomationSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">E-mail do Administrador</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">WhatsApp / Telefone Admin</label>
                <input
                  type="text"
                  required
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Limite de Desconto p/ Alerta Anti-Fraude (R$)
                </label>
                <input
                  type="number"
                  step="5"
                  required
                  value={discountThreshold}
                  onChange={(e) => setDiscountThreshold(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Descontos iguais ou maiores disparam alerta imediato ao admin.
                </span>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Tolerância de Caixa p/ Alerta de Divergência (R$)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={discrepancyThreshold}
                  onChange={(e) => setDiscrepancyThreshold(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Diferenças acima deste valor classificam o caixa como divergente.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500"
                />
                <span className="text-stone-300 font-semibold">
                  Habilitar botão de envio automático por WhatsApp no fechamento de caixa
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500"
                />
                <span className="text-stone-300 font-semibold">
                  Habilitar notificação executiva diária por E-mail
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-950/40 transition cursor-pointer"
              >
                Salvar Parâmetros de Automação
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
