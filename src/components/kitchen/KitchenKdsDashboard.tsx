import React, { useState, useMemo, useEffect } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { PrepStation, OrderItemStatus, ComandaItem, MeatDoneness } from '../../types';
import { formatTime, getMeatDonenessLabel } from '../../utils/format';
import {
  Flame,
  ChefHat,
  Wine,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Bell,
  Volume2,
  VolumeX,
  Filter,
  Layers,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';

export const KitchenKdsDashboard: React.FC = () => {
  const { comandas, updateOrderItemStatus, settings, showToast } = useChurras();

  const [activeStation, setActiveStation] = useState<PrepStation | 'TODOS'>('GRELHA');
  const [statusFilter, setStatusFilter] = useState<'ATIVOS' | 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'TODOS'>('ATIVOS');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.enableSoundAlerts);
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every 10 seconds for real-time wait duration
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Collect all items across active comandas
  const allKitchenItems = useMemo(() => {
    const items: Array<ComandaItem & { comandaCustomerName?: string; comandaOrderType?: string }> = [];

    comandas
      .filter((c) => c.status === 'ABERTA' || c.status === 'CONTA_SOLICITADA')
      .forEach((c) => {
        c.items.forEach((item) => {
          items.push({
            ...item,
            comandaCustomerName: c.customerName,
            comandaOrderType: c.orderType,
          });
        });
      });

    return items;
  }, [comandas]);

  // Filter items by station & status
  const filteredItems = useMemo(() => {
    return allKitchenItems
      .filter((item) => {
        if (activeStation !== 'TODOS' && item.prepStation !== activeStation) {
          return false;
        }

        if (statusFilter === 'ATIVOS') {
          return item.status === 'PENDENTE' || item.status === 'EM_PREPARO';
        }
        if (statusFilter !== 'TODOS') {
          return item.status === statusFilter;
        }
        return item.status !== 'CANCELADO';
      })
      .sort((a, b) => {
        // Items waiting longest first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allKitchenItems, activeStation, statusFilter]);

  // Station counts
  const stationCounts = useMemo(() => {
    const activeOnly = allKitchenItems.filter((i) => i.status === 'PENDENTE' || i.status === 'EM_PREPARO');
    return {
      GRELHA: activeOnly.filter((i) => i.prepStation === 'GRELHA').length,
      COZINHA: activeOnly.filter((i) => i.prepStation === 'COZINHA').length,
      BAR: activeOnly.filter((i) => i.prepStation === 'BAR').length,
      TODOS: activeOnly.length,
    };
  }, [allKitchenItems]);

  const handleNextStatus = (item: ComandaItem) => {
    if (item.status === 'PENDENTE') {
      updateOrderItemStatus(item.id, 'EM_PREPARO');
      showToast(`${item.name} (${item.tableLabel}) colocado em preparo!`, 'info');
    } else if (item.status === 'EM_PREPARO') {
      updateOrderItemStatus(item.id, 'PRONTO');
      showToast(`${item.name} (${item.tableLabel}) está PRONTO para servir!`, 'success');
    } else if (item.status === 'PRONTO') {
      updateOrderItemStatus(item.id, 'ENTREGUE');
      showToast(`${item.name} entregue à mesa!`, 'info');
    }
  };

  const getWaitMinutes = (createdAt: string) => {
    const diffMs = now - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getDonenessColor = (doneness?: MeatDoneness) => {
    switch (doneness) {
      case 'SELANTE':
      case 'MAL_PASSADO':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'AO_PONTO_PARA_MAL':
      case 'AO_PONTO':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'AO_PONTO_PARA_BEM':
      case 'BEM_PASSADO':
        return 'bg-stone-700 text-stone-200 border-stone-600';
      default:
        return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* KDS Station Selector & Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-100">KDS - Painel de Produção & Brasa</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                  TEMPO REAL
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Controle de fila de grelha, cozinha quente e bar com alerta de tempo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                showToast(
                  !soundEnabled ? 'Alertas sonoros ativados.' : 'Alertas sonoros desativados.',
                  'info'
                );
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
              title={soundEnabled ? 'Silenciar avisos' : 'Ativar avisos'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
            </button>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          <button
            onClick={() => setActiveStation('GRELHA')}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              activeStation === 'GRELHA'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-orange-950/40'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Grelha / Brasa</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-xs font-extrabold">
              {stationCounts.GRELHA}
            </span>
          </button>

          <button
            onClick={() => setActiveStation('COZINHA')}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              activeStation === 'COZINHA'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-950/40'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Cozinha / Buffet</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-xs font-extrabold">
              {stationCounts.COZINHA}
            </span>
          </button>

          <button
            onClick={() => setActiveStation('BAR')}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              activeStation === 'BAR'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-950/40'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wine className="w-4 h-4 text-cyan-400" />
              <span>Bar & Chopp</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-xs font-extrabold">
              {stationCounts.BAR}
            </span>
          </button>

          <button
            onClick={() => setActiveStation('TODOS')}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              activeStation === 'TODOS'
                ? 'bg-stone-100 text-stone-950 shadow-lg'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Todas Estações</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-stone-800 text-xs font-extrabold text-stone-200">
              {stationCounts.TODOS}
            </span>
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-stone-800">
          <span className="text-xs text-stone-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar Status:
          </span>
          {(['ATIVOS', 'PENDENTE', 'EM_PREPARO', 'PRONTO', 'TODOS'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-stone-700 text-white'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200'
              }`}
            >
              {st === 'ATIVOS'
                ? 'Em Fila / Preparando'
                : st === 'PENDENTE'
                ? 'Aguardando Grelha'
                : st === 'EM_PREPARO'
                ? 'Na Brasa'
                : st === 'PRONTO'
                ? 'Prontos p/ Servir'
                : 'Histórico Completo'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-500">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/40 mb-3" />
          <h3 className="text-base font-bold text-stone-300">Grelha e Produção em dia!</h3>
          <p className="text-xs text-stone-500 mt-1">
            Nenhum pedido pendente nesta praça de preparo no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const waitMins = getWaitMinutes(item.createdAt);
            const isLate = waitMins >= 15;
            const isWarning = waitMins >= 10 && waitMins < 15;

            return (
              <div
                key={item.id}
                className={`bg-stone-900 border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition ${
                  item.status === 'PRONTO'
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : item.status === 'EM_PREPARO'
                    ? 'border-orange-500/60 bg-orange-950/10'
                    : isLate
                    ? 'border-red-500/70 shadow-red-950/30'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  {/* Card Header: Table + Time badge */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-stone-100 text-base">
                          {item.tableLabel}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {item.comandaCode}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 block">
                        Garçom: {item.waiterName}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                        isLate
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{waitMins} min</span>
                    </div>
                  </div>

                  {/* Item Description */}
                  <div className="py-3.5 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 font-mono font-extrabold text-stone-200 text-sm">
                        {item.quantity}x
                      </span>
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-100 text-sm leading-tight">
                          {item.name}
                        </h4>
                        {item.weightInKg ? (
                          <span className="text-xs text-amber-400 font-mono block mt-0.5">
                            Peso balança: {item.weightInKg.toFixed(3)} kg
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Meat Doneness Badge */}
                    {item.doneness && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getDonenessColor(
                          item.doneness
                        )}`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Ponto: {getMeatDonenessLabel(item.doneness)}</span>
                      </div>
                    )}

                    {/* Custom Notes */}
                    {item.notes && (
                      <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80 text-xs text-amber-300 font-medium">
                        <span className="text-stone-500 block text-[10px] uppercase font-bold">
                          Observação:
                        </span>
                        "{item.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-3 border-t border-stone-800">
                  {item.status === 'PENDENTE' && (
                    <button
                      onClick={() => handleNextStatus(item)}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-950/40 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Iniciar Preparo na Brasa
                    </button>
                  )}

                  {item.status === 'EM_PREPARO' && (
                    <button
                      onClick={() => handleNextStatus(item)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Concluir (Pronto p/ Servir)
                    </button>
                  )}

                  {item.status === 'PRONTO' && (
                    <button
                      onClick={() => handleNextStatus(item)}
                      className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Marcar como Entregue à Mesa
                    </button>
                  )}

                  {item.status === 'ENTREGUE' && (
                    <div className="text-center text-xs text-stone-500 py-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
                      Entregue
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
