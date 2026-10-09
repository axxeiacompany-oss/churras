import React from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { UserRole } from '../../types';
import { ShieldAlert, Wallet, UtensilsCrossed, ChefHat, Info } from 'lucide-react';

interface RoleSelectorBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const RoleSelectorBar: React.FC<RoleSelectorBarProps> = () => {
  const { currentUser, switchUser, employees } = useChurras();

  if (!currentUser) return null;

  const roles: Array<{
    role: UserRole;
    label: string;
    description: string;
    icon: React.ElementType;
    badge: string;
  }> = [
    {
      role: 'ADMIN',
      label: 'Admin (Dono/Gerente)',
      description: 'Acesso total: faturamento, equipe, cardápio e fluxo de caixa',
      icon: ShieldAlert,
      badge: 'Total',
    },
    {
      role: 'CAIXA',
      label: 'Caixa (PDV / Fechamento)',
      description: 'Abre/fecha caixa, recebe pagamentos, sangrias e suprimentos',
      icon: Wallet,
      badge: 'Operação',
    },
    {
      role: 'GARCOM',
      label: 'Garçom (Salão & Mesas)',
      description: 'Abre comandas, lança carnes e pedidos, vê suas mesas',
      icon: UtensilsCrossed,
      badge: 'Atendimento',
    },
  ];

  const handleSelectRole = (targetRole: UserRole) => {
    // Find the first active employee with this role
    const matchingEmp = employees.find((e) => e.role === targetRole && e.active) || employees.find((e) => e.role === targetRole);
    if (matchingEmp) {
      switchUser(matchingEmp.id);
    }
  };

  return (
    <div className="bg-stone-900/90 border-b border-stone-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span>Alterne o perfil para testar as permissões de cada setor:</span>
        </div>

        {/* Roles pills / buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full md:w-auto">
          {roles.map((r) => {
            const isSelected = currentUser.role === r.role;
            const Icon = r.icon;

            return (
              <button
                key={r.role}
                onClick={() => handleSelectRole(r.role)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50'
                    : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-700/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                <span className="truncate">{r.label.split(' ')[0]}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-normal ml-auto ${
                    isSelected ? 'bg-amber-700 text-amber-100' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  {r.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
