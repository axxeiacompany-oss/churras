import React, { useState } from 'react';
import { Table, Comanda, RestaurantSettings } from '../../types';
import { useChurras } from '../../context/ChurrasContext';
import { formatCurrency } from '../../utils/format';
import {
  X,
  ArrowRightLeft,
  Merge,
  Split,
  Layers,
  Check,
  Percent,
  Copy,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';

interface TableOperationsModalProps {
  table: Table;
  comanda: Comanda;
  tables: Table[];
  settings: RestaurantSettings;
  onClose: () => void;
}

export const TableOperationsModal: React.FC<TableOperationsModalProps> = ({
  table,
  comanda,
  tables,
  settings,
  onClose,
}) => {
  const {
    transferComanda,
    transferItems,
    mergeComandas,
    toggleServiceFee,
    showToast,
  } = useChurras();

  const [activeTab, setActiveTab] = useState<'SPLIT' | 'TRANSFER_TABLE' | 'TRANSFER_ITEMS' | 'MERGE'>('SPLIT');

  // Split bill state
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(
    Math.max(2, comanda.peopleCount || 2)
  );
  const [copied, setCopied] = useState<boolean>(false);

  // Transfer comanda state
  const [targetTableIdForTransfer, setTargetTableIdForTransfer] = useState<number | null>(null);

  // Transfer items state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [targetComandaIdForItems, setTargetComandaIdForItems] = useState<string | null>(null);

  // Merge tables state
  const [targetTableIdForMerge, setTargetTableIdForMerge] = useState<number | null>(null);

  // Available free tables for full transfer
  const freeTables = tables.filter((t) => t.status === 'LIVRE' && t.id !== table.id);

  // Other occupied tables for items transfer & merge
  const otherOccupiedTables = tables.filter(
    (t) => t.status !== 'LIVRE' && t.id !== table.id && t.currentComandaId
  );

  // Calculations for split bill
  const subtotal = comanda.subtotal;
  const serviceFee = comanda.includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
  const deliveryFee = comanda.deliveryFee || 0;
  const totalWithService = Math.max(0, subtotal + serviceFee + deliveryFee - comanda.discountAmount);
  const totalWithoutService = Math.max(0, subtotal + deliveryFee - comanda.discountAmount);

  const perPersonWithService = totalWithService / splitPeopleCount;
  const perPersonWithoutService = totalWithoutService / splitPeopleCount;

  const handleCopySplitSummary = () => {
    const text = `🥩 *${settings.name}* - Conta ${table.label} (${comanda.code})\n` +
      `👥 Total: ${formatCurrency(totalWithService)} (${comanda.items.length} itens)\n` +
      `💳 Dividido por ${splitPeopleCount} pessoas: *${formatCurrency(perPersonWithService)}* por pessoa (com 10%)\n` +
      (comanda.includeService ? `✨ Ou ${formatCurrency(perPersonWithoutService)} sem os 10%\n` : '') +
      `📱 RUC / SIPAP: ${settings.cnpj}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Resumo da divisão copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmTransferComanda = () => {
    if (!targetTableIdForTransfer) {
      showToast('Selecione a mesa de destino livre.', 'warning');
      return;
    }
    const res = transferComanda(table.id, targetTableIdForTransfer);
    if (res.success) {
      onClose();
    }
  };

  const handleConfirmTransferItems = () => {
    if (selectedItemIds.length === 0) {
      showToast('Selecione pelo menos um item para transferir.', 'warning');
      return;
    }
    if (!targetComandaIdForItems) {
      showToast('Selecione a comanda de destino.', 'warning');
      return;
    }
    const res = transferItems(comanda.id, targetComandaIdForItems, selectedItemIds);
    if (res.success) {
      onClose();
    }
  };

  const handleConfirmMerge = () => {
    if (!targetTableIdForMerge) {
      showToast('Selecione a mesa que receberá os pedidos unificados.', 'warning');
      return;
    }
    const res = mergeComandas(table.id, targetTableIdForMerge);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Operações de Conta · {table.label}
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                {comanda.code}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Cliente: {comanda.customerName} · {comanda.peopleCount} pax · Total:{' '}
              <strong className="text-amber-400 font-mono">{formatCurrency(comanda.total)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 bg-stone-950 border-b border-stone-800 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('SPLIT')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold transition-all ${
              activeTab === 'SPLIT'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span className="truncate">Dividir Conta</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSFER_TABLE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold transition-all ${
              activeTab === 'TRANSFER_TABLE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="truncate">Trocar Mesa</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSFER_ITEMS')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold transition-all ${
              activeTab === 'TRANSFER_ITEMS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">Mover Itens</span>
          </button>

          <button
            onClick={() => setActiveTab('MERGE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold transition-all ${
              activeTab === 'MERGE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Merge className="w-3.5 h-3.5" />
            <span className="truncate">Juntar Mesas</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: SPLIT BILL */}
          {activeTab === 'SPLIT' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300">Dividir a conta entre quantas pessoas?</span>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5, 6, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSplitPeopleCount(n)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                          splitPeopleCount === n
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-stone-900">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={splitPeopleCount}
                    onChange={(e) => setSplitPeopleCount(Number(e.target.value) || 1)}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono font-extrabold text-white text-sm bg-stone-900 px-3 py-1 rounded-lg border border-stone-800">
                    {splitPeopleCount} pessoas
                  </span>
                </div>
              </div>

              {/* Service Tax Switch */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                    Taxa de Serviço ({settings.serviceTaxPercentage}%):{' '}
                    <span className={comanda.includeService ? 'text-emerald-400' : 'text-stone-500'}>
                      {comanda.includeService ? `+${formatCurrency(serviceFee)} (Inclusa)` : 'Removida'}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Cobrança opcional para o cliente conforme a lei.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleServiceFee(comanda.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    comanda.includeService
                      ? 'bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {comanda.includeService ? 'Remover 10%' : 'Ativar 10%'}
                </button>
              </div>

              {/* Results Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400">
                    Com Serviço (10% incluso)
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {formatCurrency(perPersonWithService)}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    por pessoa ({formatCurrency(totalWithService)} no total)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-400">
                    Sem Serviço (Apenas Consumo)
                  </div>
                  <div className="text-2xl font-black text-stone-200 font-mono">
                    {formatCurrency(perPersonWithoutService)}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    por pessoa ({formatCurrency(totalWithoutService)} subtotal)
                  </div>
                </div>
              </div>

              {/* Copy / Share Button */}
              <button
                type="button"
                onClick={handleCopySplitSummary}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-all border border-stone-700"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? 'Copiado para WhatsApp!' : 'Copiar Resumo da Divisão para Clientes'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: TRANSFER COMANDA */}
          {activeTab === 'TRANSFER_TABLE' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs space-y-1 text-stone-400">
                <p className="font-semibold text-white">Mover comanda completa para outra mesa livre</p>
                <p>Todos os itens, consumos e dados do cliente serão transferidos para a nova mesa selecionada.</p>
              </div>

              {freeTables.length === 0 ? (
                <div className="text-center py-10 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-500">
                  Não há mesas livres no momento para transferir esta comanda.
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-300">
                    Escolha a mesa de destino livre:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {freeTables.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTargetTableIdForTransfer(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          targetTableIdForTransfer === t.id
                            ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                            : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                        }`}
                      >
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[10px] text-stone-500">{t.capacity} lugares livres</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransferComanda}
                  disabled={!targetTableIdForTransfer}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md"
                >
                  Confirmar Troca de Mesa
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSFER ITEMS */}
          {activeTab === 'TRANSFER_ITEMS' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs space-y-1 text-stone-400">
                <p className="font-semibold text-white">Transferir itens específicos para outra mesa</p>
                <p>Selecione quais itens deseja mover e qual comanda/mesa ocupada irá recebê-los.</p>
              </div>

              {otherOccupiedTables.length === 0 ? (
                <div className="text-center py-8 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-500">
                  Nenhuma outra mesa com comanda aberta no salão para receber itens.
                </div>
              ) : (
                <>
                  {/* Select Destination Table */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-300">
                      Mesa de Destino:
                    </label>
                    <select
                      value={targetComandaIdForItems || ''}
                      onChange={(e) => setTargetComandaIdForItems(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione a mesa de destino...</option>
                      {otherOccupiedTables.map((t) => (
                        <option key={t.id} value={t.currentComandaId}>
                          {t.label} ({t.customerName || 'Cliente'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Items Checkbox List */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                      <span>Selecione os itens a transferir:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedItemIds(
                            selectedItemIds.length === comanda.items.length
                              ? []
                              : comanda.items.map((i) => i.id)
                          )
                        }
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        {selectedItemIds.length === comanda.items.length ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-1.5 bg-stone-950 p-2 rounded-xl border border-stone-800">
                      {comanda.items.map((it) => {
                        const isSelected = selectedItemIds.includes(it.id);
                        return (
                          <label
                            key={it.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-600/20 border-amber-600/50 text-white'
                                : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItemIds((prev) => [...prev, it.id]);
                                  } else {
                                    setSelectedItemIds((prev) => prev.filter((id) => id !== it.id));
                                  }
                                }}
                                className="w-4 h-4 accent-amber-500 rounded"
                              />
                              <div>
                                <span className="font-semibold">
                                  {it.quantity}x {it.name}
                                </span>
                                {it.notes && (
                                  <span className="text-[10px] text-stone-400 block">Obs: {it.notes}</span>
                                )}
                              </div>
                            </div>

                            <span className="font-mono font-bold text-amber-400">
                              {formatCurrency(it.quantity * it.price)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransferItems}
                  disabled={selectedItemIds.length === 0 || !targetComandaIdForItems}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md"
                >
                  Transferir ({selectedItemIds.length}) Item(ns)
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MERGE COMANDAS */}
          {activeTab === 'MERGE' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs space-y-1 text-stone-400">
                <p className="font-semibold text-white">Unificar contas de duas mesas</p>
                <p>
                  Todos os itens e clientes desta mesa ({table.label}) serão transferidos para a mesa
                  escolhida. A mesa atual será liberada após a fusão.
                </p>
              </div>

              {otherOccupiedTables.length === 0 ? (
                <div className="text-center py-8 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-500">
                  Nenhuma outra mesa ocupada para unificar contas.
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-300">
                    Escolha a mesa principal que receberá a unificação:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {otherOccupiedTables.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTargetTableIdForMerge(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          targetTableIdForMerge === t.id
                            ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                            : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                        }`}
                      >
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[11px] text-stone-400">{t.customerName || 'Cliente'} ({t.peopleCount} pax)</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMerge}
                  disabled={!targetTableIdForMerge}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md"
                >
                  Confirmar Fusão de Contas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
