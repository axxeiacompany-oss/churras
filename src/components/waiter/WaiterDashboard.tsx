import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { Table, MeatDoneness, MenuItem, MenuCategory, Comanda, TableStatus, PaymentMethod, Payment } from '../../types';
import { formatCurrency, formatTime, getMeatDonenessLabel } from '../../utils/format';
import { TableOperationsModal } from './TableOperationsModal';
import { ReserveTableModal } from './ReserveTableModal';
import { DeliveryModal } from './DeliveryModal';
import { QuickSaleModal } from '../pos/QuickSaleModal';
import { ReceiptModal } from '../modals/ReceiptModal';
import {
  UtensilsCrossed,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  Trash2,
  X,
  CreditCard,
  Search,
  Scale,
  Bike,
  Split,
  Layers,
  Calendar,
  Percent,
  Check,
  Phone,
  MapPin,
  AlertCircle,
  Users,
  Edit2,
  Zap,
  QrCode,
  DollarSign,
} from 'lucide-react';

export const WaiterDashboard: React.FC = () => {
  const {
    currentUser,
    employees,
    tables,
    comandas,
    menuItems,
    openComanda,
    addItemsToComanda,
    payComanda,
    requestBill,
    toggleServiceFee,
    settings,
    addTable,
    updateTable,
    deleteTable,
    showToast,
  } = useChurras();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  // Admin Table CRUD State inside Salão
  const [showAddTableModal, setShowAddTableModal] = useState<boolean>(false);
  const [newTableLabel, setNewTableLabel] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editTableLabel, setEditTableLabel] = useState<string>('');
  const [editTableCapacity, setEditTableCapacity] = useState<number>(4);

  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // Quick Sale & Fast Table Checkout state
  const [showQuickSaleModal, setShowQuickSaleModal] = useState<boolean>(false);
  const [showQuickPayModal, setShowQuickPayModal] = useState<boolean>(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethod>('PIX');
  const [lastPaidComanda, setLastPaidComanda] = useState<Comanda | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Table status filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MINE' | 'LIVRE' | 'OCUPADA' | 'CONTA_SOLICITADA' | 'RESERVADA' | 'DELIVERY'>('ALL');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedDeliveryComanda, setSelectedDeliveryComanda] = useState<Comanda | null>(null);

  // Modals state
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [targetTableForOpen, setTargetTableForOpen] = useState<Table | null>(null);

  const [showReserveModal, setShowReserveModal] = useState<boolean>(false);
  const [targetTableForReserve, setTargetTableForReserve] = useState<Table | null>(null);

  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);

  const [showOperationsModal, setShowOperationsModal] = useState<boolean>(false);

  // Open Comanda Form State
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newPeopleCount, setNewPeopleCount] = useState<number>(2);
  const [newWaiterId, setNewWaiterId] = useState<string>(currentUser.id);
  const [newHasRodizio, setNewHasRodizio] = useState<boolean>(true);
  const [newRodizioAdultCount, setNewRodizioAdultCount] = useState<number>(2);
  const [newRodizioChildCount, setNewRodizioChildCount] = useState<number>(0);
  const [newRodizioSeniorCount, setNewRodizioSeniorCount] = useState<number>(0);

  // Order Launcher State
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'ALL'>('ALL');
  const [searchMenu, setSearchMenu] = useState<string>('');
  const [cartItems, setCartItems] = useState<
    Array<{
      menuItemId: string;
      item: MenuItem;
      quantity: number;
      doneness?: MeatDoneness;
      notes?: string;
      weightInKg?: number;
    }>
  >([]);

  // Item Customizer Submodal State (for doneness, weight and custom notes)
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customDoneness, setCustomDoneness] = useState<MeatDoneness>('AO_PONTO');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customWeight, setCustomWeight] = useState<string>('0.450');

  // Compute Waiter KPIs
  const myComandas = comandas.filter(
    (c) => c.waiterId === currentUser.id && c.status !== 'CANCELADA'
  );
  const myTotalSales = myComandas.reduce((acc, c) => acc + c.total, 0);
  const myCommission = myTotalSales * ((currentUser.commissionRate || 10) / 100);
  const myActiveTablesCount = tables.filter(
    (t) => t.assignedWaiterId === currentUser.id && t.status !== 'LIVRE'
  ).length;

  const freeCount = tables.filter((t) => t.status === 'LIVRE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCUPADA').length;
  const billRequestedCount = tables.filter((t) => t.status === 'CONTA_SOLICITADA').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVADA').length;
  const deliveryComandas = comandas.filter(
    (c) => (c.orderType === 'DELIVERY' || c.orderType === 'RETIRADA') && c.status !== 'PAGA' && c.status !== 'CANCELADA'
  );

  // Filtered tables list
  const displayedTables = tables.filter((t) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'MINE') return t.assignedWaiterId === currentUser.id;
    if (statusFilter === 'DELIVERY') return false;
    return t.status === statusFilter;
  });

  // Current active comanda for the drawer
  const activeComanda = selectedDeliveryComanda || (selectedTable?.currentComandaId
    ? comandas.find((c) => c.id === selectedTable.currentComandaId)
    : null);

  // 1-Click Instant Open & Order
  const handleQuickOpenAndOrder = (table: Table) => {
    const newCmdId = openComanda(table.id, currentUser.id, {
      customerName: table.label,
      peopleCount: table.capacity || 2,
      hasRodizio: false,
      rodizioAdultCount: 0,
      rodizioChildCount: 0,
      rodizioSeniorCount: 0,
    });

    setSelectedDeliveryComanda(null);
    setSelectedTable({
      ...table,
      status: 'OCUPADA',
      currentComandaId: newCmdId,
      customerName: table.label,
      peopleCount: table.capacity || 2,
      assignedWaiterId: currentUser.id,
    });
    setCartItems([]);
    setShowOrderModal(true);
  };

  // Open comanda submit handler
  const handleOpenTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTableForOpen) return;

    const newCmdId = openComanda(targetTableForOpen.id, newWaiterId || currentUser.id, {
      customerName: newCustomerName.trim() || targetTableForOpen.label,
      peopleCount: newPeopleCount,
      hasRodizio: newHasRodizio,
      rodizioAdultCount: newHasRodizio ? newRodizioAdultCount : 0,
      rodizioChildCount: newHasRodizio ? newRodizioChildCount : 0,
      rodizioSeniorCount: newHasRodizio ? newRodizioSeniorCount : 0,
    });

    setSelectedDeliveryComanda(null);
    setSelectedTable({
      ...targetTableForOpen,
      status: 'OCUPADA',
      currentComandaId: newCmdId,
      customerName: newCustomerName.trim() || targetTableForOpen.label,
      peopleCount: newPeopleCount,
      assignedWaiterId: newWaiterId || currentUser.id,
    });

    setShowOpenModal(false);
    setTargetTableForOpen(null);
    setNewCustomerName('');
    setNewPeopleCount(2);
    setNewHasRodizio(false);
    setNewRodizioAdultCount(0);
    setNewRodizioChildCount(0);
    setNewRodizioSeniorCount(0);
    setCartItems([]);
    setShowOrderModal(true);
  };

  // Instant pay active table comanda
  const handlePayActiveTable = (method: PaymentMethod) => {
    if (!activeComanda) return;
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      method,
      amount: activeComanda.total,
      timestamp: new Date().toISOString(),
    };
    payComanda(activeComanda.id, [payment], 0);
    setLastPaidComanda({
      ...activeComanda,
      status: 'PAGA',
      payments: [...activeComanda.payments, payment],
      closedAt: new Date().toISOString(),
    });
    showToast(`Mesa ${activeComanda.tableLabel} fechada e paga (${formatCurrency(activeComanda.total)}) no ${method}!`, 'success');
    setShowQuickPayModal(false);
    setShowOrderModal(false);
    setSelectedTable(null);
    setSelectedDeliveryComanda(null);
  };

  // Add item to cart directly with zero blocking dialogs
  const handleAddToCart = (item: MenuItem) => {
    const stockAvailable = typeof item.stockQuantity === 'number' ? item.stockQuantity : 40;
    if (stockAvailable <= 0) {
      showToast(`O produto "${item.name}" está esgotado! Não é possível lançar para venda.`, 'error');
      return;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.menuItemId === item.id && !p.notes
      );
      if (existingIdx >= 0) {
        const currentQtyInCart = prev[existingIdx].quantity;
        if (currentQtyInCart + 1 > stockAvailable) {
          showToast(`Estoque máximo atingido para "${item.name}" (${stockAvailable} un disponíveis).`, 'warning');
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          item,
          quantity: 1,
          doneness: item.allowsDoneness ? 'AO_PONTO' : undefined,
          weightInKg: item.isWeighed ? 0.45 : undefined,
        },
      ];
    });
  };

  const handleConfirmCustomItem = () => {
    if (!customizingItem) return;
    const stockAvailable = typeof customizingItem.stockQuantity === 'number' ? customizingItem.stockQuantity : 40;
    if (customQty > stockAvailable) {
      showToast(`Quantidade solicitada (${customQty}) maior que o estoque disponível (${stockAvailable} un).`, 'error');
      return;
    }
    const weightNum = customizingItem.isWeighed ? parseFloat(customWeight) || 0.450 : undefined;

    setCartItems((prev) => [
      ...prev,
      {
        menuItemId: customizingItem.id,
        item: customizingItem,
        quantity: customQty,
        doneness: customizingItem.allowsDoneness ? customDoneness : undefined,
        notes: customNotes.trim() || undefined,
        weightInKg: weightNum,
      },
    ]);
    setCustomizingItem(null);
  };

  const handleSendOrder = () => {
    if (!activeComanda || cartItems.length === 0) return;

    addItemsToComanda(
      activeComanda.id,
      cartItems.map((ci) => ({
        menuItemId: ci.menuItemId,
        quantity: ci.quantity,
        doneness: ci.doneness,
        notes: ci.notes,
        weightInKg: ci.weightInKg,
      }))
    );

    setCartItems([]);
    setShowOrderModal(false);
  };

  const categoriesList: Array<{ id: MenuCategory | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'RODIZIO', label: 'Rodízio' },
    { id: 'CORTES_NOBRES', label: 'Cortes Nobres' },
    { id: 'PRATOS_A_LA_CARTE', label: 'À La Carte' },
    { id: 'POR_QUILO', label: 'Por Quilo (Peso)' },
    { id: 'ENTRADAS_GUARNACOES', label: 'Guarnições & Entradas' },
    { id: 'ADICIONAIS', label: 'Adicionais & Molhos' },
    { id: 'CHOPP_DRINKS', label: 'Chopp & Drinks' },
    { id: 'BEBIDAS', label: 'Bebidas Sem Álcool' },
    { id: 'SOBREMESAS', label: 'Sobremesas' },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.available) return false;
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
      item.description.toLowerCase().includes(searchMenu.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Waiter KPI Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 to-stone-900 border-2 border-amber-500/50 text-amber-300 font-bold text-sm flex items-center justify-center shadow-md tracking-wider">
              {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                  {currentUser.name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                  Garçom de Salão
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Turno: <strong className="text-stone-300">{currentUser.shift}</strong> · Comissão:{' '}
                <strong className="text-stone-300">{currentUser.commissionRate || 10}%</strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="grid grid-cols-3 gap-2.5 flex-1 sm:flex-initial">
              <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] font-bold text-stone-400 uppercase">Minhas Mesas</div>
                <div className="text-base font-extrabold text-white font-mono">{myActiveTablesCount}</div>
              </div>
              <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] font-bold text-stone-400 uppercase">Vendas Hoje</div>
                <div className="text-base font-extrabold text-amber-400 font-mono">{formatCurrency(myTotalSales)}</div>
              </div>
              <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] font-bold text-stone-400 uppercase">Comissão</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">{formatCurrency(myCommission)}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickSaleModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-950/40 active:scale-98 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>⚡ Venda Rápida (Fluxo Contínuo)</span>
            </button>

            <button
              onClick={() => setShowDeliveryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <Bike className="w-4 h-4 text-amber-400" />
              <span>Delivery</span>
            </button>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="mt-4 pt-3.5 border-t border-stone-800 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              Todas as Mesas ({tables.length})
            </button>
            <button
              onClick={() => setStatusFilter('MINE')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'MINE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              Minhas Mesas ({myActiveTablesCount})
            </button>
            <button
              onClick={() => setStatusFilter('LIVRE')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'LIVRE'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-stone-800 text-emerald-400 hover:bg-stone-700'
              }`}
            >
              Livres ({freeCount})
            </button>
            <button
              onClick={() => setStatusFilter('OCUPADA')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'OCUPADA'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-stone-800 text-amber-400 hover:bg-stone-700'
              }`}
            >
              Ocupadas ({occupiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('CONTA_SOLICITADA')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'CONTA_SOLICITADA'
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : 'bg-stone-800 text-yellow-400 hover:bg-stone-700'
              }`}
            >
              Aguardando Conta ({billRequestedCount})
            </button>
            <button
              onClick={() => setStatusFilter('RESERVADA')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'RESERVADA'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-stone-800 text-purple-400 hover:bg-stone-700'
              }`}
            >
              Reservadas ({reservedCount})
            </button>
            <button
              onClick={() => setStatusFilter('DELIVERY')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all ${
                statusFilter === 'DELIVERY'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-stone-800 text-teal-400 hover:bg-stone-700'
              }`}
            >
              Delivery & Balcão ({deliveryComandas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Table Map or Delivery List on Left + Selected Item on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tables or Delivery List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                {statusFilter === 'DELIVERY' ? 'Pedidos Externos (Delivery & Retirada)' : 'Mapa do Salão'}
              </h3>
              <span className="text-xs text-stone-400">
                {statusFilter === 'DELIVERY'
                  ? `${deliveryComandas.length} pedidos em andamento`
                  : `${freeCount} livres · ${occupiedCount} ocupadas · ${reservedCount} reservadas`}
              </span>
            </div>

            {isAdmin && statusFilter !== 'DELIVERY' && (
              <button
                type="button"
                onClick={() => {
                  setNewTableLabel(`Mesa ${tables.length + 1}`);
                  setNewTableCapacity(4);
                  setShowAddTableModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nova Mesa (Admin)</span>
              </button>
            )}
          </div>

          {/* If Delivery Filter is Active */}
          {statusFilter === 'DELIVERY' ? (
            <div className="space-y-3">
              {deliveryComandas.length === 0 ? (
                <div className="p-8 text-center bg-stone-900 border border-dashed border-stone-800 rounded-2xl text-xs text-stone-500">
                  Nenhum pedido de delivery ou retirada em andamento. Clique em "+ Delivery / Balcão" acima.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deliveryComandas.map((cmd) => {
                    const isSelected = selectedDeliveryComanda?.id === cmd.id;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          setSelectedTable(null);
                          setSelectedDeliveryComanda(cmd);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'ring-2 ring-amber-500 bg-stone-800 border-amber-500'
                            : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">{cmd.customerName}</span>
                              <span className="text-[10px] font-mono text-amber-400 font-bold bg-stone-950 px-1.5 py-0.5 rounded">
                                {cmd.code}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-500" /> {cmd.customerPhone || 'Sem fone'}
                            </div>
                            {cmd.deliveryAddress && (
                              <div className="text-[11px] text-stone-400 mt-0.5 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-stone-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{cmd.deliveryAddress}</span>
                              </div>
                            )}
                          </div>

                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                            {cmd.orderType}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-800/80 text-xs">
                          <span className="text-stone-400">{cmd.items.length} itens</span>
                          <span className="font-mono font-bold text-amber-400">{formatCurrency(cmd.total)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Tables Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedTables.map((table) => {
                const isMine = table.assignedWaiterId === currentUser.id;
                const isOccupied = table.status === 'OCUPADA';
                const isBillRequested = table.status === 'CONTA_SOLICITADA';
                const isFree = table.status === 'LIVRE';
                const isReserved = table.status === 'RESERVADA';
                const isSelected = selectedTable?.id === table.id;

                const tableComanda = table.currentComandaId
                  ? comandas.find((c) => c.id === table.currentComandaId)
                  : null;

                return (
                  <div
                    key={table.id}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[155px] ${
                      isSelected
                        ? 'ring-2 ring-amber-500 bg-stone-800 border-amber-500'
                        : isFree
                        ? 'bg-stone-900/60 hover:bg-stone-900 border-dashed border-stone-700/80 hover:border-amber-500/50'
                        : isBillRequested
                        ? 'bg-yellow-950/40 border-yellow-700/70 text-yellow-200'
                        : isReserved
                        ? 'bg-purple-950/30 border-purple-800/60 text-purple-200'
                        : isMine
                        ? 'bg-stone-900 border-amber-600/70 shadow-md shadow-amber-950/20'
                        : 'bg-stone-900/40 border-stone-800 opacity-60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-white">{table.label}</div>
                        <div className="text-[10px] text-stone-400">{table.capacity} lugares</div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isFree
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                            : isBillRequested
                            ? 'bg-yellow-950 text-yellow-400 border border-yellow-700 animate-pulse'
                            : isReserved
                            ? 'bg-purple-950 text-purple-300 border border-purple-700'
                            : isMine
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {isFree ? 'LIVRE' : isBillRequested ? 'CONTA' : isReserved ? 'RESERVA' : isMine ? 'MINHA' : 'OUTRO'}
                      </span>
                    </div>

                    {/* Body Actions or Data */}
                    {isFree ? (
                      <div className="flex flex-col gap-1.5 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleQuickOpenAndOrder(table)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-950/30 cursor-pointer transition active:scale-95"
                          title="Abrir mesa e abrir cardápio em 1 clique"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-200" />
                          <span>⚡ Abrir & Pedir</span>
                        </button>

                        <div className="flex items-center justify-between text-[10px] text-stone-400 px-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTableForOpen(table);
                              setNewCustomerName('');
                              setNewPeopleCount(2);
                              setNewHasRodizio(false);
                              setNewRodizioAdultCount(0);
                              setNewRodizioChildCount(0);
                              setNewRodizioSeniorCount(0);
                              setNewWaiterId(currentUser.id);
                              setShowOpenModal(true);
                            }}
                            className="hover:text-amber-400 transition cursor-pointer"
                          >
                            Opções...
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTableForReserve(table);
                              setShowReserveModal(true);
                            }}
                            className="hover:text-purple-300 transition cursor-pointer flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Reservar</span>
                          </button>
                        </div>
                      </div>
                    ) : isReserved ? (
                      <div className="mt-auto space-y-1">
                        <div className="text-xs font-semibold text-purple-200 truncate">
                          {table.reservationCustomerName || table.customerName || 'Reserva'}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span>{table.reservationTime || 'Previsto'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTableForReserve(table);
                              setShowReserveModal(true);
                            }}
                            className="text-amber-400 underline font-bold cursor-pointer"
                          >
                            Atender
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto space-y-2 w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeliveryComanda(null);
                            setSelectedTable(table);
                          }}
                          className="text-left space-y-0.5 w-full cursor-pointer hover:opacity-90"
                        >
                          <div className="text-xs font-semibold text-white truncate">
                            {table.customerName || 'Cliente'}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-stone-400">
                            <span>{table.peopleCount} pax</span>
                            <span className="font-mono font-bold text-amber-400">
                              {tableComanda ? formatCurrency(tableComanda.total) : ''}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-stone-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeliveryComanda(null);
                              setSelectedTable(table);
                              setCartItems([]);
                              setShowOrderModal(true);
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white text-[11px] font-bold border border-amber-600/50 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Pedir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeliveryComanda(null);
                              setSelectedTable(table);
                              setShowQuickPayModal(true);
                            }}
                            className="py-1 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[11px] font-bold border border-emerald-600/40 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                            title="Cobrar e liberar mesa agora"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Cobrar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Actions: Editar & Excluir Mesa (Visível apenas para Admin) */}
                    {isAdmin && (
                      <div className="pt-2 mt-2 border-t border-stone-800/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTable(table);
                            setEditTableLabel(table.label);
                            setEditTableCapacity(table.capacity);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-[10px] font-semibold text-stone-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                          title="Editar nome e capacidade da mesa"
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOccupied) {
                              showToast('Não é possível excluir uma mesa ocupada!', 'error');
                            } else {
                              setTableToDelete(table);
                            }
                          }}
                          disabled={isOccupied}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Table/Comanda Detail Drawer (Right column) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          {activeComanda ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{activeComanda.tableLabel}</h3>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {activeComanda.code}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                      {activeComanda.orderType}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Cliente: <strong className="text-stone-200">{activeComanda.customerName}</strong>
                    {activeComanda.orderType === 'MESA' && ` · ${activeComanda.peopleCount} pax`}
                  </div>
                  {activeComanda.deliveryAddress && (
                    <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-500" />
                      <span>{activeComanda.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-stone-500">
                    Aberta às {formatTime(activeComanda.openedAt)} por {activeComanda.waiterName}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    setSelectedDeliveryComanda(null);
                  }}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons Bar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCartItems([]);
                    setShowOrderModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Lançar Pedidos</span>
                </button>

                <button
                  onClick={() => requestBill(activeComanda.id)}
                  disabled={activeComanda.status === 'CONTA_SOLICITADA'}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeComanda.status === 'CONTA_SOLICITADA'
                      ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-700/60'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {activeComanda.status === 'CONTA_SOLICITADA' ? 'Conta Solicitada' : 'Pedir Fechamento'}
                  </span>
                </button>
              </div>

              {/* Table / Account Operations Button (Transfer, Merge, Split) */}
              {selectedTable && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdmin && settings.allowStaffManageTables === false) {
                      showToast('Operações avançadas de mesa estão restritas ao Administrador.', 'error');
                      return;
                    }
                    setShowOperationsModal(true);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    !isAdmin && settings.allowStaffManageTables === false
                      ? 'bg-stone-950/40 text-stone-500 border-stone-800 cursor-not-allowed'
                      : 'bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white border-stone-800 cursor-pointer'
                  }`}
                >
                  <Split className="w-3.5 h-3.5 text-amber-400" />
                  <span>Operações de Mesa (Dividir Conta, Trocar, Juntar)</span>
                  {!isAdmin && settings.allowStaffManageTables === false && (
                    <span className="text-[10px] text-amber-500 font-normal">(Requer Admin)</span>
                  )}
                </button>
              )}

              {/* Items List in Comanda */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Itens Consumidos ({activeComanda.items.length})</span>
                  {activeComanda.items.length > 0 && (
                    <span className="text-[10px] text-stone-500">Enviados à cozinha</span>
                  )}
                </div>

                {activeComanda.items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-stone-500 bg-stone-950 rounded-xl border border-stone-800">
                    Nenhum item lançado ainda nesta comanda.
                  </div>
                ) : (
                  activeComanda.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{it.quantity}x</span>
                          <span>{it.name}</span>
                        </div>
                        {it.doneness && (
                          <div className="text-[11px] text-amber-400">
                            Ponto: {getMeatDonenessLabel(it.doneness)}
                          </div>
                        )}
                        {it.notes && (
                          <div className="text-[10px] text-stone-400 italic">Obs: {it.notes}</div>
                        )}
                        <div className="text-[10px] text-stone-500">
                          {formatTime(it.createdAt)} · {it.prepStation}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-stone-200">
                          {formatCurrency(it.quantity * it.price)}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            it.status === 'PENDENTE'
                              ? 'bg-amber-950 text-amber-400'
                              : it.status === 'EM_PREPARO'
                              ? 'bg-orange-950 text-orange-400 animate-pulse'
                              : it.status === 'PRONTO'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {it.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Summary & 10% Service Fee Toggle */}
              <div className="pt-3 border-t border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal Consumo:</span>
                  <span className="font-mono text-stone-200">{formatCurrency(activeComanda.subtotal)}</span>
                </div>

                {activeComanda.deliveryFee ? (
                  <div className="flex justify-between text-stone-400">
                    <span>Taxa de Entrega:</span>
                    <span className="font-mono text-stone-200">{formatCurrency(activeComanda.deliveryFee)}</span>
                  </div>
                ) : null}

                {/* 10% Service Fee Row with Toggle */}
                <div className="flex items-center justify-between text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span>Serviço ({settings.serviceTaxPercentage}%):</span>
                    <button
                      type="button"
                      onClick={() => toggleServiceFee(activeComanda.id)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${
                        activeComanda.includeService
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {activeComanda.includeService ? 'Ativo (remover)' : 'Removido (ativar)'}
                    </button>
                  </div>
                  <span className="font-mono text-stone-200">
                    {activeComanda.includeService ? `+${formatCurrency(activeComanda.serviceFee)}` : '₲ 0'}
                  </span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-stone-800">
                  <span>Total da Conta:</span>
                  <span className="font-mono text-amber-400">{formatCurrency(activeComanda.total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-stone-500 space-y-3">
              <UtensilsCrossed className="w-10 h-10 text-stone-700" />
              <div>
                <p className="text-sm font-semibold text-stone-300">Nenhuma mesa ou comanda selecionada</p>
                <p className="text-xs text-stone-500 max-w-xs mt-1">
                  Selecione uma mesa ocupada para ver itens ou clique numa mesa livre para iniciar atendimento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Open New Comanda (Mesa) */}
      {showOpenModal && targetTableForOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  Abrir {targetTableForOpen.label}
                </h3>
                <p className="text-xs text-stone-400">
                  Capacidade: {targetTableForOpen.capacity} pessoas
                </p>
              </div>
              <button
                onClick={() => setShowOpenModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenTableSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Nome do Cliente / Identificação:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Almeida ou Almoço Empresa"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Nº de Pessoas (Pax):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={targetTableForOpen.capacity * 2}
                    value={newPeopleCount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setNewPeopleCount(val);
                      if (newHasRodizio) setNewRodizioAdultCount(val);
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Garçom / Vendedor:
                  </label>
                  <select
                    value={newWaiterId}
                    onChange={(e) => setNewWaiterId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    {employees
                      .filter((e) => e.active)
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Rodízio Section: Adult, Child & Senior */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      Lançar Rodízio na Mesa?
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Inclui cortes nobres e buffet livre
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newHasRodizio}
                    onChange={(e) => setNewHasRodizio(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                {newHasRodizio && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800 text-xs">
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1 truncate">
                        Adulto ({formatCurrency(settings.rodizioAdultPrice)}):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newRodizioAdultCount}
                        onChange={(e) => setNewRodizioAdultCount(Number(e.target.value) || 0)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1 truncate">
                        Criança ({formatCurrency(settings.rodizioChildPrice)}):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newRodizioChildCount}
                        onChange={(e) => setNewRodizioChildCount(Number(e.target.value) || 0)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-1 truncate">
                        Idoso 60+ ({formatCurrency(settings.rodizioSeniorPrice)}):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newRodizioSeniorCount}
                        onChange={(e) => setNewRodizioSeniorCount(Number(e.target.value) || 0)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fast Touch Order Launcher */}
      {showOrderModal && activeComanda && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Lançar Pedidos · {activeComanda.tableLabel}
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    {activeComanda.code}
                  </span>
                </div>
                <div className="text-xs text-stone-400">
                  Cliente: {activeComanda.customerName}
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category filters & search */}
            <div className="p-3 bg-stone-950/60 border-b border-stone-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar corte nobre, guarnição, peso, bebida, chopp ou sobremesa..."
                  value={searchMenu}
                  onChange={(e) => setSearchMenu(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split View: Menu list on Left, Cart on Right */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
              <div className="md:col-span-2 p-4 overflow-y-auto space-y-3 bg-stone-900/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredMenuItems.map((item) => {
                    const stockQty = typeof item.stockQuantity === 'number' ? item.stockQuantity : 40;
                    const isOutOfStock = stockQty <= 0;

                    return (
                      <button
                        key={item.id}
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(item)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                          isOutOfStock
                            ? 'bg-stone-950/40 border-stone-850 opacity-40 cursor-not-allowed'
                            : 'bg-stone-950 border-stone-800 hover:border-amber-500/70 active:scale-98 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4
                              className={`text-xs font-bold transition-colors ${
                                isOutOfStock ? 'text-stone-500 line-through' : 'text-white group-hover:text-amber-400'
                              }`}
                            >
                              {item.name}
                            </h4>
                            <span className="font-mono font-bold text-xs text-amber-400 whitespace-nowrap">
                              {formatCurrency(item.price)}
                              {item.isWeighed && <span className="text-[10px] text-stone-400">/kg</span>}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-stone-400 line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-900 text-[10px]">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                                : stockQty <= 5
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            }`}
                          >
                            {isOutOfStock ? 'ESGOTADO' : `${stockQty} un disponíveis`}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.isWeighed && (
                              <span className="text-teal-400 font-semibold flex items-center gap-0.5">
                                <Scale className="w-3 h-3" /> Pesar
                              </span>
                            )}
                            {item.allowsDoneness && (
                              <span className="text-orange-400 font-semibold flex items-center gap-0.5">
                                <Flame className="w-3 h-3" /> Ponto
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cart Drawer */}
              <div className="p-4 bg-stone-950 border-l border-stone-800 flex flex-col justify-between overflow-hidden">
                <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Itens do Pedido ({cartItems.reduce((acc, c) => acc + c.quantity, 0)})
                    </h4>
                    {cartItems.length > 0 && (
                      <button
                        onClick={() => setCartItems([])}
                        className="text-[11px] text-stone-400 hover:text-red-400"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-10 text-stone-500 text-xs">
                        Nenhum item selecionado. Toque nos itens do cardápio à esquerda.
                      </div>
                    ) : (
                      cartItems.map((ci, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-1"
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-bold text-white">
                              {ci.item.name}
                              {ci.weightInKg && (
                                <span className="text-teal-400 font-mono text-[10px] block">
                                  Peso: {ci.weightInKg.toFixed(3)} kg
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setCartItems((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-stone-500 hover:text-red-400 p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Meat Doneness Quick Chips */}
                          {ci.item.allowsDoneness && (
                            <div className="flex items-center gap-1 pt-1">
                              <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" /> Ponto:
                              </span>
                              {(['MAL_PASSADO', 'AO_PONTO', 'BEM_PASSADO'] as MeatDoneness[]).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    setCartItems((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, doneness: d } : item))
                                    );
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                                    ci.doneness === d
                                      ? 'bg-amber-600 text-white border-amber-500'
                                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-white'
                                  }`}
                                >
                                  {d === 'MAL_PASSADO' ? 'Mal' : d === 'AO_PONTO' ? 'Ponto' : 'Bem'}
                                </button>
                              ))}
                            </div>
                          )}

                          {ci.notes && (
                            <div className="text-[10px] text-stone-400 italic">Obs: {ci.notes}</div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setCartItems((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                                        : item
                                    )
                                  )
                                }
                                className="w-5 h-5 rounded bg-stone-800 text-stone-200 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-white">{ci.quantity}</span>
                              <button
                                onClick={() =>
                                  setCartItems((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, quantity: item.quantity + 1 } : item
                                    )
                                  )
                                }
                                className="w-5 h-5 rounded bg-stone-800 text-stone-200 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-mono font-bold text-amber-400">
                              {formatCurrency(
                                ci.weightInKg
                                  ? ci.item.price * ci.weightInKg * ci.quantity
                                  : ci.item.price * ci.quantity
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>Total do Lançamento:</span>
                    <span className="font-mono text-amber-400 text-sm">
                      {formatCurrency(
                        cartItems.reduce(
                          (acc, ci) =>
                            acc +
                            (ci.weightInKg
                              ? ci.item.price * ci.weightInKg * ci.quantity
                              : ci.item.price * ci.quantity),
                          0
                        )
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSendOrder}
                      disabled={cartItems.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-stone-800 disabled:text-stone-500 text-white text-xs font-bold transition-all shadow-lg active:scale-98 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar para Cozinha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSendOrder();
                        setShowQuickPayModal(true);
                      }}
                      disabled={cartItems.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-stone-800 disabled:text-stone-500 text-white text-xs font-bold transition-all shadow-lg active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>⚡ Enviar & Cobrar Agora</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Customizer Submodal (Weight, Doneness, Observations) */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h4 className="text-sm font-bold text-white">{customizingItem.name}</h4>
                <p className="text-xs text-amber-400 font-mono font-bold">
                  {formatCurrency(customizingItem.price)}
                  {customizingItem.isWeighed && ' / kg'}
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* If weighed item */}
              {customizingItem.isWeighed && (
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-200 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-teal-400" />
                      Informe o Peso (kg):
                    </label>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      Total: {formatCurrency(customizingItem.price * (parseFloat(customWeight) || 0))}
                    </span>
                  </div>

                  <input
                    type="number"
                    step="0.005"
                    min="0.05"
                    max="5.0"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white font-mono text-center text-sm font-bold"
                  />

                  {/* Quick Weight Presets */}
                  <div className="flex items-center gap-1.5 justify-center pt-1">
                    {['0.300', '0.450', '0.600', '0.800', '1.000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomWeight(preset)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-semibold ${
                          customWeight === preset
                            ? 'bg-teal-600 text-white'
                            : 'bg-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        {preset}kg
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Doneness Selector */}
              {customizingItem.allowsDoneness && (
                <div>
                  <label className="block font-semibold text-stone-300 mb-2">
                    Escolha o Ponto da Carne:
                  </label>
                  <div className="space-y-1.5">
                    {(
                      [
                        { id: 'MAL_PASSADO', label: 'Mal Passado (sangrando, bem vermelho)' },
                        { id: 'AO_PONTO_PARA_MAL', label: 'Ao Ponto p/ Mal (miolo vermelho vivo)' },
                        { id: 'AO_PONTO', label: 'Ao Ponto (rosado suculento)' },
                        { id: 'AO_PONTO_PARA_BEM', label: 'Ao Ponto p/ Bem (quase sem rosa)' },
                        { id: 'BEM_PASSADO', label: 'Bem Passado (sem ponto rosa)' },
                      ] as Array<{ id: MeatDoneness; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCustomDoneness(opt.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          customDoneness === opt.id
                            ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Notes */}
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Observações para o Preparo:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Sem sal grosso',
                    'Pouco sal',
                    'Capa tostada',
                    'Fatiar na mesa',
                    'Chimichurri à parte',
                    'Gelo e limão separados',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setCustomNotes((prev) => (prev ? `${prev}, ${preset}` : preset))
                      }
                      className="text-[10px] bg-stone-950 hover:bg-stone-800 text-stone-300 px-2 py-1 rounded-md border border-stone-800"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ex: sem sal, bem quente, corte fino..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                <span className="text-stone-300">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-stone-800 text-white font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-white px-2">{customQty}</span>
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-stone-800 text-white font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setCustomizingItem(null)}
                  className="px-3 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCustomItem}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                >
                  Adicionar ao Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Table Operations (Split Bill, Transfer Comanda, Move Items, Merge) */}
      {showOperationsModal && selectedTable && activeComanda && (
        <TableOperationsModal
          table={selectedTable}
          comanda={activeComanda}
          tables={tables}
          settings={settings}
          onClose={() => setShowOperationsModal(false)}
        />
      )}

      {/* Modal: Reserve Table */}
      {showReserveModal && targetTableForReserve && (
        <ReserveTableModal
          table={targetTableForReserve}
          onClose={() => {
            setShowReserveModal(false);
            setTargetTableForReserve(null);
          }}
          onStartAttendance={(t) => {
            setShowReserveModal(false);
            setTargetTableForOpen(t);
            setNewCustomerName(t.reservationCustomerName || t.customerName || '');
            setNewPeopleCount(t.capacity || 2);
            setNewHasRodizio(true);
            setNewRodizioAdultCount(t.capacity || 2);
            setNewRodizioChildCount(0);
            setNewRodizioSeniorCount(0);
            setShowOpenModal(true);
          }}
        />
      )}

      {/* Modal: New Delivery or Retirada Order */}
      {showDeliveryModal && (
        <DeliveryModal
          onClose={() => setShowDeliveryModal(false)}
          onCreated={(cmdId) => {
            setShowDeliveryModal(false);
            setStatusFilter('DELIVERY');
            const found = comandas.find((c) => c.id === cmdId);
            if (found) {
              setSelectedTable(null);
              setSelectedDeliveryComanda(found);
            }
          }}
        />
      )}

      {/* ADMIN EXCLUSIVE MODAL: Adicionar Nova Mesa */}
      {showAddTableModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>Adicionar Nova Mesa</span>
              </h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTableLabel.trim()) {
                  showToast('Informe o nome ou número da mesa.', 'error');
                  return;
                }
                const res = addTable(newTableLabel.trim(), newTableCapacity || 4);
                if (res.success) {
                  setShowAddTableModal(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Identificação / Nome da Mesa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mesa 15, Varanda 02, Deck 01"
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Capacidade de Lugares:
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 2)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Criar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN EXCLUSIVE MODAL: Editar Mesa Existente */}
      {editingTable && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <span>Editar Mesa ({editingTable.label})</span>
              </h3>
              <button
                onClick={() => setEditingTable(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editTableLabel.trim()) {
                  showToast('Informe o nome ou número da mesa.', 'error');
                  return;
                }
                const res = updateTable(editingTable.id, {
                  label: editTableLabel.trim(),
                  capacity: editTableCapacity,
                });
                if (res.success) {
                  setEditingTable(null);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Nome / Identificação:
                </label>
                <input
                  type="text"
                  required
                  value={editTableLabel}
                  onChange={(e) => setEditTableLabel(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Capacidade (Lugares):
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={editTableCapacity}
                  onChange={(e) => setEditTableCapacity(parseInt(e.target.value) || 2)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN EXCLUSIVE MODAL: Confirmar Exclusão de Mesa */}
      {tableToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-900/60 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-950/60 border border-red-700/40 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Mesa</h3>
                <p className="text-xs text-stone-400">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Tem certeza que deseja excluir permanentemente a <strong>{tableToDelete.label}</strong> com capacidade de <strong>{tableToDelete.capacity} lugares</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteTable(tableToDelete.id);
                  if (res.success) {
                    if (selectedTable?.id === tableToDelete.id) {
                      setSelectedTable(null);
                    }
                    setTableToDelete(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pay Modal for Active Table Comanda */}
      {showQuickPayModal && activeComanda && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B0F19] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>Cobrar · {activeComanda.tableLabel}</span>
                </h3>
                <p className="text-xs text-stone-400">
                  {activeComanda.code} · {activeComanda.items.length} itens consumidos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickPayModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-[#1E2638] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total value display */}
            <div className="p-4 rounded-2xl bg-[#0E1526] border border-[#1E2638] text-center space-y-1">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Total da Conta
              </span>
              <div className="text-3xl font-black font-mono text-amber-400">
                {formatCurrency(activeComanda.total)}
              </div>
              {activeComanda.includeService && (
                <div className="text-[11px] text-stone-500">
                  (Inclui 10% de serviço: {formatCurrency(activeComanda.serviceFee)})
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-300">
                Selecione a Forma de Pagamento:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'PIX', label: 'PIX', icon: QrCode, desc: 'Instantâneo' },
                  { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign, desc: 'Cédulas / Moedas' },
                  { id: 'CARTAO_DEBITO', label: 'Cartão Débito', icon: CreditCard, desc: 'Maquininha' },
                  { id: 'CARTAO_CREDITO', label: 'Cartão Crédito', icon: CreditCard, desc: 'Maquininha' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedPayMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPayMethod(m.id as PaymentMethod)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600/20 border-amber-500 ring-1 ring-amber-500 text-white'
                          : 'bg-[#131A2D] border-[#1E2638] text-stone-400 hover:text-white hover:bg-[#1E2638]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{m.label}</div>
                        <div className="text-[10px] text-stone-400">{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickPayModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#131A2D] hover:bg-[#1E2638] text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handlePayActiveTable(selectedPayMethod)}
                className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Finalizar & Liberar Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Continuous Sale Terminal */}
      {showQuickSaleModal && (
        <QuickSaleModal onClose={() => setShowQuickSaleModal(false)} />
      )}

      {/* Modal: Receipt Printer */}
      {showReceiptModal && lastPaidComanda && (
        <ReceiptModal
          comanda={lastPaidComanda}
          settings={settings}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
