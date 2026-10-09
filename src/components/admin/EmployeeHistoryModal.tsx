import React from 'react';
import { Employee, Comanda, RestaurantSettings } from '../../types';
import { formatCurrency, formatTime, getRoleLabel, getPaymentMethodLabel } from '../../utils/format';
import {
  X,
  TrendingUp,
  Target,
  UtensilsCrossed,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  FileText,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';

interface EmployeeHistoryModalProps {
  employee: Employee;
  comandas: Comanda[];
  settings: RestaurantSettings;
  onClose: () => void;
  onViewReceipt: (comanda: Comanda) => void;
}

export const EmployeeHistoryModal: React.FC<EmployeeHistoryModalProps> = ({
  employee,
  comandas,
  settings,
  onClose,
  onViewReceipt,
}) => {
  // Filter all comandas served by this employee
  const employeeComandas = comandas.filter(
    (c) => c.waiterId === employee.id && c.status !== 'CANCELADA'
  );

  const paidComandas = employeeComandas.filter((c) => c.status === 'PAGA');
  const activeComandas = employeeComandas.filter(
    (c) => c.status === 'ABERTA' || c.status === 'CONTA_SOLICITADA'
  );

  // Financial aggregates
  const totalSales = paidComandas.reduce((acc, c) => acc + c.total, 0);
  const totalCommission = totalSales * ((employee.commissionRate || 0) / 100);
  const totalPeopleServed = paidComandas.reduce((acc, c) => acc + c.peopleCount, 0);
  const avgTicket = paidComandas.length > 0 ? totalSales / paidComandas.length : 0;

  // Monthly target calculation
  const target = employee.monthlyTarget || 25000;
  const targetProgress = Math.min(100, Math.round((totalSales / target) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-stone-950 border-b border-stone-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600/30 to-stone-900 border-2 border-amber-500/50 text-amber-300 font-bold text-xl flex items-center justify-center shadow-md tracking-wider">
              {employee.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{employee.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                  {getRoleLabel(employee.role)}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    employee.active
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {employee.active ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>

              {/* Employee Metadata Grid */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 mt-2">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-stone-500" /> C.I. / Doc: {employee.cpf || 'Não informado'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-500" /> {employee.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-500" /> {employee.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" /> Admissão:{' '}
                  {employee.admissionDate ? new Date(employee.admissionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Vendas Totais
              </div>
              <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
                {formatCurrency(totalSales)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {paidComandas.length} comandas finalizadas
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Gorjetas / Comissão
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                {formatCurrency(totalCommission)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                Taxa de {employee.commissionRate}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Mesas Atendidas
              </div>
              <div className="text-xl font-extrabold text-white font-mono mt-0.5">
                {employeeComandas.length}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {totalPeopleServed} clientes servidos
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Salário Base
              </div>
              <div className="text-xl font-extrabold text-stone-200 font-mono mt-0.5">
                {formatCurrency(employee.baseSalary || 0)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                Remuneração fixa mensal
              </div>
            </div>
          </div>

          {/* Monthly Target Progress */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-stone-200">
                <Target className="w-4 h-4 text-amber-500" />
                <span>Meta Mensal de Vendas: {formatCurrency(target)}</span>
              </div>
              <div className="font-mono text-stone-400">
                Atingido: <strong className="text-amber-400">{formatCurrency(totalSales)}</strong> ({targetProgress}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  targetProgress >= 100
                    ? 'bg-emerald-500'
                    : targetProgress >= 70
                    ? 'bg-amber-500'
                    : 'bg-orange-600'
                }`}
                style={{ width: `${targetProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-stone-500">
              <span>Falta para a meta: {formatCurrency(Math.max(0, target - totalSales))}</span>
              {targetProgress >= 100 && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Meta Atingida com Sucesso!
                </span>
              )}
            </div>
          </div>

          {/* Sales & Orders History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                Histórico de Vendas & Mesas Atendidas ({employeeComandas.length})
              </h4>
              <span className="text-xs text-stone-500">
                {activeComandas.length} ativas agora · {paidComandas.length} finalizadas
              </span>
            </div>

            {employeeComandas.length === 0 ? (
              <div className="text-center py-10 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-500">
                Nenhum histórico de vendas registrado para este colaborador até o momento.
              </div>
            ) : (
              <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-800">
                      <tr>
                        <th className="p-3">Data / Hora</th>
                        <th className="p-3">Comanda / Mesa</th>
                        <th className="p-3">Cliente / Pax</th>
                        <th className="p-3">Total Venda</th>
                        <th className="p-3">Comissão ({employee.commissionRate}%)</th>
                        <th className="p-3">Formas de Pagamento</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Recibo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 text-stone-300">
                      {employeeComandas.map((cmd) => {
                        const commVal = cmd.total * ((employee.commissionRate || 0) / 100);

                        return (
                          <tr key={cmd.id} className="hover:bg-stone-900/50 transition-colors">
                            <td className="p-3 whitespace-nowrap text-[11px] text-stone-400">
                              {formatTime(cmd.openedAt)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-bold text-white">{cmd.tableLabel}</span>
                              <span className="ml-1.5 text-[10px] font-mono text-amber-400">
                                {cmd.code}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-stone-200">{cmd.customerName || 'Cliente'}</div>
                              <div className="text-[10px] text-stone-500">{cmd.peopleCount} pax</div>
                            </td>
                            <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                              {formatCurrency(cmd.total)}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                              {formatCurrency(commVal)}
                            </td>
                            <td className="p-3 text-[11px] text-stone-400">
                              {cmd.payments.length > 0
                                ? cmd.payments.map((p) => getPaymentMethodLabel(p.method)).join(', ')
                                : 'Em aberto'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  cmd.status === 'PAGA'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : cmd.status === 'CONTA_SOLICITADA'
                                    ? 'bg-yellow-950 text-yellow-400 animate-pulse'
                                    : 'bg-amber-950 text-amber-400'
                                }`}
                              >
                                {cmd.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => onViewReceipt(cmd)}
                                title="Visualizar Cupom da Venda"
                                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
