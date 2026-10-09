import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { Comanda, PaymentMethod, PaymentTransaction } from '../../types';
import { formatCurrency, formatTime, getPaymentMethodLabel } from '../../utils/format';
import { ReceiptModal } from '../modals/ReceiptModal';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  CreditCard,
  QrCode,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Users,
  Percent,
  X,
  History,
} from 'lucide-react';

export const CashierDashboard: React.FC = () => {
  const {
    currentUser,
    cashSession,
    openCashSession,
    closeCashSession,
    addCashMovement,
    comandas,
    processPayment,
    cancelComanda,
    settings,
  } = useChurras();

  if (!currentUser) return null;

  // Selected comanda for checkout
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);

  // Checkout modal form state
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [includeService, setIncludeService] = useState<boolean>(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('PIX');
  const [amountToAdd, setAmountToAdd] = useState<string>('');
  const [cashGivenAmount, setCashGivenAmount] = useState<string>('');
  const [paymentsList, setPaymentsList] = useState<PaymentTransaction[]>([]);

  // Receipt Modal state
  const [receiptComanda, setReceiptComanda] = useState<Comanda | null>(null);

  // Cash Session Modals
  const [showOpenSessionModal, setShowOpenSessionModal] = useState<boolean>(false);
  const [initialCashInput, setInitialCashInput] = useState<string>('300.00');

  const [showCloseSessionModal, setShowCloseSessionModal] = useState<boolean>(false);
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [closingNotesInput, setClosingNotesInput] = useState<string>('');

  const [showMovementModal, setShowMovementModal] = useState<'SANGRIA' | 'SUPRIMENTO' | null>(null);
  const [movementAmountInput, setMovementAmountInput] = useState<string>('');
  const [movementDescriptionInput, setMovementDescriptionInput] = useState<string>('');

  // Active comanda lookup
  const selectedComanda = comandas.find((c) => c.id === selectedComandaId);

  // Calculate live session totals by method
  const sessionSales = cashSession.movements.filter((m) => m.type === 'VENDA');

  const totalSalesAmount = sessionSales.reduce((acc, m) => acc + m.amount, 0);

  const totalPix = sessionSales
    .filter((m) => m.paymentMethod === 'PIX')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalCards = sessionSales
    .filter((m) => m.paymentMethod === 'CREDITO' || m.paymentMethod === 'DEBITO')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalVr = sessionSales
    .filter((m) => m.paymentMethod === 'VR_VA')
    .reduce((acc, m) => acc + m.amount, 0);

  // Cash in drawer includes Initial + Cash Sales + Suprimentos - Sangrias
  const currentCashInDrawer = cashSession.movements.reduce((acc, m) => {
    if (m.paymentMethod === 'DINHEIRO') {
      if (m.type === 'VENDA' || m.type === 'SUPRIMENTO') return acc + m.amount;
      if (m.type === 'SANGRIA' || m.type === 'ESTORNO') return acc - m.amount;
    }
    return acc;
  }, 0);

  // Grouped comandas
  const billRequestedComandas = comandas.filter((c) => c.status === 'CONTA_SOLICITADA');
  const openComandas = comandas.filter((c) => c.status === 'ABERTA');
  const paidTodayComandas = comandas.filter((c) => c.status === 'PAGA');

  // Calculation helpers for selected comanda
  const subtotal = selectedComanda?.subtotal || 0;
  const deliveryFee = selectedComanda?.deliveryFee || 0;
  const serviceFee = includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
  const totalDue = Math.max(0, subtotal + serviceFee + deliveryFee - discountValue);

  const totalPaidSoFar = paymentsList.reduce((acc, p) => acc + p.amount, 0);
  const remainingDue = Math.max(0, totalDue - totalPaidSoFar);

  // Handlers
  const handleSelectComandaForCheckout = (cmd: Comanda) => {
    setSelectedComandaId(cmd.id);
    setDiscountValue(cmd.discountAmount || 0);
    setIncludeService(cmd.includeService);
    setPaymentsList([]);
    const pendingDue =
      cmd.subtotal +
      (cmd.includeService ? cmd.subtotal * (settings.serviceTaxPercentage / 100) : 0) +
      (cmd.deliveryFee || 0) -
      (cmd.discountAmount || 0);
    setAmountToAdd(pendingDue.toFixed(2));
    setCashGivenAmount('');
  };

  const handleAddPayment = () => {
    const amt = parseFloat(amountToAdd);
    if (!amt || amt <= 0) return;

    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      method: selectedMethod,
      amount: amt,
      paidAt: new Date().toISOString(),
      changeAmount:
        selectedMethod === 'DINHEIRO' && parseFloat(cashGivenAmount) > amt
          ? parseFloat(cashGivenAmount) - amt
          : undefined,
    };

    const nextList = [...paymentsList, newPayment];
    setPaymentsList(nextList);

    // Auto update remaining
    const nextTotalPaid = nextList.reduce((acc, p) => acc + p.amount, 0);
    const nextRemaining = Math.max(0, totalDue - nextTotalPaid);
    setAmountToAdd(nextRemaining > 0 ? nextRemaining.toFixed(2) : '');
    setCashGivenAmount('');
  };

  const handleConfirmCheckout = () => {
    if (!selectedComanda) return;
    if (totalPaidSoFar < totalDue - 0.05) return;

    processPayment(selectedComanda.id, paymentsList, discountValue, includeService);

    // Show receipt
    const updated = {
      ...selectedComanda,
      status: 'PAGA' as const,
      payments: paymentsList,
      discountAmount: discountValue,
      includeService,
      serviceFee,
      total: totalDue,
      closedAt: new Date().toISOString(),
    };
    setReceiptComanda(updated);
    setSelectedComandaId(null);
    setPaymentsList([]);
  };

  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(initialCashInput) || 0;
    openCashSession(currentUser.id, val);
    setShowOpenSessionModal(false);
  };

  const handleCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(countedCashInput) || 0;
    closeCashSession(val, closingNotesInput);
    setShowCloseSessionModal(false);
    setCountedCashInput('');
    setClosingNotesInput('');
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovementModal) return;
    const val = parseFloat(movementAmountInput) || 0;
    if (val <= 0) return;

    addCashMovement(showMovementModal, val, movementDescriptionInput.trim() || showMovementModal);
    setShowMovementModal(null);
    setMovementAmountInput('');
    setMovementDescriptionInput('');
  };

  return (
    <div className="space-y-6">
      {/* Cashier Status Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                cashSession.status === 'ABERTO'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-red-600/20 text-red-400 border border-red-500/40'
              }`}
            >
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                  Frente de Caixa & PDV
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    cashSession.status === 'ABERTO'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                      : 'bg-red-950/80 text-red-400 border-red-800/60'
                  }`}
                >
                  {cashSession.status === 'ABERTO' ? 'Caixa Aberto' : 'Caixa Fechado'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Operador: <strong className="text-white">{cashSession.operatorName}</strong> · Aberto às{' '}
                {formatTime(cashSession.openedAt)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {cashSession.status === 'ABERTO' ? (
              <>
                <button
                  onClick={() => setShowMovementModal('SANGRIA')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-700/80 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sangria (Retirada)</span>
                </button>

                <button
                  onClick={() => setShowMovementModal('SUPRIMENTO')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-700/80 transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Suprimento (Troco)</span>
                </button>

                <button
                  onClick={() => setShowCloseSessionModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-md shadow-red-950/40"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Fechar Caixa</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowOpenSessionModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-950/40"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Novo Caixa</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial Flow summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3.5 border-t border-stone-800">
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Gaveta (Dinheiro)</div>
            <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">
              {formatCurrency(currentCashInDrawer)}
            </div>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-bold uppercase">PIX Recebido</div>
            <div className="text-sm font-extrabold text-teal-400 font-mono mt-0.5">
              {formatCurrency(totalPix)}
            </div>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Cartões (C/D)</div>
            <div className="text-sm font-extrabold text-blue-400 font-mono mt-0.5">
              {formatCurrency(totalCards)}
            </div>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-bold uppercase">VR / VA</div>
            <div className="text-sm font-extrabold text-purple-400 font-mono mt-0.5">
              {formatCurrency(totalVr)}
            </div>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Vendas Turno</div>
            <div className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">
              {formatCurrency(totalSalesAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Comandas List on Left, Checkout POS on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Comandas by Priority (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Priority 1: Conta Solicitada (Calling for Bill) */}
          {billRequestedComandas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  Conta Solicitada ({billRequestedComandas.length})
                </span>
                <span className="text-[11px] text-stone-400">Pronto para fechar</span>
              </div>

              <div className="space-y-2">
                {billRequestedComandas.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelectComandaForCheckout(cmd)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedComandaId === cmd.id
                        ? 'bg-amber-600/20 border-amber-500 ring-1 ring-amber-500 text-white'
                        : 'bg-yellow-950/30 border-yellow-700/60 hover:bg-yellow-950/50 text-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{cmd.tableLabel}</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-stone-950 px-1.5 py-0.5 rounded">
                          {cmd.code}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {cmd.customerName || 'Cliente'} · Garçom: {cmd.waiterName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-amber-400 font-mono">
                        {formatCurrency(cmd.total)}
                      </div>
                      <div className="text-[10px] text-stone-400">{cmd.items.length} itens</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority 2: Other Open Comandas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                Mesas Abertas em Atendimento ({openComandas.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {openComandas.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-500 bg-stone-900 rounded-xl border border-stone-800">
                  Nenhuma outra mesa aberta.
                </div>
              ) : (
                openComandas.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelectComandaForCheckout(cmd)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedComandaId === cmd.id
                        ? 'bg-amber-600/20 border-amber-500 ring-1 ring-amber-500 text-white'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700 text-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{cmd.tableLabel}</span>
                        <span className="text-[10px] font-mono text-stone-400">{cmd.code}</span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {cmd.customerName || 'Cliente'} ({cmd.peopleCount} pax)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-stone-200 font-mono">
                        {formatCurrency(cmd.total)}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {formatTime(cmd.openedAt)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Closed / Paid Today List */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Comandas Pagas Hoje ({paidTodayComandas.length})
            </span>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {paidTodayComandas.map((cmd) => (
                <div
                  key={cmd.id}
                  className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between text-stone-300"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{cmd.tableLabel}</span>
                      <span className="text-[10px] font-mono text-stone-400">({cmd.code})</span>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Fechada às {formatTime(cmd.closedAt)} por {cmd.waiterName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(cmd.total)}
                    </span>
                    <button
                      onClick={() => setReceiptComanda(cmd)}
                      title="Ver Recibo"
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout POS Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          {selectedComanda ? (
            <div className="space-y-4">
              
              {/* Checkout Header */}
              <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      Recebimento · {selectedComanda.tableLabel}
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {selectedComanda.code}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Cliente: <strong className="text-stone-200">{selectedComanda.customerName}</strong> ·{' '}
                    Garçom: <strong className="text-stone-200">{selectedComanda.waiterName}</strong> ·{' '}
                    {selectedComanda.peopleCount} pessoas
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setReceiptComanda(selectedComanda)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-500" />
                    <span>Prévia Recibo</span>
                  </button>
                  <button
                    onClick={() => setSelectedComandaId(null)}
                    className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bill Details & Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <div>
                  <span className="text-stone-400">Subtotal dos Itens:</span>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {formatCurrency(subtotal)}
                  </div>
                </div>

                {/* Service tax 10% toggle */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Taxa de Serviço ({settings.serviceTaxPercentage}%):</span>
                    <input
                      type="checkbox"
                      checked={includeService}
                      onChange={(e) => setIncludeService(e.target.checked)}
                      className="accent-amber-600 rounded"
                    />
                  </div>
                  <div className="text-sm font-bold text-stone-300 font-mono mt-0.5">
                    {includeService ? `+ ${formatCurrency(serviceFee)}` : 'Isento (R$ 0,00)'}
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <span className="text-stone-400">Desconto Concedido:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-stone-500">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Total Banner with Per Person Split */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-amber-600/30 flex items-center justify-between">
                <div>
                  <div className="text-xs text-stone-400 font-medium">TOTAL DA CONTA:</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {formatCurrency(totalDue)}
                  </div>
                </div>

                {selectedComanda.peopleCount > 1 && (
                  <div className="text-right">
                    <div className="text-xs text-stone-400">
                      Rateio ({selectedComanda.peopleCount} pax):
                    </div>
                    <div className="text-base font-bold text-stone-200 font-mono">
                      {formatCurrency(totalDue / selectedComanda.peopleCount)} / pessoa
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Entry Form */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  Lançar Pagamento (Permite Múltiplas Formas)
                </div>

                {/* Method selector buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  {(
                    [
                      { id: 'PIX', label: 'PIX', icon: QrCode },
                      { id: 'CREDITO', label: 'Crédito', icon: CreditCard },
                      { id: 'DEBITO', label: 'Débito', icon: CreditCard },
                      { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign },
                      { id: 'VR_VA', label: 'VR/VA', icon: Percent },
                    ] as Array<{ id: PaymentMethod; label: string; icon: React.ElementType }>
                  ).map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-semibold transition-all ${
                          selectedMethod === m.id
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-850 border border-stone-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Amount inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Valor deste Pagamento (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountToAdd}
                      onChange={(e) => setAmountToAdd(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {selectedMethod === 'DINHEIRO' ? (
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        Valor Entregue pelo Cliente (Troco):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={cashGivenAmount}
                        onChange={(e) => setCashGivenAmount(e.target.value)}
                        placeholder="Ex: 100.00"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                      {parseFloat(cashGivenAmount) > parseFloat(amountToAdd || '0') && (
                        <div className="text-[11px] text-emerald-400 font-bold mt-1">
                          Troco: {formatCurrency(parseFloat(cashGivenAmount) - parseFloat(amountToAdd || '0'))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddPayment}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-98"
                      >
                        + Adicionar Parcela {getPaymentMethodLabel(selectedMethod)}
                      </button>
                    </div>
                  )}
                </div>

                {selectedMethod === 'DINHEIRO' && (
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-98"
                  >
                    + Registrar Pagamento em Dinheiro
                  </button>
                )}
              </div>

              {/* Payments Registered List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                  <span>Pagamentos Efetuados:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    Recebido: {formatCurrency(totalPaidSoFar)} / Restante: {formatCurrency(remainingDue)}
                  </span>
                </div>

                {paymentsList.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{getPaymentMethodLabel(p.method)}</span>
                      {p.changeAmount && p.changeAmount > 0 && (
                        <span className="text-[10px] text-emerald-400">
                          (Troco: {formatCurrency(p.changeAmount)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-200">
                        {formatCurrency(p.amount)}
                      </span>
                      <button
                        onClick={() => setPaymentsList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-stone-500 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Confirm Button */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => cancelComanda(selectedComanda.id)}
                  className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-red-400 text-xs font-semibold transition-colors"
                >
                  Cancelar Comanda
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCheckout}
                  disabled={remainingDue > 0.05 || paymentsList.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 disabled:text-stone-600 text-white text-xs font-bold transition-all shadow-lg active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {remainingDue <= 0.05 && paymentsList.length > 0
                      ? 'Confirmar Pagamento e Liberar Mesa'
                      : `Aguardando Pagamento Restante (${formatCurrency(remainingDue)})`}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center text-stone-500 space-y-3">
              <Wallet className="w-12 h-12 text-stone-700" />
              <div>
                <p className="text-sm font-semibold text-stone-300">Nenhuma mesa em pagamento</p>
                <p className="text-xs text-stone-500 max-w-sm mt-1">
                  Selecione uma comanda com "Conta Solicitada" ou em atendimento na coluna à esquerda
                  para iniciar o recebimento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Open Cash Session */}
      {showOpenSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-400" />
              Abertura de Caixa
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Operador responsável: <strong className="text-stone-200">{currentUser.name}</strong>
            </p>

            <form onSubmit={handleOpenCash} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Fundo de Troco Inicial em Dinheiro (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenSessionModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Cash Session with Blind Count */}
      {showCloseSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              Fechamento de Caixa (Conferência Cega)
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Contagem física do dinheiro em gaveta para auditoria e conciliação.
            </p>

            <form onSubmit={handleCloseCash} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Valor em Dinheiro Contado na Gaveta (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Esperado pelo sistema: {formatCurrency(currentCashInDrawer)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Observações de Fechamento (opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Tudo correto, troco conferido perfeitamente..."
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseSessionModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg"
                >
                  Concluir Fechamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sangria / Suprimento */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              {showMovementModal === 'SANGRIA' ? (
                <>
                  <ArrowUpRight className="w-5 h-5 text-amber-500" />
                  Lançar Sangria (Retirada de Dinheiro)
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                  Lançar Suprimento (Adicionar Troco)
                </>
              )}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              {showMovementModal === 'SANGRIA'
                ? 'Retirada de valores em dinheiro para cofre ou pagamento de fornecedor.'
                : 'Entrada adicional de moedas e cédulas para reforçar o troco da gaveta.'}
            </p>

            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Valor (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={movementAmountInput}
                  onChange={(e) => setMovementAmountInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Motivo / Justificativa:
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    showMovementModal === 'SANGRIA'
                      ? 'Ex: Envio ao cofre central'
                      : 'Ex: Troco de moedas de 1 real'
                  }
                  value={movementDescriptionInput}
                  onChange={(e) => setMovementDescriptionInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg ${
                    showMovementModal === 'SANGRIA'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  Confirmar {showMovementModal === 'SANGRIA' ? 'Sangria' : 'Suprimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal for inspection / print */}
      {receiptComanda && (
        <ReceiptModal
          comanda={receiptComanda}
          settings={settings}
          onClose={() => setReceiptComanda(null)}
        />
      )}
    </div>
  );
};
