import { MeatDoneness, PaymentMethod, UserRole } from '../types';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const getMinutesElapsed = (isoString: string): number => {
  const start = new Date(isoString).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 60000));
};

export const getMeatDonenessLabel = (doneness?: MeatDoneness): string => {
  switch (doneness) {
    case 'MAL_PASSADO':
      return 'Mal Passado (sangrando)';
    case 'AO_PONTO_PARA_MAL':
      return 'Ao Ponto p/ Mal (vermelho vivo)';
    case 'AO_PONTO':
      return 'Ao Ponto (rosado ao centro)';
    case 'AO_PONTO_PARA_BEM':
      return 'Ao Ponto p/ Bem';
    case 'BEM_PASSADO':
      return 'Bem Passado (sem rosa)';
    default:
      return 'Padrão da Casa';
  }
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return 'Admin / Gerente';
    case 'CAIXA':
      return 'Operador de Caixa';
    case 'GARCOM':
      return 'Garçom / Salão';
    case 'COZINHA':
      return 'Churrasqueiro / KDS';
  }
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'DINHEIRO':
      return 'Dinheiro em Espécie';
    case 'PIX':
      return 'PIX Instantâneo';
    case 'DEBITO':
      return 'Cartão de Débito';
    case 'CREDITO':
      return 'Cartão de Crédito';
    case 'VR_VA':
      return 'Vale Refeição / Alimentação';
  }
};
