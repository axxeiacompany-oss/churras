import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { formatCurrency, formatTime, formatDate } from '../../utils/format';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  Package,
  ArrowUpRight,
  Receipt,
  Users,
  CreditCard,
  Building,
  User,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

export const DailyPdfReportTab: React.FC = () => {
  const {
    menuItems,
    comandas,
    settings,
    currentUser,
  } = useChurras();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Filter comandas for selected date (excluding cancelled ones)
  const dateComandas = useMemo(() => {
    return (comandas || []).filter((c) => {
      const cDate = (c.closedAt || c.openedAt || '').split('T')[0];
      return cDate === selectedDate && c.status !== 'CANCELADA';
    });
  }, [comandas, selectedDate]);

  // Aggregate items sold today from comandas
  const dateSales = useMemo(() => {
    const productSalesMap = new Map<
      string,
      {
        productId: string;
        name: string;
        category: string;
        quantity: number;
        unitPrice: number;
        totalRevenue: number;
      }
    >();

    dateComandas.forEach((c) => {
      c.items.forEach((item) => {
        if (item.status === 'CANCELADO') return;
        const existing = productSalesMap.get(item.menuItemId);
        const menuItem = menuItems.find((m) => m.id === item.menuItemId);

        if (existing) {
          existing.quantity += item.quantity;
          existing.totalRevenue += item.price * item.quantity;
        } else {
          productSalesMap.set(item.menuItemId, {
            productId: item.menuItemId,
            name: item.name,
            category: menuItem?.category || 'OUTROS',
            quantity: item.quantity,
            unitPrice: item.price,
            totalRevenue: item.price * item.quantity,
          });
        }
      });
    });

    return Array.from(productSalesMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
  }, [dateComandas, menuItems]);

  const totalSoldToday = useMemo(() => {
    return dateSales.reduce((sum, s) => sum + s.totalRevenue, 0);
  }, [dateSales]);

  const totalQuantitySold = useMemo(() => {
    return dateSales.reduce((sum, s) => sum + s.quantity, 0);
  }, [dateSales]);

  // Payment breakdown
  const paymentBreakdown = useMemo(() => {
    const totals: Record<string, number> = {
      DINHEIRO: 0,
      PIX: 0,
      CARTAO_DEBITO: 0,
      CARTAO_CREDITO: 0,
      OUTROS: 0,
    };

    dateComandas.forEach((c) => {
      if (c.payments && c.payments.length > 0) {
        c.payments.forEach((p) => {
          if (totals[p.method] !== undefined) {
            totals[p.method] += p.amount;
          } else {
            totals.OUTROS += p.amount;
          }
        });
      } else if (c.status === 'PAGA') {
        // Fallback if closed without specific payments list
        totals.DINHEIRO += c.total;
      }
    });

    return totals;
  }, [dateComandas]);

  const averageTicket = useMemo(() => {
    if (dateComandas.length === 0) return 0;
    return totalSoldToday / dateComandas.length;
  }, [totalSoldToday, dateComandas]);

  const handlePrintPdf = () => {
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-600/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  Relatório Diário Oficial (PDF)
                </h2>
                <p className="text-xs text-stone-400">
                  Demonstrativo executivo de fechamento diário e vendas com emissão pronta para PDF
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300">
              <Calendar className="w-4 h-4 text-amber-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs font-mono"
              />
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Exportar Relatório em PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Resumo Consolidado do Dia (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Faturado */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>Faturamento Total</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-2 tabular-nums">
              {formatCurrency(totalSoldToday)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Data de apuração:</span>
            <span className="font-bold text-white font-mono">{selectedDate}</span>
          </div>
        </div>

        {/* Card 2: Comandas Atendidas */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>Comandas Atendidas</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2 tabular-nums">
              {dateComandas.length}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Mesas / Balcão:</span>
            <span className="font-bold text-blue-400 font-mono">
              {dateComandas.filter((c) => c.status === 'PAGA').length} pagas
            </span>
          </div>
        </div>

        {/* Card 3: Itens Vendidos */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>Itens Vendidos</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-2 tabular-nums">
              {totalQuantitySold} un
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Variedades no cardápio:</span>
            <span className="font-bold text-white font-mono">{dateSales.length} produtos</span>
          </div>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>Ticket Médio</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-2 tabular-nums">
              {formatCurrency(averageTicket)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Média por comanda:</span>
            <span className="font-bold text-white font-mono">
              {dateComandas.length > 0 ? `${Math.round(totalQuantitySold / dateComandas.length)} itens/comanda` : '0 itens'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Resumo por Formas de Pagamento */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">
              Fechamento por Meios de Pagamento
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            Total recebido: <strong className="text-emerald-400 font-mono">{formatCurrency(totalSoldToday)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400">Dinheiro (Efetivo)</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">
              {formatCurrency(paymentBreakdown.DINHEIRO)}
            </div>
          </div>
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400">PIX / Transferência</div>
            <div className="text-base font-bold text-sky-400 font-mono mt-1">
              {formatCurrency(paymentBreakdown.PIX)}
            </div>
          </div>
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400">Cartão de Débito</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-1">
              {formatCurrency(paymentBreakdown.CARTAO_DEBITO)}
            </div>
          </div>
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400">Cartão de Crédito</div>
            <div className="text-base font-bold text-purple-400 font-mono mt-1">
              {formatCurrency(paymentBreakdown.CARTAO_CREDITO)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Duas Tabelas: Vendas por Produto e Comandas Atendidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de Vendas por Produto */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                Vendas por Produto ({dateSales.length})
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {formatCurrency(totalSoldToday)}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/70 border-b border-stone-800 text-[10px] uppercase font-bold text-stone-400">
                <tr>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-right">Total Faturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {dateSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-500 font-sans">
                      Nenhuma venda registrada nesta data.
                    </td>
                  </tr>
                ) : (
                  dateSales.map((sale) => (
                    <tr key={sale.productId} className="hover:bg-stone-800/40">
                      <td className="py-2.5 px-3 font-sans font-medium text-stone-200">
                        {sale.name}
                      </td>
                      <td className="py-2.5 px-3 text-center text-white font-bold">
                        {sale.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-400">
                        {formatCurrency(sale.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {formatCurrency(sale.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Comandas Atendidas */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">
                Comandas Atendidas ({dateComandas.length})
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-blue-400">
              {dateComandas.length} pedidos
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/70 border-b border-stone-800 text-[10px] uppercase font-bold text-stone-400">
                <tr>
                  <th className="py-2.5 px-3">Comanda</th>
                  <th className="py-2.5 px-3">Mesa/Local</th>
                  <th className="py-2.5 px-3">Garçom</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {dateComandas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500 font-sans">
                      Nenhuma comanda registrada nesta data.
                    </td>
                  </tr>
                ) : (
                  dateComandas.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        #{c.code}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-stone-200">
                        {c.tableLabel}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-stone-400 text-[11px]">
                        {c.waiterName}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {formatCurrency(c.total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'PAGA'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Modal de Pré-visualização e Impressão / PDF */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">
                  Relatório Diário Oficial de Vendas & Fechamento (PDF)
                </h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folha Formal de Relatório para PDF */}
            <div
              id="printable-report"
              className="bg-white text-stone-900 p-6 rounded-2xl shadow-inner space-y-5 text-xs font-sans print:p-0 print:shadow-none"
            >
              {/* Cabeçalho */}
              <div className="border-b-2 border-stone-900 pb-3 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight uppercase">
                    {settings.name || 'Brasa & Fogo Churrascaria Prime'}
                  </h1>
                  <p className="text-[11px] text-stone-600">
                    {settings.cnpj || 'RUC: 80092345-6'} · {settings.address}
                  </p>
                  <p className="text-[11px] text-stone-600">Tel: {settings.phone}</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 bg-stone-900 text-white font-bold text-[10px] rounded uppercase tracking-wider">
                    Relatório Diário de Vendas
                  </div>
                  <p className="text-[11px] font-mono font-bold mt-1">Data: {selectedDate}</p>
                  <p className="text-[10px] text-stone-500">
                    Gerado por: {currentUser?.name || 'Administrador'}
                  </p>
                </div>
              </div>

              {/* Quadro Resumo */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-stone-100 rounded-xl border border-stone-300">
                <div>
                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                    Faturamento do Dia:
                  </span>
                  <div className="text-base font-extrabold text-emerald-700 font-mono">
                    {formatCurrency(totalSoldToday)}
                  </div>
                  <span className="text-[10px] text-stone-500">Receita Bruta</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                    Comandas:
                  </span>
                  <div className="text-base font-extrabold text-stone-800 font-mono">
                    {dateComandas.length}
                  </div>
                  <span className="text-[10px] text-stone-500">Atendimentos</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                    Itens Vendidos:
                  </span>
                  <div className="text-base font-extrabold text-stone-800 font-mono">
                    {totalQuantitySold} un
                  </div>
                  <span className="text-[10px] text-stone-500">Produtos baixados</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                    Ticket Médio:
                  </span>
                  <div className="text-base font-extrabold text-stone-800 font-mono">
                    {formatCurrency(averageTicket)}
                  </div>
                  <span className="text-[10px] text-stone-500">Por comanda</span>
                </div>
              </div>

              {/* Formas de Pagamento no PDF */}
              <div>
                <h4 className="font-bold text-stone-900 border-b border-stone-300 pb-1 mb-2">
                  1. Formas de Pagamento Recebidas
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-stone-50 border border-stone-200 rounded">
                    <span className="text-[10px] font-semibold text-stone-600">Dinheiro</span>
                    <div className="font-mono font-bold text-stone-900 mt-0.5">
                      {formatCurrency(paymentBreakdown.DINHEIRO)}
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 border border-stone-200 rounded">
                    <span className="text-[10px] font-semibold text-stone-600">PIX</span>
                    <div className="font-mono font-bold text-stone-900 mt-0.5">
                      {formatCurrency(paymentBreakdown.PIX)}
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 border border-stone-200 rounded">
                    <span className="text-[10px] font-semibold text-stone-600">Cartão Débito</span>
                    <div className="font-mono font-bold text-stone-900 mt-0.5">
                      {formatCurrency(paymentBreakdown.CARTAO_DEBITO)}
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 border border-stone-200 rounded">
                    <span className="text-[10px] font-semibold text-stone-600">Cartão Crédito</span>
                    <div className="font-mono font-bold text-stone-900 mt-0.5">
                      {formatCurrency(paymentBreakdown.CARTAO_CREDITO)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Produtos Vendidos */}
              <div>
                <h4 className="font-bold text-stone-900 border-b border-stone-300 pb-1 mb-2">
                  2. Demonstrativo de Vendas Realizadas ({dateSales.length} itens)
                </h4>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-stone-400 bg-stone-100 font-bold">
                      <th className="py-1 px-2">Produto</th>
                      <th className="py-1 px-2 text-center">Qtd</th>
                      <th className="py-1 px-2 text-right">Preço Unit.</th>
                      <th className="py-1 px-2 text-right">Total Faturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateSales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-stone-500">
                          Sem vendas registradas nesta data.
                        </td>
                      </tr>
                    ) : (
                      dateSales.map((s) => (
                        <tr key={s.productId} className="border-b border-stone-200">
                          <td className="py-1 px-2">{s.name}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold">
                            {s.quantity}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatCurrency(s.unitPrice)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-emerald-800">
                            {formatCurrency(s.totalRevenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Assinatura */}
              <div className="pt-8 border-t border-stone-300 flex justify-between items-center text-[10px] text-stone-500">
                <div>
                  <p>Documento gerado eletronicamente pelo ChurrasGestão</p>
                  <p>{formatDate(new Date().toISOString())} às {formatTime(new Date().toISOString())}</p>
                </div>
                <div className="text-center w-48 border-t border-stone-400 pt-1">
                  <p className="font-bold text-stone-800">Visto da Administração</p>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handlePrintPdf}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar como PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
