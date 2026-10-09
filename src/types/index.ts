export type UserRole = 'ADMIN' | 'CAIXA' | 'GARCOM' | 'COZINHA';

export type ShiftType = 'ALMOCO' | 'JANTAR' | 'AMBOS';

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  cpf: string;
  role: UserRole;
  shift: ShiftType;
  admissionDate: string; // YYYY-MM-DD
  baseSalary: number; // R$
  commissionRate: number; // e.g. 10 (%)
  monthlyTarget: number; // R$ meta mensal de vendas
  active: boolean;
  pin: string;
  avatar: string;
  colorTag: string;
}

export type MeatDoneness =
  | 'MAL_PASSADO'
  | 'AO_PONTO_PARA_MAL'
  | 'AO_PONTO'
  | 'AO_PONTO_PARA_BEM'
  | 'BEM_PASSADO';

export type TableStatus = 'LIVRE' | 'OCUPADA' | 'CONTA_SOLICITADA' | 'RESERVADA';

export type OrderType = 'MESA' | 'DELIVERY' | 'RETIRADA';

export interface Table {
  id: number;
  label: string;
  capacity: number;
  status: TableStatus;
  currentComandaId?: string;
  assignedWaiterId?: string;
  customerName?: string;
  peopleCount: number;
  openedAt?: string;
  reservationCustomerName?: string;
  reservationPhone?: string;
  reservationTime?: string;
}

export type MenuCategory =
  | 'RODIZIO'
  | 'CORTES_NOBRES'
  | 'PRATOS_A_LA_CARTE'
  | 'POR_QUILO'
  | 'ENTRADAS_GUARNACOES'
  | 'ADICIONAIS'
  | 'BEBIDAS'
  | 'CHOPP_DRINKS'
  | 'SOBREMESAS';

export type PrepStation = 'GRELHA' | 'COZINHA' | 'BAR';

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // Quantidade consumida por porção/venda (ex: 0.35 para 350g, 1 para 1 un)
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  costPrice?: number; // Custo de produção/aquisição (R$)
  imageUrl?: string; // Foto do produto
  description: string;
  prepStation: PrepStation;
  available: boolean;
  allowsDoneness: boolean;
  highlight?: boolean;
  isWeighed?: boolean; // Vendido por quilo (peso em kg)
  unitLabel?: string; // e.g. 'kg' ou 'un'
  recipe?: RecipeIngredient[]; // Ficha técnica simples para baixa automática no estoque
}

export type OrderItemStatus = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  weightInKg?: number; // Peso registrado em kg
  isWeighed?: boolean;
  doneness?: MeatDoneness;
  notes?: string;
  prepStation: PrepStation;
  status: OrderItemStatus;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  tableId: number;
  tableLabel: string;
  comandaCode: string;
  waiterId: string;
  waiterName: string;
}

export type ComandaStatus = 'ABERTA' | 'CONTA_SOLICITADA' | 'PAGA' | 'CANCELADA';

export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO' | 'VR_VA';

export interface PaymentTransaction {
  id: string;
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  changeAmount?: number;
}

export interface Comanda {
  id: string;
  code: string;
  orderType: OrderType;
  tableId: number;
  tableLabel: string;
  waiterId: string;
  waiterName: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  peopleCount: number;
  hasRodizio: boolean;
  rodizioAdultCount: number;
  rodizioChildCount: number;
  rodizioSeniorCount: number;
  items: OrderItem[];
  status: ComandaStatus;
  openedAt: string;
  closedAt?: string;
  includeService: boolean; // 10%
  discountAmount: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  payments: PaymentTransaction[];
}

export type CashMovementType = 'VENDA' | 'SANGRIA' | 'SUPRIMENTO' | 'ESTORNO';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  paymentMethod?: PaymentMethod;
  description: string;
  timestamp: string;
  operatorName: string;
  comandaCode?: string;
}

export interface CashRegisterSession {
  id: string;
  operatorId: string;
  operatorName: string;
  openedAt: string;
  closedAt?: string;
  initialCash: number;
  status: 'ABERTO' | 'FECHADO';
  movements: CashMovement[];
  countedCash?: number;
  discrepancy?: number;
  closingNotes?: string;
}

export interface RestaurantSettings {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  serviceTaxPercentage: number;
  couvertArtistico: number;
  rodizioAdultPrice: number;
  rodizioChildPrice: number;
  rodizioSeniorPrice: number;
  kiloPrice: number;
  enableSoundAlerts: boolean;
}

// 5. Cardápio e Estoque Types
export type StockUnit = 'KG' | 'UN' | 'L' | 'PACOTE';

export type IngredientCategory =
  | 'CARNES'
  | 'BEBIDAS'
  | 'CARVAO_LENHA'
  | 'HORTIFRUTI'
  | 'MERCEARIA'
  | 'SOBREMESAS'
  | 'OUTROS';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: StockUnit;
  currentStock: number;
  minStock: number; // Ponto de alerta de estoque mínimo
  costPerUnit: number; // Custo por unidade/kg (R$)
  supplier?: string;
  lastRestockedAt?: string;
}

export type WasteReason =
  | 'VALIDADE_VENCIDA'
  | 'QUEIMA_OU_ERRO_PREPARO'
  | 'LIMPEZA_CORTE_EXCESSIVO'
  | 'DANO_AVARIA'
  | 'OUTRO';

export interface WasteRecord {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: StockUnit;
  reason: WasteReason;
  estimatedCost: number; // Prejuízo em R$
  date: string; // ISO
  registeredBy: string; // Nome do funcionário
  notes?: string;
}

export type StockMovementType = 'ENTRADA' | 'BAIXA_VENDA' | 'PERDA' | 'AJUSTE';

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: StockMovementType;
  quantity: number;
  unit: StockUnit;
  date: string;
  reference?: string; // ex: "Venda CMD-101", "Desperdício #1", "Entrada Fornecedor"
  registeredBy?: string;
}

