export type UserRole = 'ADMIN' | 'CAIXA' | 'GARCOM' | 'COZINHA';

export type ShiftType = 'ALMOCO' | 'JANTAR' | 'AMBOS';

export type MenuCategory =
  | 'RODIZIO'
  | 'POR_QUILO'
  | 'PRATOS_A_LA_CARTE'
  | 'CORTES_NOBRES'
  | 'ENTRADAS_GUARNACOES'
  | 'ADICIONAIS'
  | 'CHOPP_DRINKS'
  | 'BEBIDAS'
  | 'SOBREMESAS';

export type PrepStation = 'GRELHA' | 'COZINHA' | 'BAR';

export type PaymentMethod = 'DINHEIRO' | 'CREDITO' | 'DEBITO' | 'PIX' | 'VR_VA';

export type MeatDoneness =
  | 'SELANTE'
  | 'MAL_PASSADO'
  | 'AO_PONTO_PARA_MAL'
  | 'AO_PONTO'
  | 'AO_PONTO_PARA_BEM'
  | 'BEM_PASSADO';

export type TableStatus = 'LIVRE' | 'OCUPADA' | 'CONTA_SOLICITADA' | 'RESERVADA';

export type OrderItemStatus = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

export type ComandaStatus = 'ABERTA' | 'CONTA_SOLICITADA' | 'PAGA' | 'CANCELADA';

export type IngredientCategory =
  | 'CARNES'
  | 'BEBIDAS'
  | 'CARVAO_LENHA'
  | 'HORTIFRUTI'
  | 'MERCEARIA'
  | 'SOBREMESAS'
  | 'OUTROS';

export type StockUnit = 'KG' | 'UN' | 'PACOTE' | 'LITRO';

export type WasteReason =
  | 'VALIDADE_VENCIDA'
  | 'QUEIMA_OU_ERRO_PREPARO'
  | 'LIMPEZA_CORTE_EXCESSIVO'
  | 'DANO_AVARIA'
  | 'OUTRO';

export type CashMovementType =
  | 'SUPRIMENTO'
  | 'SANGRIA'
  | 'VENDA'
  | 'DESPESA'
  | 'ESTORNO'
  | 'REPASSE_GORJETA'
  | 'COMISSAO';

export type ExpenseCategory =
  | 'FORNECEDOR_CARNE'
  | 'GAS_CARVAO'
  | 'BEBIDAS_ESTOQUE'
  | 'HORTIFRUTI'
  | 'ALUGUEL'
  | 'ENERGIA_AGUA'
  | 'SALARIOS'
  | 'IMPOSTOS'
  | 'MANUTENCAO'
  | 'OUTROS';

export interface ExpenseBill {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  supplier?: string;
  notes?: string;
  registeredBy: string;
  createdAt: string;
}

export interface CashClosingRecord {
  id: string;
  type: 'TURNO' | 'MENSAL';
  periodLabel: string;
  date: string;
  operatorName: string;
  initialCash: number;
  totalEntries: number;
  totalExits: number;
  expectedCash: number;
  countedCash: number;
  discrepancy: number; // countedCash - expectedCash
  notes?: string;
  status: 'CONCILIADO' | 'DIVERGENTE';
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
  adminEmail?: string;
  adminPhone?: string;
  emailReportsEnabled?: boolean;
  whatsappReportsEnabled?: boolean;
  discountAlertThreshold?: number; // e.g. 50
  cashDiscrepancyThreshold?: number; // e.g. 10
}

export type AutomationAlertType =
  | 'ESTOQUE_BAIXO'
  | 'CONTA_VENCENDO'
  | 'DIFERENCA_CAIXA'
  | 'DESCONTO_ANOMALO'
  | 'CANCELAMENTO_COMANDA';

export interface AutomationAlert {
  id: string;
  type: AutomationAlertType;
  severity: 'CRITICO' | 'ALERTA' | 'INFO';
  title: string;
  description: string;
  timestamp: string;
  targetId?: string;
  employeeName?: string;
  value?: number;
  resolved: boolean;
}

export type AuditActionType =
  | 'CANCELAMENTO_ITEM'
  | 'CANCELAMENTO_COMANDA'
  | 'ESTORNO_PAGAMENTO'
  | 'DESCONTO_CONCEDIDO'
  | 'ALTERACAO_PRECO'
  | 'AJUSTE_ESTOQUE'
  | 'SANGRIA_CAIXA'
  | 'DIFERENCA_FECHAMENTO'
  | 'FECHAMENTO_CAIXA'
  | 'DIVERGENCIA_CAIXA';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetType: 'COMANDA' | 'ITEM' | 'PRODUTO' | 'ESTOQUE' | 'CAIXA';
  targetReference: string;
  details: string;
  reason?: string;
  amountImpact?: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  cpf: string;
  role: UserRole;
  shift: ShiftType;
  admissionDate: string;
  baseSalary: number;
  commissionRate: number;
  monthlyTarget: number;
  active: boolean;
  pin: string;
  avatar?: string;
  colorTag?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  costPrice?: number;
  imageUrl?: string;
  description?: string;
  prepStation: PrepStation;
  available: boolean;
  allowsDoneness?: boolean;
  highlight?: boolean;
  isWeighed?: boolean;
  unitLabel?: string;
  recipe?: RecipeIngredient[];
}

export interface Table {
  id: number;
  label: string;
  capacity: number;
  status: TableStatus;
  currentComandaId?: string;
  assignedWaiterId?: string;
  customerName?: string;
  peopleCount?: number;
  openedAt?: string;
  reservationTime?: string;
  reservationCustomerName?: string;
  reservationPhone?: string;
  reservationNotes?: string;
}

export interface ComandaItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  doneness?: MeatDoneness;
  notes?: string;
  weightInKg?: number;
  prepStation: PrepStation;
  status: OrderItemStatus;
  createdAt: string;
  tableId: number;
  tableLabel: string;
  comandaCode: string;
  waiterId: string;
  waiterName: string;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  timestamp: string;
}

export interface Comanda {
  id: string;
  code: string;
  orderType: 'MESA' | 'DELIVERY' | 'BALCAO' | 'RETIRADA';
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
  items: ComandaItem[];
  status: ComandaStatus;
  openedAt: string;
  closedAt?: string;
  includeService: boolean;
  discountAmount: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  payments: Payment[];
}

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  paymentMethod: PaymentMethod;
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
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: StockUnit;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastRestockedAt?: string;
}

export interface WasteRecord {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: StockUnit;
  reason: WasteReason;
  estimatedCost: number;
  date: string;
  registeredBy: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'ENTRADA' | 'BAIXA_VENDA' | 'PERDA' | 'AJUSTE';
  quantity: number;
  unit: StockUnit;
  date: string;
  reference?: string;
  registeredBy: string;
}
