import { UserRole, PaymentMethod, MeatDoneness } from '../types';

/**
 * Formatação oficial para a moeda do Paraguai: Guaraní (₲ / PYG / Gs.)
 * O Guaraní não utiliza casas decimais (centavos) e tem separador de milhar com ponto.
 * Exemplo: ₲ 210.000 | ₲ 1.450.000
 */
export const formatCurrency = (amount: number): string => {
  const rounded = Math.round(amount || 0);
  return `₲ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(rounded)}`;
};

export const GUARANI_EXCHANGE_RATE = 1;

export const formatGuarani = (amount: number): string => {
  return formatCurrency(amount);
};

export const formatCurrencyDual = (
  amount: number,
  _currency?: string,
  _exchangeRate?: number
): string => {
  return formatCurrency(amount);
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('es-PY', {
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
    return d.toLocaleDateString('es-PY');
  } catch {
    return '--/--/----';
  }
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return 'Administrador (Gerencia)';
    case 'CAIXA':
      return 'Cajero (Operador de Caja)';
    case 'GARCOM':
      return 'Mozo (Salón)';
    case 'COZINHA':
      return 'Cocina / Parrillero (KDS)';
    default:
      return role;
  }
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'DINHEIRO':
      return 'Efectivo (Guaraníes ₲)';
    case 'CREDITO':
      return 'Tarjeta de Crédito';
    case 'DEBITO':
      return 'Tarjeta de Débito';
    case 'PIX':
      return 'Transferencia QR / SIPAP';
    case 'VR_VA':
      return 'Billetera Móvil (Tigo / Personal)';
    default:
      return method;
  }
};

export const getMeatDonenessLabel = (doneness?: MeatDoneness): string => {
  switch (doneness) {
    case 'SELANTE':
      return 'Sellada (Vuelta y vuelta)';
    case 'MAL_PASSADO':
      return 'Jugosa (Poco cocida)';
    case 'AO_PONTO_PARA_MAL':
      return 'A punto jugosa';
    case 'AO_PONTO':
      return 'A punto';
    case 'AO_PONTO_PARA_BEM':
      return 'A punto cocida';
    case 'BEM_PASSADO':
      return 'Bien cocida';
    default:
      return 'Estándar de la Casa';
  }
};
