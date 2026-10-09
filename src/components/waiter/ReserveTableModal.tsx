import React, { useState } from 'react';
import { Table } from '../../types';
import { useChurras } from '../../context/ChurrasContext';
import { X, Calendar, Phone, User, Clock, CheckCircle2, Trash2 } from 'lucide-react';

interface ReserveTableModalProps {
  table: Table;
  onClose: () => void;
  onStartAttendance?: (table: Table) => void;
}

export const ReserveTableModal: React.FC<ReserveTableModalProps> = ({
  table,
  onClose,
  onStartAttendance,
}) => {
  const { reserveTable, cancelReservation } = useChurras();

  const isAlreadyReserved = table.status === 'RESERVADA';

  const [customerName, setCustomerName] = useState<string>(
    table.reservationCustomerName || table.customerName || ''
  );
  const [phone, setPhone] = useState<string>(table.reservationPhone || '');
  const [time, setTime] = useState<string>(table.reservationTime || '20:00');

  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    reserveTable(table.id, customerName.trim(), phone.trim() || undefined, time.trim() || undefined);
    onClose();
  };

  const handleCancel = () => {
    cancelReservation(table.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              {isAlreadyReserved ? `Reserva da ${table.label}` : `Reservar ${table.label}`}
            </h3>
            <p className="text-xs text-stone-400">
              Capacidade: {table.capacity} lugares
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAlreadyReserved ? (
          <div className="mt-4 space-y-4 text-xs">
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-400">Cliente da Reserva:</span>
                <strong className="text-white font-bold">{table.reservationCustomerName || table.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Telefone / Contato:</span>
                <span className="text-stone-200">{table.reservationPhone || 'Não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Horário Previsto:</span>
                <span className="text-amber-400 font-bold">{table.reservationTime || 'A definir'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onStartAttendance && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartAttendance(table);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clientes Chegaram (Iniciar Atendimento)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-red-950/60 hover:text-red-400 text-stone-300 font-semibold border border-stone-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancelar Reserva (Liberar Mesa)</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveReservation} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                Nome do Cliente para a Reserva:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Família Becker ou Dr. Fernando"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Telefone / WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Horário Previsto:
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

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
                Confirmar Reserva
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
