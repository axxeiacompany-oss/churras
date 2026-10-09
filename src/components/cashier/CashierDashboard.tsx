import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { Comanda, PaymentMethod, Payment, CashMovementType } from '../../types';
import { formatCurrency, formatTime, getPaymentMethodLabel } from '../../utils/format';
import { ReceiptModal } from '../modals/ReceiptModal';
import { QuickSaleModal } from '../pos/QuickSaleModal';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  QrCode,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
  Lock,
  Unlock,
  Printer,
  Search,
  Percent,
  X,
  FileText,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';

export const CashierDashboard: React.FC = () => {
  const {
    cashSession,
    openCashSession,
    closeCashSession,
    addCashMovement,
    comandas,
    payComanda,
    toggleServiceFee,
    settings,
    currentUser,
    showToast,
  } = useChurras();

  const [search, setSearch] = useState<string>('');
  const [selectedComandaForPayment, setSelectedComandaForPayment] = useState<Comanda | null>(null);
  const [selectedComandaForReceipt, setSelectedComandaForReceipt] = useState<Comanda | null>(null);

  // Cashier modal states
  const [showQuickSale, setShowQuickSale] = useState<boolean>(false);
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [initialCashInput, setInitialCashInput] = useState<string>('500000');

  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [movementType, setMovementType] = useState<'SANGRIA' | 'SUPRIMENTO'>('SANGRIA');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementDesc, setMovementDesc] = useState<string>('');

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [paymentList, setPaymentList] = useState<Payment[]>([]);

  // Calculate Cashier Session Metrics
  const metrics = useMemo(() => {
    let salesTotal = 0;
    let suprimentos = 0;
    let sangrias = 0;
    let cashInDrawer = cashSession.initialCash || 0;

    cashSession.movements.forEach((mov) => {
      if (mov.type === 'VENDA') {
        salesTotal += mov.amount;
        if (mov.paymentMethod === 'DINHEIRO') {
          cashInDrawer += mov.amount;
        }
      } else if (mov.type === 'SUPRIMENTO') {
        suprimentos += mov.amount;
        if (mov.paymentMethod === 'DINHEIRO') {
          cashInDrawer += mov.amount;
        }
      } else if (mov.type === 'SANGRIA' || mov.type === 'DESPESA') {
        sangrias += mov.amount;
        if (mov.paymentMethod === 'DINHEIRO') {
          cashInDrawer -= mov.amount;
        }
      }
    });

    return {
      salesTotal,
      suprimentos,
      sangrias,
      cashInDrawer: Math.max(0, cashInDrawer),
    };
  }, [cashSession]);

  // Filter pending comandas
  const pendingComandas = useMemo(() => {
    return comandas
      .filter((c) => c.status === 'CONTA_SOLICITADA' || c.status === 'ABERTA')
      .filter((c) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          c.code.toLowerCase().includes(s) ||
          c.tableLabel.toLowerCase().includes(s) ||
          (c.customerName && c.customerName.toLowerCase().includes(s))
        );
      })
      .sort((a, b) => {
        // CONTA_SOLICITADA first
        if (a.status === 'CONTA_SOLICITADA' && b.status !== 'CONTA_SOLICITADA') return -1;
        if (b.status === 'CONTA_SOLICITADA' && a.status !== 'CONTA_SOLICITADA') return 1;
        return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
      });
  }, [comandas, search]);

  // Filter paid comandas
  const paidComandas = useMemo(() => {
    return comandas
      .filter((c) => c.status === 'PAGA')
      .sort((a, b) => new Date(b.closedAt || '').getTime() - new Date(a.closedAt || '').getTime())
      .slice(0, 10);
  }, [comandas]);

  const handleOpenPayment = (cmd: Comanda) => {
    setSelectedComandaForPayment(cmd);
    setPaymentList([]);
    setDiscountInput('0');
    setPaymentAmount(cmd.total.toFixed(2));
    setCashReceived(cmd.total.toFixed(2));
  };

  const handleAddPartialPayment = () => {
    if (!selectedComandaForPayment) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      method: paymentMethod,
      amount: amt,
      timestamp: new Date().toISOString(),
    };

    const nextList = [...paymentList, newPayment];
    setPaymentList(nextList);

    const paidSoFar = nextList.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, selectedComandaForPayment.total - parseFloat(discountInput || '0') - paidSoFar);
    setPaymentAmount(remaining.toFixed(2));
    setCashReceived(remaining.toFixed(2));
  };

  const handleFinalizePayment = () => {
    if (!selectedComandaForPayment) return;
    const discount = parseFloat(discountInput) || 0;
    const targetTotal = Math.max(0, selectedComandaForPayment.total - discount);

    let finalPayments = [...paymentList];

    // If user didn't click "Add partial", use current single payment
    if (finalPayments.length === 0) {
      const amt = parseFloat(paymentAmount) || targetTotal;
      finalPayments = [
        {
          id: `pay-${Date.now()}`,
          method: paymentMethod,
          amount: amt,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const totalPaid = finalPayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < targetTotal - 0.05) {
      showToast('O valor pago ainda não cobre o total da comanda.', 'warning');
      return;
    }

    payComanda(selectedComandaForPayment.id, finalPayments, discount);
    const finishedCmd = { ...selectedComandaForPayment, payments: finalPayments, discountAmount: discount };
    setSelectedComandaForPayment(null);
    setSelectedComandaForReceipt(finishedCmd);
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmount);
    if (!amt || amt <= 0) {
      showToast('Digite um valor numérico válido.', 'warning');
      return;
    }

    addCashMovement(
      movementType,
      amt,
      'DINHEIRO',
      movementDesc.trim() || (movementType === 'SANGRIA' ? 'Saída de Caixa' : 'Entrada de Caixa')
    );

    showToast(`${movementType === 'SANGRIA' ? 'Saída de Caixa' : 'Entrada de Caixa'} registrada com sucesso!`, 'success');
    setShowMovementModal(false);
    setMovementAmount('');
    setMovementDesc('');
  };

  const isCashierOpen = cashSession.status === 'ABERTO';

  return (
    <div className="space-y-6">
      {/* Cashier Status Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-100">Frente de Caixa</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isCashierOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isCashierOpen ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Operador: <strong className="text-stone-300">{cashSession.operatorName}</strong> • Abertura:{' '}
                {formatTime(cashSession.openedAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCashierOpen ? (
              <>
                <button
                  onClick={() => {
                    setMovementType('SUPRIMENTO');
                    setShowMovementModal(true);
                  }}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Registrar Entrada (+)
                </button>
                <button
                  onClick={() => {
                    setMovementType('SANGRIA');
                    setShowMovementModal(true);
                  }}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 text-red-400" />
                  Registrar Saída (-)
                </button>
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente fechar o caixa do turno atual?')) {
                      closeCashSession();
                    }
                  }}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Fechar Caixa
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Abrir Caixa Agora
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-stone-400 block">Fundo de Troco Inicial</span>
            <span className="text-lg font-bold text-stone-200 mt-1 block">
              {formatCurrency(cashSession.initialCash || 0)}
            </span>
          </div>
          <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-emerald-400 block">Vendas Recebidas</span>
            <span className="text-lg font-bold text-emerald-300 mt-1 block">
              {formatCurrency(metrics.salesTotal)}
            </span>
          </div>
          <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-red-400 block">Saídas de Caixa</span>
            <span className="text-lg font-bold text-red-300 mt-1 block">
              {formatCurrency(metrics.sangrias)}
            </span>
          </div>
          <div className="bg-stone-950 border border-amber-500/30 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-amber-400 block">Dinheiro em Gaveta</span>
            <span className="text-lg font-extrabold text-amber-300 mt-1 block">
              {formatCurrency(metrics.cashInDrawer)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Cashier Workspace: Pending Bills to Settle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Comandas awaiting payment */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-stone-100 text-base">Comandas em Aberto / Pagamento</h3>
              <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs font-semibold">
                {pendingComandas.length}
              </span>
            </div>

            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar comanda ou mesa..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {pendingComandas.length === 0 ? (
            <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-8 text-center text-stone-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40 mb-2" />
              <p className="text-sm font-medium">Nenhuma comanda pendente no momento.</p>
              <p className="text-xs text-stone-600 mt-1">Todas as contas do salão estão quitadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {pendingComandas.map((cmd) => {
                const isRequested = cmd.status === 'CONTA_SOLICITADA';
                return (
                  <div
                    key={cmd.id}
                    className={`bg-stone-900 border rounded-2xl p-4 transition flex flex-col justify-between ${
                      isRequested
                        ? 'border-amber-500/60 shadow-lg shadow-amber-950/20 bg-amber-950/10'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-stone-100 text-base">
                              {cmd.tableLabel}
                            </span>
                            {isRequested && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                                CONTA PEDIDA
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 font-mono block">
                            {cmd.code} • Garçom: {cmd.waiterName}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-amber-400 font-mono">
                          {formatCurrency(cmd.total)}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-800/80 text-xs space-y-1 text-stone-300">
                        <div className="flex justify-between text-stone-400">
                          <span>Cliente:</span>
                          <span className="font-medium text-stone-200">{cmd.customerName || 'Consumidor'}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Pessoas / Itens:</span>
                          <span>
                            {cmd.peopleCount} pax • {cmd.items.length} itens
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Taxa de Serviço:</span>
                          <button
                            onClick={() => toggleServiceFee(cmd.id)}
                            className={`text-[11px] underline font-medium cursor-pointer ${
                              cmd.includeService ? 'text-emerald-400' : 'text-stone-500'
                            }`}
                          >
                            {cmd.includeService ? `Inclusa (${formatCurrency(cmd.serviceFee)})` : 'Isenta (₲ 0)'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800 flex gap-2">
                      <button
                        onClick={() => setSelectedComandaForReceipt(cmd)}
                        className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition cursor-pointer"
                        title="Ver Cupom de Conferência"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenPayment(cmd)}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Receber Pagamento
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Payments & Kardex Cash Flow */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-stone-100 text-base">Últimas Comandas Pagas</h3>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 divide-y divide-stone-800 max-h-[500px] overflow-y-auto">
            {paidComandas.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">Nenhum pagamento registrado hoje.</p>
            ) : (
              paidComandas.map((c) => (
                <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-200 text-xs">{c.tableLabel}</span>
                      <span className="text-[10px] text-stone-500 font-mono">({c.code})</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {formatTime(c.closedAt)} • {c.customerName || 'Cliente'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-emerald-400 font-mono block">
                      {formatCurrency(c.total)}
                    </span>
                    <button
                      onClick={() => setSelectedComandaForReceipt(c)}
                      className="text-[10px] text-amber-500 hover:underline flex items-center gap-1 ml-auto mt-0.5 cursor-pointer"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      Cupom
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Open Cash Session */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-stone-100 mb-2">Abertura de Caixa</h3>
            <p className="text-xs text-stone-400 mb-4">
              Informe o valor em dinheiro vivo para troco inicial na gaveta.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-stone-300 mb-1">Fundo de Troco (₲)</label>
              <input
                type="number"
                step="1000"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOpenModal(false)}
                className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  openCashSession(parseFloat(initialCashInput) || 0);
                  setShowOpenModal(false);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Confirmar Abertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sangria / Suprimento */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-stone-100">
                {movementType === 'SANGRIA' ? 'Registrar Saída de Caixa' : 'Registrar Entrada de Caixa'}
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Valor em Dinheiro (₲)</label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder="0"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Motivo / Descrição</label>
                <input
                  type="text"
                  placeholder={
                    movementType === 'SANGRIA' ? 'Ex: Envio ao cofre central' : 'Ex: Reforço de moedas'
                  }
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Payment */}
      {selectedComandaForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">
                    Fechar Comanda: {selectedComandaForPayment.tableLabel}
                  </h3>
                  <span className="text-xs text-stone-400 font-mono">
                    Código: {selectedComandaForPayment.code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedComandaForPayment(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Order total recap */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal consumo:</span>
                  <span>{formatCurrency(selectedComandaForPayment.subtotal)}</span>
                </div>
                {selectedComandaForPayment.includeService && (
                  <div className="flex justify-between text-stone-400">
                    <span>Taxa de Serviço ({settings.serviceTaxPercentage}%):</span>
                    <span>{formatCurrency(selectedComandaForPayment.serviceFee)}</span>
                  </div>
                )}
                {selectedComandaForPayment.deliveryFee ? (
                  <div className="flex justify-between text-stone-400">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(selectedComandaForPayment.deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-sm font-bold text-amber-400 pt-1 border-t border-stone-800">
                  <span>Total a Liquidar:</span>
                  <span className="text-lg">
                    {formatCurrency(
                      Math.max(0, selectedComandaForPayment.total - (parseFloat(discountInput) || 0))
                    )}
                  </span>
                </div>
              </div>

              {/* Discount field */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Desconto Comercial (₲)
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payment Methods selector */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO', 'VR_VA'] as PaymentMethod[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {m === 'VR_VA' ? 'VR / VA' : m}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Dinheiro / Troco calculation */}
              {paymentMethod === 'DINHEIRO' && (
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Valor Recebido do Cliente:</span>
                    <input
                      type="number"
                      step="5"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-28 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-sm text-right text-stone-100"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800">
                    <span className="text-stone-300 font-semibold">Troco a Devolver:</span>
                    <span className="font-extrabold text-sm text-emerald-400 font-mono">
                      {formatCurrency(
                        Math.max(
                          0,
                          (parseFloat(cashReceived) || 0) -
                            (selectedComandaForPayment.total - (parseFloat(discountInput) || 0))
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* PIX Simulator */}
              {paymentMethod === 'PIX' && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-10 h-10 text-stone-950" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 block">QR Code Dinâmico Pronto</span>
                    <span className="text-stone-400 text-[11px]">
                      Aguardando confirmação do banco ou realize a baixa manual ao lado.
                    </span>
                  </div>
                </div>
              )}

              {/* Partial payments list if any */}
              {paymentList.length > 0 && (
                <div className="border border-stone-800 rounded-xl p-3 bg-stone-950 text-xs space-y-1">
                  <span className="font-semibold text-stone-400 block mb-1">Pagamentos Parciais Registrados:</span>
                  {paymentList.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-stone-300">
                      <span>{getPaymentMethodLabel(p.method)}:</span>
                      <span className="font-mono text-emerald-400">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-stone-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComandaForPayment(null)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium text-xs transition"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleFinalizePayment}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Pagamento & Emitir Cupom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Receipt View */}
      {selectedComandaForReceipt && (
        <ReceiptModal
          comanda={selectedComandaForReceipt}
          settings={settings}
          onClose={() => setSelectedComandaForReceipt(null)}
        />
      )}
    </div>
  );
};
