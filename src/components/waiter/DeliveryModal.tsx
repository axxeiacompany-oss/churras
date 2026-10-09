import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { X, Bike, ShoppingBag, User, Phone, MapPin, DollarSign, Plus } from 'lucide-react';

interface DeliveryModalProps {
  onClose: () => void;
  onCreated: (comandaId: string) => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({ onClose, onCreated }) => {
  const { openDeliveryComanda } = useChurras();

  const [orderType, setOrderType] = useState<'DELIVERY' | 'BALCAO'>('DELIVERY');
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<string>('12.00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const newId = openDeliveryComanda({
      customerName: customerName.trim(),
      customerPhone: phone.trim() || undefined,
      deliveryAddress: orderType === 'DELIVERY' ? address.trim() : undefined,
      deliveryFee: orderType === 'DELIVERY' ? parseFloat(deliveryFee) || 0 : 0,
      orderType,
    });

    onCreated(newId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              {orderType === 'DELIVERY' ? <Bike className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-stone-100 text-sm">Novo Pedido Externo</h3>
              <p className="text-xs text-stone-400">Delivery em domicílio ou retirada rápida no balcão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Order Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                orderType === 'DELIVERY'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bike className="w-4 h-4" />
              Delivery (Entrega)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('BALCAO')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                orderType === 'BALCAO'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Retirada Balcão
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Nome do Cliente *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Amanda Ferreira"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {orderType === 'DELIVERY' && (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Endereço Completo de Entrega *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, complemento, bairro"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Taxa de Entrega (₲)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-stone-800 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition"
            >
              <Plus className="w-4 h-4" />
              Criar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
