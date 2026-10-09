import React from 'react';
import { useChurras } from '../../context/ChurrasContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useChurras();

  if (!toast) return null;

  let Icon = Info;
  let bgClass = 'bg-stone-900 border-stone-700 text-stone-100';

  if (toast.type === 'success') {
    Icon = CheckCircle2;
    bgClass = 'bg-stone-900 border-emerald-500/50 text-white shadow-emerald-950/40';
  } else if (toast.type === 'warning') {
    Icon = AlertCircle;
    bgClass = 'bg-stone-900 border-amber-500/50 text-white shadow-amber-950/40';
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-md ${bgClass}`}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 ${
            toast.type === 'success'
              ? 'text-emerald-400'
              : toast.type === 'warning'
              ? 'text-amber-400'
              : 'text-sky-400'
          }`}
        />
        <div className="text-sm font-medium">{toast.message}</div>
      </div>
    </div>
  );
};
