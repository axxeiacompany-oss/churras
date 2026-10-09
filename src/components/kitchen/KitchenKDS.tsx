import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { OrderItem, PrepStation, MeatDoneness } from '../../types';
import { formatTime, getMinutesElapsed, getMeatDonenessLabel } from '../../utils/format';
import {
  Flame,
  ChefHat,
  Coffee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Utensils,
  Filter,
} from 'lucide-react';

export const KitchenKDS: React.FC = () => {
  const { comandas, updateOrderItemStatus, currentUser } = useChurras();
  const [stationFilter, setStationFilter] = useState<PrepStation | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  if (!currentUser) return null;

  // Collect all items across open and pending comandas
  const allItems: OrderItem[] = comandas
    .filter((c) => c.status !== 'CANCELADA')
    .flatMap((c) => c.items);

  const activeItems = allItems.filter((i) => i.status === 'PENDENTE' || i.status === 'EM_PREPARO');
  const finishedItems = allItems.filter((i) => i.status === 'PRONTO' || i.status === 'ENTREGUE');

  const filteredItems = (statusFilter === 'ACTIVE' ? activeItems : finishedItems).filter((item) => {
    if (stationFilter === 'ALL') return true;
    return item.prepStation === stationFilter;
  });

  // Sort items: oldest first for active, newest first for history
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (statusFilter === 'ACTIVE') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return new Date(b.readyAt || b.createdAt).getTime() - new Date(a.readyAt || a.createdAt).getTime();
  });

  // Tally counts of meats on the grill right now
  const grillItemsSummary = activeItems
    .filter((i) => i.prepStation === 'GRELHA')
    .reduce<Record<string, number>>((acc, curr) => {
      acc[curr.name] = (acc[curr.name] || 0) + curr.quantity;
      return acc;
    }, {});

  const getDonenessBadgeClass = (doneness?: MeatDoneness) => {
    switch (doneness) {
      case 'MAL_PASSADO':
        return 'bg-red-950/80 text-red-300 border-red-700 font-bold';
      case 'AO_PONTO_PARA_MAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-700 font-bold';
      case 'AO_PONTO':
        return 'bg-amber-950/80 text-amber-300 border-amber-700 font-bold';
      case 'AO_PONTO_PARA_BEM':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-700 font-bold';
      case 'BEM_PASSADO':
        return 'bg-stone-800 text-stone-200 border-stone-600 font-bold';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* KDS Header Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                KDS · Monitor da Churrasqueira & Cozinha
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800/60 font-semibold">
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Operador atual: <strong className="text-white">{currentUser.name}</strong> · Controle de cortes, pontos da carne e expedição.
            </p>
          </div>

          {/* Station Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setStationFilter('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stationFilter === 'ALL'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Todas ({activeItems.length})
              </button>
              <button
                onClick={() => setStationFilter('GRELHA')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stationFilter === 'GRELHA'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                Churrasqueira ({activeItems.filter((i) => i.prepStation === 'GRELHA').length})
              </button>
              <button
                onClick={() => setStationFilter('COZINHA')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stationFilter === 'COZINHA'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                Cozinha ({activeItems.filter((i) => i.prepStation === 'COZINHA').length})
              </button>
              <button
                onClick={() => setStationFilter('BAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stationFilter === 'BAR'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-blue-300" />
                Bar ({activeItems.filter((i) => i.prepStation === 'BAR').length})
              </button>
            </div>

            {/* Active vs History */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-stone-800 text-white border border-stone-700'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Pendentes ({activeItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('HISTORY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'HISTORY'
                    ? 'bg-stone-800 text-white border border-stone-700'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Prontos Recentes ({finishedItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Meat Cuts summary bar on top */}
        {Object.keys(grillItemsSummary).length > 0 && statusFilter === 'ACTIVE' && (
          <div className="mt-4 pt-3.5 border-t border-stone-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Flame className="w-3.5 h-3.5" /> Na Brasa Agora:
            </span>
            {Object.entries(grillItemsSummary).map(([meat, qty]) => (
              <div
                key={meat}
                className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-md border border-stone-800 text-xs text-stone-200"
              >
                <span className="font-extrabold text-amber-400">{qty}x</span>
                <span className="truncate max-w-[150px]">{meat}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Grid */}
      {sortedItems.length === 0 ? (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {statusFilter === 'ACTIVE'
              ? 'Tudo em dia na estação!'
              : 'Nenhum pedido finalizado ainda.'}
          </h3>
          <p className="text-xs text-stone-400">
            {statusFilter === 'ACTIVE'
              ? 'Nenhum pedido aguardando preparo no momento.'
              : 'Conforme pratos forem marcados como prontos, eles aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedItems.map((item) => {
            const minutes = getMinutesElapsed(item.createdAt);
            let timeColor = 'text-emerald-400 border-emerald-800/40 bg-emerald-950/40';
            if (minutes >= 10 && minutes < 20) {
              timeColor = 'text-amber-400 border-amber-800/40 bg-amber-950/40';
            } else if (minutes >= 20) {
              timeColor = 'text-red-400 border-red-800/60 bg-red-950/60 animate-pulse';
            }

            const isGrill = item.prepStation === 'GRELHA';

            return (
              <div
                key={item.id}
                className={`bg-stone-900 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                  item.status === 'EM_PREPARO'
                    ? 'border-orange-500/80 shadow-orange-950/20'
                    : item.status === 'PRONTO'
                    ? 'border-emerald-600/60 bg-stone-900/90'
                    : item.status === 'ENTREGUE'
                    ? 'border-stone-800 opacity-60'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Header card: Table + Time */}
                <div className="px-4 py-3 bg-stone-950/80 border-b border-stone-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">
                        {item.tableLabel}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {item.comandaCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Garçom: <span className="text-stone-300 font-medium">{item.waiterName}</span>
                    </div>
                  </div>

                  {/* Wait Time Timer */}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${timeColor}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{minutes} min</span>
                  </div>
                </div>

                {/* Body: Dish name + Doneness + Notes */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-xl font-black text-amber-500 font-mono">
                      {item.quantity}x
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          {isGrill ? (
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                          ) : (
                            <Utensils className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          {item.prepStation}
                        </span>
                        <span>·</span>
                        <span>Lançado às {formatTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meat Doneness Highlight */}
                  {item.doneness && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${getDonenessBadgeClass(
                        item.doneness
                      )}`}
                    >
                      <span className="uppercase text-[10px] tracking-wider text-stone-400">
                        Ponto da Carne:
                      </span>
                      <span className="font-bold text-xs">
                        {getMeatDonenessLabel(item.doneness)}
                      </span>
                    </div>
                  )}

                  {/* Notes / Observações */}
                  {item.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-amber-300">Obs:</strong> {item.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-stone-950/90 border-t border-stone-800">
                  {item.status === 'PENDENTE' && (
                    <button
                      onClick={() => updateOrderItemStatus(item.id, 'EM_PREPARO')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md active:scale-98"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Preparo na Grelha</span>
                    </button>
                  )}

                  {item.status === 'EM_PREPARO' && (
                    <button
                      onClick={() => updateOrderItemStatus(item.id, 'PRONTO')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 animate-pulse"
                    >
                      <Check className="w-4 h-4" />
                      <span>Marcar como Pronto! (Notificar)</span>
                    </button>
                  )}

                  {item.status === 'PRONTO' && (
                    <button
                      onClick={() => updateOrderItemStatus(item.id, 'ENTREGUE')}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-semibold transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar como Entregue à Mesa</span>
                    </button>
                  )}

                  {item.status === 'ENTREGUE' && (
                    <div className="text-center text-xs text-stone-500 py-1 font-medium">
                      Entregue ao garçom
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
