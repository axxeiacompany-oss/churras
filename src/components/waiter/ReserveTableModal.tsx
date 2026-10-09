import React, { useState } from 'react';
import { Table } from '../../types';
import { useChurras } from '../../context/ChurrasContext';
import { X, Calendar, Clock, User, Phone, FileText, CheckCircle2, Trash2, UtensilsCrossed } from 'lucide-react';

interface ReserveTableModalProps {
  table: Table;
  onClose: () => void;
  onStartAttendance: (table: Table) => void;
}

export const ReserveTableModal: React.FC<ReserveTableModalProps> = ({
  table,
  onClose,
  onStartAttendance,
}) => {
  const { reserveTable, cancelReservation } = useChurras();

  const isReserved = table.status === 'RESERVADA';

  const [customerName, setCustomerName] = useState<string>(
    table.reservationCustomerName || table.customerName || ''
  );
  const [phone, setPhone] = useState<string>(table.reservationPhone || '');
  const [time, setTime] = useState<string>(table.reservationTime || '20:00');
  const [peopleCount, setPeopleCount] = useState<number>(table.peopleCount || table.capacity || 4);
  const [notes, setNotes] = useState<string>(table.reservationNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    reserveTable(table.id, {
      customerName: customerName.trim(),
      phone: phone.trim() || undefined,
      time,
      peopleCount,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleCancelReservation = () => {
    if (confirm(`Deseja realmente cancelar a reserva da ${table.label}?`)) {
      cancelReservation(table.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-100 text-sm">
                {isReserved ? `Reserva: ${table.label}` : `Nova Reserva: ${table.label}`}
              </h3>
              <p className="text-xs text-stone-400">Capacidade: {table.capacity} pessoas</p>
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
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Nome do Responsável *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Família Silveira"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  placeholder="(11) 9..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Horário Previsto *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Quantidade de Pessoas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={table.capacity + 4}
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                className="w-24 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-stone-400">
                (Máximo sugerido: {table.capacity + 2} pessoas)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Observações / Comemoração
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Aniversário, prefere mesa perto da varanda"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-stone-800 space-y-2">
            {isReserved ? (
              <>
                <button
                  type="button"
                  onClick={() => onStartAttendance(table)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Iniciar Atendimento Agora
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Atualizar Dados
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReservation}
                    className="py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancelar Reserva
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
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
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Reserva
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
