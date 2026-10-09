import React, { useState } from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { OrderType } from '../../types';
import { X, Bike, ShoppingBag, MapPin, Phone, User, DollarSign } from 'lucide-react';

interface DeliveryModalProps {
  onClose: () => void;
  onCreated: (comandaId: string) => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({ onClose, onCreated }) => {
  const { openDeliveryComanda, currentUser } = useChurras();

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(15.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const newCmd = openDeliveryComanda({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
      deliveryFee: orderType === 'DELIVERY' ? deliveryFee : 0,
      orderType,
      waiterId: currentUser?.id,
    });

    onCreated(newCmd.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bike className="w-5 h-5 text-amber-500" />
              Novo Pedido · Delivery ou Balcão
            </h3>
            <p className="text-xs text-stone-400">
              Venda externa ou retirada direta no balcão da churrascaria
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Order Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-stone-950 rounded-xl border border-stone-800 gap-1">
            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
                orderType === 'DELIVERY'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Entrega (Delivery)</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('RETIRADA')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
                orderType === 'RETIRADA'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Retirada Balcão</span>
            </button>
          </div>

          <div>
            <label className="block font-semibold text-stone-300 mb-1">
              Nome do Cliente:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="Ex: Mariana Lima"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-300 mb-1">
              Telefone / WhatsApp:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="(11) 98877-6655"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {orderType === 'DELIVERY' && (
            <>
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Endereço de Entrega Completo:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Rua, número, apto, bairro..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Taxa de Entrega (R$):
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
            >
              Abrir Comanda {orderType === 'DELIVERY' ? 'Delivery' : 'Balcão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
