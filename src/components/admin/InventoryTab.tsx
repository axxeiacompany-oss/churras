import React, { useState, useMemo } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import {
  Ingredient,
  IngredientCategory,
  StockUnit,
  WasteReason,
  WasteRecord,
} from '../../types';
import { formatCurrency, formatTime } from '../../utils/format';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Edit2,
  RefreshCw,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  Layers,
  UtensilsCrossed,
  CheckCircle2,
  X,
} from 'lucide-react';

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  CARNES: 'Carnes & Cortes',
  BEBIDAS: 'Bebidas & Chopp',
  CARVAO_LENHA: 'Carvão & Lenha',
  HORTIFRUTI: 'Hortifrúti & Saladas',
  MERCEARIA: 'Mercearia & Secos',
  SOBREMESAS: 'Sobremesas & Doces',
  OUTROS: 'Outros Insumos',
};

const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  VALIDADE_VENCIDA: 'Validade Vencida',
  QUEIMA_OU_ERRO_PREPARO: 'Queima / Erro de Preparo',
  LIMPEZA_CORTE_EXCESSIVO: 'Limpeza / Apara Excessiva de Gordura',
  DANO_AVARIA: 'Dano / Quebra em Transporte',
  OUTRO: 'Outro Motivo',
};

export const InventoryTab: React.FC = () => {
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    restockIngredient,
    wasteRecords,
    registerWaste,
    stockMovements,
    lowStockIngredients,
    menuItems,
    currentUser,
    showToast,
  } = useChurras();

  // Subtabs
  const [subTab, setSubTab] = useState<'STOCK' | 'RECIPES' | 'WASTE' | 'MOVEMENTS'>('STOCK');

  // Filters for stock list
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'ALL'>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals state
  const [showIngredientModal, setShowIngredientModal] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
  const [targetRestockIngredient, setTargetRestockIngredient] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState<string>('');
  const [restockCost, setRestockCost] = useState<string>('');
  const [restockSupplier, setRestockSupplier] = useState<string>('');

  const [showWasteModal, setShowWasteModal] = useState<boolean>(false);
  const [wasteIngredientId, setWasteIngredientId] = useState<string>('');
  const [wasteQty, setWasteQty] = useState<string>('');
  const [wasteReason, setWasteReason] = useState<WasteReason>('LIMPEZA_CORTE_EXCESSIVO');
  const [wasteNotes, setWasteNotes] = useState<string>('');

  // Ingredient Form State
  const [ingName, setIngName] = useState<string>('');
  const [ingCategory, setIngCategory] = useState<IngredientCategory>('CARNES');
  const [ingUnit, setIngUnit] = useState<StockUnit>('KG');
  const [ingCurrentStock, setIngCurrentStock] = useState<string>('');
  const [ingMinStock, setIngMinStock] = useState<string>('');
  const [ingCostPerUnit, setIngCostPerUnit] = useState<string>('');
  const [ingSupplier, setIngSupplier] = useState<string>('');

  // KPIs
  const totalStockValue = useMemo(() => {
    return ingredients.reduce((acc, ing) => acc + ing.currentStock * ing.costPerUnit, 0);
  }, [ingredients]);

  const totalWasteLoss = useMemo(() => {
    return wasteRecords.reduce((acc, w) => acc + w.estimatedCost, 0);
  }, [wasteRecords]);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch =
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ing.supplier && ing.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'ALL' || ing.category === selectedCategory;
      const matchesLowStock = !onlyLowStock || ing.currentStock <= ing.minStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [ingredients, searchTerm, selectedCategory, onlyLowStock]);

  // Open modal handlers
  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngCategory('CARNES');
    setIngUnit('KG');
    setIngCurrentStock('10');
    setIngMinStock('5');
    setIngCostPerUnit('30');
    setIngSupplier('');
    setShowIngredientModal(true);
  };

  const handleOpenEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngCategory(ing.category);
    setIngUnit(ing.unit);
    setIngCurrentStock(ing.currentStock.toString());
    setIngMinStock(ing.minStock.toString());
    setIngCostPerUnit(ing.costPerUnit.toString());
    setIngSupplier(ing.supplier || '');
    setShowIngredientModal(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) return;

    const currentStockNum = parseFloat(ingCurrentStock) || 0;
    const minStockNum = parseFloat(ingMinStock) || 0;
    const costNum = parseFloat(ingCostPerUnit) || 0;

    if (editingIngredient) {
      updateIngredient(editingIngredient.id, {
        name: ingName.trim(),
        category: ingCategory,
        unit: ingUnit,
        currentStock: currentStockNum,
        minStock: minStockNum,
        costPerUnit: costNum,
        supplier: ingSupplier.trim() || undefined,
      });
    } else {
      addIngredient({
        name: ingName.trim(),
        category: ingCategory,
        unit: ingUnit,
        currentStock: currentStockNum,
        minStock: minStockNum,
        costPerUnit: costNum,
        supplier: ingSupplier.trim() || undefined,
      });
    }

    setShowIngredientModal(false);
  };

  const handleOpenRestock = (ing: Ingredient) => {
    setTargetRestockIngredient(ing);
    setRestockQty('10');
    setRestockCost(ing.costPerUnit.toString());
    setRestockSupplier(ing.supplier || '');
    setShowRestockModal(true);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRestockIngredient) return;

    const qty = parseFloat(restockQty);
    if (!qty || qty <= 0) {
      showToast('Digite uma quantidade válida para reposição.', 'warning');
      return;
    }

    const cost = restockCost ? parseFloat(restockCost) : undefined;
    restockIngredient(
      targetRestockIngredient.id,
      qty,
      cost,
      restockSupplier.trim() || undefined
    );
    setShowRestockModal(false);
  };

  const handleOpenWasteModal = (preselectedIngredientId?: string) => {
    setWasteIngredientId(preselectedIngredientId || ingredients[0]?.id || '');
    setWasteQty('1');
    setWasteReason('LIMPEZA_CORTE_EXCESSIVO');
    setWasteNotes('');
    setShowWasteModal(true);
  };

  const handleConfirmWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find((i) => i.id === wasteIngredientId);
    if (!ing) return;

    const qty = parseFloat(wasteQty);
    if (!qty || qty <= 0) {
      showToast('Digite uma quantidade válida descartada.', 'warning');
      return;
    }

    const costEst = Math.round(qty * ing.costPerUnit * 100) / 100;

    registerWaste({
      ingredientId: ing.id,
      ingredientName: ing.name,
      quantity: qty,
      unit: ing.unit,
      reason: wasteReason,
      estimatedCost: costEst,
      registeredBy: currentUser?.name || 'Administrador',
      notes: wasteNotes.trim() || undefined,
    });

    setShowWasteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Total de Insumos</span>
            <div className="p-2 rounded-xl bg-amber-600/10 text-amber-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{ingredients.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Itens monitorados em estoque</div>
        </div>

        <div
          onClick={() => {
            setOnlyLowStock(true);
            setSubTab('STOCK');
          }}
          className={`cursor-pointer rounded-2xl p-4 shadow-lg transition-all border ${
            lowStockIngredients.length > 0
              ? 'bg-red-950/30 border-red-800/80 hover:bg-red-950/50'
              : 'bg-stone-900 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold ${
                lowStockIngredients.length > 0 ? 'text-red-400' : 'text-stone-400'
              }`}
            >
              Alertas de Estoque Mínimo
            </span>
            <div
              className={`p-2 rounded-xl ${
                lowStockIngredients.length > 0
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black ${
              lowStockIngredients.length > 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {lowStockIngredients.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {lowStockIngredients.length > 0
              ? 'Insumos atingiram nível crítico!'
              : 'Todos os níveis normais'}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Valor em Estoque</span>
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatCurrency(totalStockValue)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Custo total dos ativos físicos</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Perdas & Desperdício</span>
            <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            {formatCurrency(totalWasteLoss)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {wasteRecords.length} registro(s) de descarte
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-stone-900 border border-stone-800 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setSubTab('STOCK')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'STOCK'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Insumos & Estoque ({ingredients.length})</span>
            {lowStockIngredients.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold animate-pulse">
                {lowStockIngredients.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('RECIPES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'RECIPES'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Fichas Técnicas & Baixa Automática</span>
          </button>

          <button
            onClick={() => setSubTab('WASTE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'WASTE'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Perdas & Desperdício ({wasteRecords.length})</span>
          </button>

          <button
            onClick={() => setSubTab('MOVEMENTS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              subTab === 'MOVEMENTS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Kardex / Movimentações ({stockMovements.length})</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => handleOpenWasteModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white text-xs font-bold transition-all shadow-sm"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Registrar Perda</span>
          </button>

          <button
            onClick={handleOpenAddIngredient}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: INSUMOS & ESTOQUE */}
      {subTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-stone-900/60 border border-stone-800 p-3 rounded-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por insumo ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as IngredientCategory | 'ALL')}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 font-semibold"
              >
                <option value="ALL">Todas as Categorias</option>
                <option value="CARNES">Carnes & Cortes</option>
                <option value="BEBIDAS">Bebidas & Chopp</option>
                <option value="CARVAO_LENHA">Carvão & Lenha</option>
                <option value="HORTIFRUTI">Hortifrúti & Saladas</option>
                <option value="MERCEARIA">Mercearia & Secos</option>
                <option value="SOBREMESAS">Sobremesas & Doces</option>
              </select>

              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                  onlyLowStock
                    ? 'bg-red-950/80 text-red-300 border-red-700 shadow-sm'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Abaixo do Mínimo ({lowStockIngredients.length})</span>
              </button>
            </div>
          </div>

          {/* Warning banner if any item below minimum */}
          {lowStockIngredients.length > 0 && !onlyLowStock && (
            <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-600/30">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-100">
                    Atenção: {lowStockIngredients.length} insumo(s) estão com estoque crítico!
                  </h4>
                  <p className="text-xs text-red-300/80">
                    {lowStockIngredients.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(' • ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOnlyLowStock(true)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs whitespace-nowrap transition-all self-start sm:self-auto"
              >
                Filtrar Críticos
              </button>
            </div>
          )}

          {/* Ingredients Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Insumo / Fornecedor</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Estoque Atual vs Mínimo</th>
                    <th className="p-3.5">Custo Unitário</th>
                    <th className="p-3.5">Valor Total</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70 text-stone-300">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500">
                        Nenhum insumo encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const isLowStock = ing.currentStock <= ing.minStock;
                      const ratio = ing.minStock > 0 ? (ing.currentStock / (ing.minStock * 2)) * 100 : 100;
                      const progressWidth = Math.min(100, Math.max(5, ratio));
                      const itemTotalValue = ing.currentStock * ing.costPerUnit;

                      return (
                        <tr
                          key={ing.id}
                          className={`hover:bg-stone-850 transition-colors ${
                            isLowStock ? 'bg-red-950/15' : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {ing.name}
                              {isLowStock && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-900/80 text-red-300 border border-red-700">
                                  CRÍTICO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {ing.supplier ? `Fornecedor: ${ing.supplier}` : 'Sem fornecedor cadastrado'}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-lg bg-stone-950 text-stone-400 border border-stone-800 text-[11px] font-semibold">
                              {CATEGORY_LABELS[ing.category] || ing.category}
                            </span>
                          </td>

                          <td className="p-3.5 min-w-[180px]">
                            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                              <span className={isLowStock ? 'text-red-400' : 'text-stone-200'}>
                                {ing.currentStock.toFixed( ing.unit === 'KG' ? 2 : 0 )} {ing.unit}
                              </span>
                              <span className="text-[10px] text-stone-500 font-sans">
                                Mín: {ing.minStock} {ing.unit}
                              </span>
                            </div>
                            <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isLowStock
                                    ? 'bg-red-500'
                                    : ratio < 65
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${progressWidth}%` }}
                              />
                            </div>
                          </td>

                          <td className="p-3.5 font-mono text-stone-300 font-semibold">
                            {formatCurrency(ing.costPerUnit)} / {ing.unit}
                          </td>

                          <td className="p-3.5 font-mono font-bold text-emerald-400">
                            {formatCurrency(itemTotalValue)}
                          </td>

                          <td className="p-3.5 text-center">
                            {isLowStock ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Repor Imediato
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Normal
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenRestock(ing)}
                                title="Repor / Entrada de Estoque"
                                className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Entrada</span>
                              </button>

                              <button
                                onClick={() => handleOpenWasteModal(ing.id)}
                                title="Registrar Perda / Quebra"
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-950/80 text-stone-400 hover:text-red-400 transition-colors"
                              >
                                <TrendingDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditIngredient(ing)}
                                title="Editar Insumo"
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Deseja remover o insumo "${ing.name}"?`)) {
                                    deleteIngredient(ing.id);
                                  }
                                }}
                                title="Excluir Insumo"
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* SUBTAB 2: FICHAS TÉCNICAS & CARDÁPIO */}
      {subTab === 'RECIPES' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              Ficha Técnica Simples & Baixa Automática no Estoque
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Cada venda realizada de um prato ou corte desconta automaticamente do estoque os insumos cadastrados abaixo em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const recipe = item.recipe || [];
              const theoreticalCost = recipe.reduce((acc, r) => {
                const ing = ingredients.find((i) => i.id === r.ingredientId);
                return acc + (ing ? ing.costPerUnit * r.quantity : 0);
              }, 0);

              const profitMargin =
                item.price > 0
                  ? ((item.price - (item.costPrice || theoreticalCost)) / item.price) * 100
                  : 0;

              return (
                <div
                  key={item.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800">
                      <div>
                        <div className="font-extrabold text-white text-base">{item.name}</div>
                        <div className="text-xs text-stone-400">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-amber-400 text-sm">
                          {formatCurrency(item.price)}
                        </div>
                        <div className="text-[10px] text-stone-500">Preço de Venda</div>
                      </div>
                    </div>

                    {/* Margem e Custo */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Custo de Produção:</span>
                        <strong className="font-mono text-stone-200">
                          {formatCurrency(item.costPrice || theoreticalCost)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Margem Bruta Estimada:</span>
                        <strong
                          className={`font-mono ${
                            profitMargin > 50
                              ? 'text-emerald-400'
                              : profitMargin > 30
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {profitMargin.toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    {/* Ficha Técnica Insumos */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                        Insumos que dão Baixa Automática ({recipe.length}):
                      </div>
                      {recipe.length === 0 ? (
                        <div className="p-3 bg-stone-950/60 rounded-xl border border-dashed border-stone-800 text-[11px] text-stone-500">
                          Nenhum insumo vinculado a este item. Edite no Cardápio para configurar a ficha técnica.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {recipe.map((r, idx) => {
                            const ing = ingredients.find((i) => i.id === r.ingredientId);
                            const subCost = ing ? ing.costPerUnit * r.quantity : 0;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-950 border border-stone-850"
                              >
                                <span className="font-medium text-stone-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  {ing?.name || r.ingredientId}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-amber-400">
                                    - {r.quantity} {ing?.unit || 'un'}
                                  </span>
                                  <span className="font-mono text-stone-500 text-[11px]">
                                    ({formatCurrency(subCost)})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PERDAS & DESPERDÍCIO */}
      {subTab === 'WASTE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                Auditoria de Perdas & Desperdício
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Acompanhamento rigoroso de quebras, aparas de gordura e produtos vencidos para controle de custo.
              </p>
            </div>
            <button
              onClick={() => handleOpenWasteModal()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Descarte</span>
            </button>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Data & Hora</th>
                    <th className="p-3.5">Insumo Descartado</th>
                    <th className="p-3.5">Quantidade</th>
                    <th className="p-3.5">Motivo do Descarte</th>
                    <th className="p-3.5">Prejuízo Financeiro</th>
                    <th className="p-3.5">Responsável</th>
                    <th className="p-3.5">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70 text-stone-300">
                  {wasteRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500">
                        Nenhum registro de desperdício cadastrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    wasteRecords.map((w) => (
                      <tr key={w.id} className="hover:bg-stone-850 transition-colors">
                        <td className="p-3.5 font-mono text-stone-400 whitespace-nowrap">
                          {formatTime(w.date)}
                        </td>
                        <td className="p-3.5 font-bold text-white">{w.ingredientName}</td>
                        <td className="p-3.5 font-mono font-bold text-red-400">
                          {w.quantity} {w.unit}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-lg bg-red-950/80 text-red-300 border border-red-800 text-[11px] font-semibold">
                            {WASTE_REASON_LABELS[w.reason] || w.reason}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-red-400">
                          {formatCurrency(w.estimatedCost)}
                        </td>
                        <td className="p-3.5 text-stone-300 font-medium">{w.registeredBy}</td>
                        <td className="p-3.5 text-stone-400 max-w-xs truncate">
                          {w.notes || '—'}
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

      {/* SUBTAB 4: KARDEX / MOVIMENTAÇÕES */}
      {subTab === 'MOVEMENTS' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Histórico de Movimentações de Estoque (Kardex)
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Registro completo de todas as entradas de compras, baixas automáticas originadas pelas vendas e descartes registrados.
            </p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Tipo de Movimentação</th>
                    <th className="p-3.5">Insumo</th>
                    <th className="p-3.5">Quantidade</th>
                    <th className="p-3.5">Referência / Origem</th>
                    <th className="p-3.5">Operador / Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70 text-stone-300">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500">
                        Nenhuma movimentação registrada.
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-stone-850 transition-colors">
                        <td className="p-3.5 font-mono text-stone-400 whitespace-nowrap">
                          {formatTime(mov.date)}
                        </td>
                        <td className="p-3.5">
                          {mov.type === 'ENTRADA' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                              <ArrowUpRight className="w-3 h-3" /> Entrada / Compra
                            </span>
                          ) : mov.type === 'BAIXA_VENDA' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1 w-fit">
                              <ArrowDownRight className="w-3 h-3" /> Baixa por Venda
                            </span>
                          ) : mov.type === 'PERDA' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 w-fit">
                              <TrendingDown className="w-3 h-3" /> Descarte / Perda
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 w-fit">
                              Ajuste
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-white">{mov.ingredientName}</td>
                        <td className="p-3.5 font-mono font-bold">
                          <span
                            className={
                              mov.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'
                            }
                          >
                            {mov.type === 'ENTRADA' ? '+' : '-'} {mov.quantity} {mov.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-300">{mov.reference || '—'}</td>
                        <td className="p-3.5 text-stone-400">{mov.registeredBy || 'Sistema'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE INSUMO */}
      {showIngredientModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {editingIngredient ? 'Editar Insumo de Estoque' : 'Novo Insumo de Estoque'}
              </h3>
              <button
                onClick={() => setShowIngredientModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Nome do Insumo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Picanha Angus Certificada"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Categoria:</label>
                  <select
                    value={ingCategory}
                    onChange={(e) => setIngCategory(e.target.value as IngredientCategory)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CARNES">Carnes & Cortes</option>
                    <option value="BEBIDAS">Bebidas & Chopp</option>
                    <option value="CARVAO_LENHA">Carvão & Lenha</option>
                    <option value="HORTIFRUTI">Hortifrúti & Saladas</option>
                    <option value="MERCEARIA">Mercearia & Secos</option>
                    <option value="SOBREMESAS">Sobremesas & Doces</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Unidade de Medida:</label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value as StockUnit)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  >
                    <option value="KG">Quilogramas (KG)</option>
                    <option value="UN">Unidades (UN)</option>
                    <option value="PACOTE">Pacote / Fardo</option>
                    <option value="L">Litros (L)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Estoque Atual ({ingUnit}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={ingCurrentStock}
                    onChange={(e) => setIngCurrentStock(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Estoque Mínimo (Alerta):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 10"
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Custo Unitário (R$ / {ingUnit}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={ingCostPerUnit}
                    onChange={(e) => setIngCostPerUnit(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Fornecedor Principal:</label>
                  <input
                    type="text"
                    placeholder="Ex: Frigorífico VPJ"
                    value={ingSupplier}
                    onChange={(e) => setIngSupplier(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIngredientModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {editingIngredient ? 'Salvar Insumo' : 'Cadastrar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRADA / REPOSIÇÃO DE ESTOQUE */}
      {showRestockModal && targetRestockIngredient && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                Registrar Entrada de Estoque
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 mb-4 text-xs">
              <div className="font-bold text-white text-sm">{targetRestockIngredient.name}</div>
              <div className="text-stone-400 mt-1">
                Estoque Atual: <strong className="text-amber-400">{targetRestockIngredient.currentStock} {targetRestockIngredient.unit}</strong> |
                Estoque Mínimo: {targetRestockIngredient.minStock} {targetRestockIngredient.unit}
              </div>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Quantidade Recebida ({targetRestockIngredient.unit}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 25.0"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Custo Unitário da Nota (R$ / {targetRestockIngredient.unit}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Fornecedor / Nº Nota Fiscal:</label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 4912 - Distribuidora Ambev"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PERDA / DESPERDÍCIO */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                Registrar Perda ou Desperdício
              </h3>
              <button onClick={() => setShowWasteModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWaste} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Insumo Descartado:</label>
                <select
                  value={wasteIngredientId}
                  onChange={(e) => setWasteIngredientId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-medium"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Atual: {ing.currentStock} {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Quantidade Descartada:
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 1.5"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Motivo do Descarte:</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value as WasteReason)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="LIMPEZA_CORTE_EXCESSIVO">Limpeza / Apara Excessiva de Gordura</option>
                  <option value="QUEIMA_OU_ERRO_PREPARO">Queima ou Erro de Preparo na Grelha</option>
                  <option value="VALIDADE_VENCIDA">Validade Vencida</option>
                  <option value="DANO_AVARIA">Dano / Quebra em Transporte / Armazenagem</option>
                  <option value="OUTRO">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Observações / Detalhes:</label>
                <textarea
                  rows={2}
                  placeholder="Descreva a causa para auditoria de perdas..."
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Confirmar Baixa por Perda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
