import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { MenuItem, MenuCategory, MeatDoneness, PaymentMethod, Payment, Comanda } from '../../types';
import { formatCurrency, getMeatDonenessLabel } from '../../utils/format';
import { ReceiptModal } from '../modals/ReceiptModal';
import {
  Zap,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  CheckCircle2,
  Printer,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Flame,
  Scale,
} from 'lucide-react';

interface QuickSaleModalProps {
  onClose: () => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({ onClose }) => {
  const {
    menuItems,
    openDeliveryComanda,
    addItemsToComanda,
    payComanda,
    settings,
    currentUser,
    showToast,
  } = useChurras();

  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<
    Array<{
      item: MenuItem;
      quantity: number;
      doneness?: MeatDoneness;
      weightInKg?: number;
    }>
  >([]);

  // Payment State
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('PIX');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [continuousMode, setContinuousMode] = useState<boolean>(true);

  // Success / Receipt State
  const [lastPaidComanda, setLastPaidComanda] = useState<Comanda | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const categories: Array<{ id: MenuCategory | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'BEBIDAS', label: 'Bebidas' },
    { id: 'CHOPP_DRINKS', label: 'Chopp & Drinks' },
    { id: 'CORTES_NOBRES', label: 'Carnes & Cortes' },
    { id: 'PRATOS_A_LA_CARTE', label: 'À La Carte' },
    { id: 'ENTRADAS_GUARNACOES', label: 'Porções & Entradas' },
    { id: 'SOBREMESAS', label: 'Sobremesas' },
  ];

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.available) return false;
      const matchCat = activeCategory === 'ALL' || item.category === activeCategory;
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, activeCategory, search]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, ci) => {
      const unit = ci.weightInKg ? ci.item.price * ci.weightInKg : ci.item.price;
      return acc + unit * ci.quantity;
    }, 0);
  }, [cart]);

  const cashChange = useMemo(() => {
    if (selectedMethod !== 'DINHEIRO') return 0;
    const given = parseFloat(cashGiven.replace(',', '.')) || 0;
    return Math.max(0, given - cartTotal);
  }, [selectedMethod, cashGiven, cartTotal]);

  const handleAddToCart = (item: MenuItem) => {
    const stockAvailable = typeof item.stockQuantity === 'number' ? item.stockQuantity : 40;
    if (stockAvailable <= 0) {
      showToast(`Item "${item.name}" está esgotado!`, 'warning');
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((p) => p.item.id === item.id);
      if (idx >= 0) {
        const curQty = prev[idx].quantity;
        if (curQty + 1 > stockAvailable) {
          showToast(`Estoque máximo atingido para "${item.name}".`, 'warning');
          return prev;
        }
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          item,
          quantity: 1,
          doneness: item.allowsDoneness ? 'AO_PONTO' : undefined,
          weightInKg: item.isWeighed ? 0.45 : undefined,
        },
      ];
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const stockAvailable = typeof target.item.stockQuantity === 'number' ? target.item.stockQuantity : 40;

      const nextQty = target.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      if (nextQty > stockAvailable) {
        showToast(`Limite de estoque atingido (${stockAvailable} un).`, 'warning');
        return prev;
      }
      target.quantity = nextQty;
      return updated;
    });
  };

  const handleSetDoneness = (index: number, doneness: MeatDoneness) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], doneness };
      return updated;
    });
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      showToast('Adicione pelo menos 1 item ao pedido.', 'warning');
      return;
    }

    // 1. Create quick counter comanda (ZERO data collection required)
    const comandaId = openDeliveryComanda({
      customerName: 'Cliente Balcão',
      orderType: 'BALCAO',
      deliveryFee: 0,
    });

    // 2. Add items directly
    addItemsToComanda(
      comandaId,
      cart.map((ci) => ({
        menuItemId: ci.item.id,
        quantity: ci.quantity,
        doneness: ci.doneness,
        weightInKg: ci.weightInKg,
      }))
    );

    // 3. Immediately pay and close the sale
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      method: selectedMethod,
      amount: cartTotal,
      timestamp: new Date().toISOString(),
    };

    payComanda(comandaId, [payment], 0);

    const paidCmd: Comanda = {
      id: comandaId,
      code: `VDA-${Math.floor(1000 + Math.random() * 9000)}`,
      orderType: 'BALCAO',
      tableId: 0,
      tableLabel: 'Balcão / Venda Rápida',
      waiterId: currentUser?.id || '',
      waiterName: currentUser?.name || 'Operador',
      customerName: 'Cliente Balcão',
      peopleCount: 1,
      hasRodizio: false,
      rodizioAdultCount: 0,
      rodizioChildCount: 0,
      rodizioSeniorCount: 0,
      items: cart.map((ci, i) => ({
        id: `it-${Date.now()}-${i}`,
        menuItemId: ci.item.id,
        name: ci.item.name,
        price: ci.weightInKg ? ci.item.price * ci.weightInKg : ci.item.price,
        quantity: ci.quantity,
        doneness: ci.doneness,
        weightInKg: ci.weightInKg,
        prepStation: ci.item.prepStation || 'COZINHA',
        status: 'PRONTO',
        createdAt: new Date().toISOString(),
        tableId: 0,
        tableLabel: 'Balcão',
        comandaCode: 'BALCAO',
        waiterId: currentUser?.id || '',
        waiterName: currentUser?.name || '',
      })),
      status: 'PAGA',
      openedAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      includeService: false,
      discountAmount: 0,
      subtotal: cartTotal,
      serviceFee: 0,
      total: cartTotal,
      payments: [payment],
    };

    setLastPaidComanda(paidCmd);
    showToast(`Venda de ${formatCurrency(cartTotal)} concluída no ${selectedMethod}!`, 'success');

    // Reset for next sale in continuous flow
    setCart([]);
    setCashGiven('');

    if (!continuousMode) {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 overflow-hidden backdrop-blur-sm">
        <div className="bg-[#0B0F19] border border-amber-500/30 rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header: Fast Sale Title & Mode Toggle */}
          <div className="px-5 py-3.5 bg-[#0E1526] border-b border-[#1E2638] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    Venda Rápida & Pedido Direto
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Fluxo Contínuo Ativo
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Toque nos produtos, selecione a forma de pagamento e finalize em 1 clique.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131A2D] border border-[#1E2638] text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => setContinuousMode(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="font-medium">Modo Contínuo (Pronto para o próximo)</span>
              </label>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-[#1E2638] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader: Search & Quick Categories */}
          <div className="px-5 py-2.5 bg-[#0E1526]/80 border-b border-[#1E2638] flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar produto ou bebida..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#131A2D] border border-[#1E2638] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 text-xs scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-[#131A2D] text-stone-400 hover:text-white hover:bg-[#1E2638]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Body: 2 Columns (Products Grid on Left, Live Cart & Checkout on Right) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            {/* Products Grid (7 cols) */}
            <div className="lg:col-span-7 p-4 overflow-y-auto space-y-3 bg-[#080B12]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredItems.map((item) => {
                  const stockQty = typeof item.stockQuantity === 'number' ? item.stockQuantity : 40;
                  const isOutOfStock = stockQty <= 0;
                  const inCartItem = cart.find((c) => c.item.id === item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(item)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between relative group cursor-pointer active:scale-95 ${
                        isOutOfStock
                          ? 'bg-[#0E1526]/40 border-[#1E2638] opacity-40 cursor-not-allowed'
                          : inCartItem
                          ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/50'
                          : 'bg-[#0E1526] border-[#1E2638] hover:border-amber-500/50 hover:bg-[#131A2D]'
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center shadow-md">
                          {inCartItem.quantity}
                        </span>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {item.name}
                          </h4>
                        </div>
                        <div className="font-mono font-extrabold text-xs text-amber-400 mt-1">
                          {formatCurrency(item.price)}
                          {item.isWeighed && <span className="text-[10px] text-stone-400">/kg</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#1E2638] text-[10px]">
                        <span className="text-stone-400 font-medium truncate">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                          + Adicionar
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cart & Checkout Panel (5 cols) */}
            <div className="lg:col-span-5 bg-[#0D1322] border-t lg:border-t-0 lg:border-l border-[#1E2638] flex flex-col justify-between overflow-hidden">
              
              {/* Cart Items Header */}
              <div className="p-3.5 bg-[#0E1526] border-b border-[#1E2638] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Itens da Venda ({cart.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-stone-400 hover:text-red-400 transition cursor-pointer"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-stone-500 space-y-2">
                    <ShoppingBag className="w-10 h-10 text-stone-700" />
                    <p className="text-xs font-semibold text-stone-400">Nenhum item selecionado</p>
                    <p className="text-[11px] text-stone-500 max-w-xs">
                      Clique nos produtos à esquerda para adicionar instantaneamente.
                    </p>
                  </div>
                ) : (
                  cart.map((ci, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#131A2D] border border-[#1E2638] text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-bold text-white pr-2">
                          {ci.item.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -ci.quantity)}
                          className="text-stone-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Meat Doneness Quick Chips */}
                      {ci.item.allowsDoneness && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" /> Ponto:
                          </span>
                          {(['MAL_PASSADO', 'AO_PONTO', 'BEM_PASSADO'] as MeatDoneness[]).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleSetDoneness(idx, d)}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border transition cursor-pointer ${
                                ci.doneness === d
                                  ? 'bg-amber-600 text-white border-amber-500'
                                  : 'bg-[#0E1526] text-stone-400 border-[#1E2638] hover:text-white'
                              }`}
                            >
                              {d === 'MAL_PASSADO' ? 'Mal' : d === 'AO_PONTO' ? 'Ponto' : 'Bem'}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1E2638]/60">
                        <div className="flex items-center gap-1.5 bg-[#0E1526] p-1 rounded-xl border border-[#1E2638]">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-[#131A2D] text-stone-200 hover:bg-stone-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-white px-2">
                            {ci.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-[#131A2D] text-stone-200 hover:bg-stone-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="font-mono font-bold text-amber-400 text-sm">
                          {formatCurrency(
                            (ci.weightInKg ? ci.item.price * ci.weightInKg : ci.item.price) * ci.quantity
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Instant Payment Selector & Finish Section */}
              <div className="p-4 bg-[#0E1526] border-t border-[#1E2638] space-y-3">
                
                {/* Total Row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 uppercase">Total a Pagar:</span>
                  <span className="text-xl font-black font-mono text-amber-400">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                {/* 1-Touch Payment Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'PIX', label: 'PIX', icon: QrCode, color: 'text-teal-400' },
                      { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign, color: 'text-emerald-400' },
                      { id: 'DEBITO', label: 'Débito', icon: CreditCard, color: 'text-blue-400' },
                      { id: 'CREDITO', label: 'Crédito', icon: CreditCard, color: 'text-purple-400' },
                    ] as const
                  ).map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 border-amber-500 text-white shadow-md ring-1 ring-amber-400'
                            : 'bg-[#131A2D] border-[#1E2638] text-stone-400 hover:text-white hover:bg-[#1E2638]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : m.color}`} />
                        <span className="text-[10px] font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* If Cash: Quick change helpers */}
                {selectedMethod === 'DINHEIRO' && (
                  <div className="bg-[#131A2D] p-2.5 rounded-xl border border-[#1E2638] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 text-[11px]">Valor Recebido:</span>
                      <input
                        type="text"
                        placeholder="Ex: 50.00"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        className="w-24 bg-[#0E1526] border border-[#1E2638] rounded-lg px-2 py-0.5 text-right font-mono font-bold text-white text-xs"
                      />
                    </div>
                    {cashChange > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-1 border-t border-[#1E2638]">
                        <span>Troco a Devolver:</span>
                        <span className="font-mono">{formatCurrency(cashChange)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Action Button: 1-Click Conclude Sale */}
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleFinalizeSale}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>
                    Concluir Venda ({formatCurrency(cartTotal)}) {continuousMode ? '⚡ Próximo' : ''}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Receipt Modal on finish */}
      {showReceiptModal && lastPaidComanda && (
        <ReceiptModal
          comanda={lastPaidComanda}
          settings={settings}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </>
  );
};
