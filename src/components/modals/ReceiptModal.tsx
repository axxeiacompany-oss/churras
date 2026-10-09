import React from 'react';
import { Comanda, RestaurantSettings } from '../../types';
import { formatCurrency, formatTime, getPaymentMethodLabel } from '../../utils/format';
import { Printer, X, CheckCircle, Receipt as ReceiptIcon } from 'lucide-react';

interface ReceiptModalProps {
  comanda: Comanda;
  settings: RestaurantSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  comanda,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const perPerson =
    comanda.peopleCount > 0 ? comanda.total / comanda.peopleCount : comanda.total;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
            <ReceiptIcon className="w-4 h-4 text-amber-500" />
            <span>Extrato de Conferência de Mesa</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 bg-amber-50 text-stone-900 font-mono text-xs select-all shadow-inner print:p-0 print:bg-white print:m-0">
          <div className="text-center pb-3 border-b border-dashed border-stone-400">
            <h2 className="font-extrabold text-base tracking-tight uppercase">
              {settings.name}
            </h2>
            <div className="text-[11px] text-stone-600 mt-0.5">CNPJ: {settings.cnpj}</div>
            <div className="text-[10px] text-stone-600">{settings.address}</div>
            <div className="text-[10px] text-stone-600">Tel: {settings.phone}</div>
          </div>

          <div className="py-2.5 border-b border-dashed border-stone-400 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>COMANDA: {comanda.code}</span>
              <span className="font-bold">{comanda.tableLabel}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Garçom: {comanda.waiterName}</span>
              <span>Pax: {comanda.peopleCount} pessoas</span>
            </div>
            {comanda.customerName && (
              <div className="text-stone-600">Cliente: {comanda.customerName}</div>
            )}
            <div className="flex justify-between text-stone-500 text-[10px] pt-1">
              <span>Abertura: {formatTime(comanda.openedAt)}</span>
              <span>Fechamento: {formatTime(comanda.closedAt || new Date().toISOString())}</span>
            </div>
          </div>

          {/* Item details */}
          <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase">
              <span>Item / Descrição</span>
              <span>Qtd x Unit = Total</span>
            </div>

            {comanda.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2 max-w-[220px]">
                  <div>{item.name}</div>
                  {item.doneness && (
                    <div className="text-[10px] text-stone-600 italic">
                      Pt: {item.doneness}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[10px] text-stone-500">Obs: {item.notes}</div>
                  )}
                </div>
                <div className="text-right whitespace-nowrap font-medium">
                  {item.quantity}x {formatCurrency(item.price)}
                  <div className="font-bold">
                    {formatCurrency(item.quantity * item.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal Itens:</span>
              <span>{formatCurrency(comanda.subtotal)}</span>
            </div>

            {comanda.includeService && (
              <div className="flex justify-between text-stone-700">
                <span>Serviço Opcional ({settings.serviceTaxPercentage}%):</span>
                <span>+{formatCurrency(comanda.serviceFee)}</span>
              </div>
            )}

            {comanda.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Desconto Aplicado:</span>
                <span>-{formatCurrency(comanda.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-stone-300">
              <span>TOTAL A PAGAR:</span>
              <span>{formatCurrency(comanda.total)}</span>
            </div>

            {comanda.peopleCount > 1 && (
              <div className="flex justify-between text-[11px] text-stone-600 bg-stone-200/60 p-1.5 rounded mt-1.5">
                <span>Rateio ({comanda.peopleCount} pessoas):</span>
                <span className="font-bold">{formatCurrency(perPerson)} / pessoa</span>
              </div>
            )}
          </div>

          {/* Payments breakdown */}
          {comanda.payments.length > 0 && (
            <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
              <div className="font-bold uppercase text-[10px] text-stone-500">
                Pagamentos Recebidos:
              </div>
              {comanda.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{getPaymentMethodLabel(p.method)}:</span>
                  <span className="font-bold">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 text-center text-[10px] text-stone-500 space-y-0.5">
            <div>*** DOCUMENTO NÃO FISCAL ***</div>
            <div>Agradecemos a preferência! Volte sempre!</div>
            <div>www.churrascariabrasaefogo.com.br</div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{comanda.status === 'PAGA' ? 'Comanda Paga & Finalizada' : 'Conferência pré-pagamento'}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Recibo</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
