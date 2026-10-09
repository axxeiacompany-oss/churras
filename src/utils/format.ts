import { UserRole, PaymentMethod, MeatDoneness } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
};

export const GUARANI_EXCHANGE_RATE = 1400; // 1 BRL = 1.400 PYG (Guaranis)

export const formatGuarani = (amountInBrl: number, exchangeRate = GUARANI_EXCHANGE_RATE): string => {
  const guaraniVal = Math.round((amountInBrl || 0) * exchangeRate);
  return `₲ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(guaraniVal)}`;
};

export const formatCurrencyDual = (
  amountInBrl: number,
  currency: 'BRL' | 'GUARANI' = 'BRL',
  exchangeRate = GUARANI_EXCHANGE_RATE
): string => {
  if (currency === 'GUARANI') {
    return formatGuarani(amountInBrl, exchangeRate);
  }
  return formatCurrency(amountInBrl);
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return '--/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '--/--/----';
  }
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return 'Administrador (Gerência)';
    case 'CAIXA':
      return 'Operador de Caixa';
    case 'GARCOM':
      return 'Garçom (Salão)';
    case 'COZINHA':
      return 'Cozinha / Churrasqueiro';
    default:
      return role;
  }
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'DINHEIRO':
      return 'Dinheiro';
    case 'CREDITO':
      return 'Cartão de Crédito';
    case 'DEBITO':
      return 'Cartão de Débito';
    case 'PIX':
      return 'PIX Instantâneo';
    case 'VR_VA':
      return 'Vale Refeição / Alimentação';
    default:
      return method;
  }
};

export const getMeatDonenessLabel = (doneness?: MeatDoneness): string => {
  switch (doneness) {
    case 'SELANTE':
      return 'Selada (Quase Crua)';
    case 'MAL_PASSADO':
      return 'Mal Passada';
    case 'AO_PONTO_PARA_MAL':
      return 'Ao Ponto p/ Mal';
    case 'AO_PONTO':
      return 'Ao Ponto';
    case 'AO_PONTO_PARA_BEM':
      return 'Ao Ponto p/ Bem';
    case 'BEM_PASSADO':
      return 'Bem Passada';
    default:
      return 'Padrão da Casa';
  }
};
