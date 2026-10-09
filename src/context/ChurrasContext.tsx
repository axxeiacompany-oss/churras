import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { formatCurrency } from '../utils/format';
import {
  Employee,
  MenuItem,
  Table,
  Comanda,
  ComandaItem,
  CashRegisterSession,
  CashMovementType,
  PaymentMethod,
  Payment,
  RestaurantSettings,
  Ingredient,
  WasteRecord,
  StockMovement,
  OrderItemStatus,
  MeatDoneness,
  ExpenseBill,
  CashClosingRecord,
  AuditLogEntry,
  AuditActionType,
  UserRole,
  ProductPurchase,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_COMANDAS,
  INITIAL_CASH_SESSION,
  INITIAL_INGREDIENTS,
  INITIAL_WASTE_RECORDS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_EXPENSE_BILLS,
  INITIAL_CASH_CLOSINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRODUCT_PURCHASES,
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface ChurrasContextType {
  currentUser: Employee | null;
  employees: Employee[];
  menuItems: MenuItem[];
  tables: Table[];
  comandas: Comanda[];
  cashSession: CashRegisterSession;
  settings: RestaurantSettings;
  ingredients: Ingredient[];
  wasteRecords: WasteRecord[];
  stockMovements: StockMovement[];
  lowStockIngredients: Ingredient[];
  bills: ExpenseBill[];
  cashClosings: CashClosingRecord[];
  auditLogs: AuditLogEntry[];
  toasts: ToastMessage[];
  purchases: ProductPurchase[];
  addProductPurchase: (purchase: Omit<ProductPurchase, 'id' | 'timestamp'>) => void;

  // Tables Management
  addTable: (label: string, capacity: number) => { success: boolean; error?: string };
  updateTable: (id: number, updates: { label?: string; capacity?: number }) => { success: boolean; error?: string };
  deleteTable: (id: number) => { success: boolean; error?: string };

  // Auth
  loginWithEmail: (email: string, pass: string) => { success: boolean; error?: string };
  loginStaffWithGmail: (email: string, name?: string, password?: string) => { success: boolean; error?: string };
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (employeeId: string) => void;

  // Employees
  addEmployee: (emp: Omit<Employee, 'id'>) => { success: boolean; error?: string };
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  resetCredentials: (id: string, newPin: string, newPassword?: string) => void;

  // Menu
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  toggleMenuItemAvailability: (id: string) => void;
  deleteMenuItem: (id: string) => void;

  // Tables & Comandas
  openComanda: (
    tableId: number,
    waiterId: string,
    details: {
      customerName: string;
      peopleCount: number;
      hasRodizio: boolean;
      rodizioAdultCount: number;
      rodizioChildCount: number;
      rodizioSeniorCount: number;
    }
  ) => string;
  openDeliveryComanda: (details: {
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryFee?: number;
    orderType?: 'DELIVERY' | 'BALCAO';
  }) => string;
  addItemsToComanda: (
    comandaId: string,
    items: Array<{
      menuItemId: string;
      quantity: number;
      doneness?: MeatDoneness;
      notes?: string;
      weightInKg?: number;
    }>
  ) => void;
  requestBill: (comandaId: string) => void;
  toggleServiceFee: (comandaId: string) => void;
  transferComanda: (sourceTableId: number, targetTableId: number) => { success: boolean; error?: string };
  transferItems: (
    sourceComandaId: string,
    targetComandaId: string | null,
    itemIds: string[]
  ) => { success: boolean; error?: string };
  mergeComandas: (sourceTableId: number, targetTableId: number) => { success: boolean; error?: string };
  reserveTable: (
    tableId: number,
    details: {
      customerName: string;
      phone?: string;
      time: string;
      peopleCount: number;
      notes?: string;
    }
  ) => void;
  cancelReservation: (tableId: number) => void;
  updateOrderItemStatus: (itemId: string, status: OrderItemStatus) => void;
  payComanda: (comandaId: string, payments: Payment[], discountAmount?: number) => void;
  cancelComanda: (comandaId: string) => void;

  // Cash Register & Financial
  openCashSession: (initialCash: number) => void;
  closeCashSession: () => void;
  addCashMovement: (
    type: CashMovementType,
    amount: number,
    paymentMethod: PaymentMethod,
    description: string,
    comandaCode?: string
  ) => void;
  refundComanda: (comandaId: string, reason: string) => void;
  addExpenseBill: (bill: Omit<ExpenseBill, 'id' | 'createdAt'>) => void;
  payExpenseBill: (id: string, paymentMethod: PaymentMethod) => void;
  deleteExpenseBill: (id: string) => void;
  closeShiftCash: (data: {
    type: 'TURNO' | 'MENSAL';
    periodLabel: string;
    countedCash: number;
    notes?: string;
  }) => CashClosingRecord;
  releaseTipsDistribution: (amount: number, description: string) => void;
  processMonthlyCommissions: (monthYear: string) => void;

  // Stock
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  restockIngredient: (id: string, quantity: number, cost?: number, supplier?: string) => void;
  registerWaste: (record: Omit<WasteRecord, 'id' | 'date'>) => void;

  // Settings
  updateSettings: (updates: Partial<RestaurantSettings>) => void;

  // Audit
  addAuditLog: (
    log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole'> & {
      actorId?: string;
      actorName?: string;
      actorRole?: UserRole;
    }
  ) => void;

  // Toast
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const ChurrasContext = createContext<ChurrasContextType | undefined>(undefined);

export const ChurrasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem('churras_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('churras_employees');
    const parsed: Employee[] = saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    return parsed.filter((e) => e.id !== 'emp-caixa-2' && e.name !== 'Renata Lins');
  });

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('churras_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_EMPLOYEES[0];
      }
    }
    return INITIAL_EMPLOYEES[0]; // Default to Admin for testing
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('churras_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('churras_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [comandas, setComandas] = useState<Comanda[]>(() => {
    const saved = localStorage.getItem('churras_comandas');
    return saved ? JSON.parse(saved) : INITIAL_COMANDAS;
  });

  const [cashSession, setCashSession] = useState<CashRegisterSession>(() => {
    const saved = localStorage.getItem('churras_cash_session');
    return saved ? JSON.parse(saved) : INITIAL_CASH_SESSION;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('churras_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() => {
    const saved = localStorage.getItem('churras_waste');
    return saved ? JSON.parse(saved) : INITIAL_WASTE_RECORDS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('churras_movements');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [bills, setBills] = useState<ExpenseBill[]>(() => {
    const saved = localStorage.getItem('churras_bills');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSE_BILLS;
  });

  const [cashClosings, setCashClosings] = useState<CashClosingRecord[]>(() => {
    const saved = localStorage.getItem('churras_cash_closings');
    return saved ? JSON.parse(saved) : INITIAL_CASH_CLOSINGS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('churras_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [purchases, setPurchases] = useState<ProductPurchase[]>(() => {
    const saved = localStorage.getItem('churras_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_PURCHASES;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem('churras_purchases', JSON.stringify(purchases));
  }, [purchases]);
  useEffect(() => {
    localStorage.setItem('churras_settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem('churras_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('churras_current_user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('churras_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);
  useEffect(() => {
    localStorage.setItem('churras_tables', JSON.stringify(tables));
  }, [tables]);
  useEffect(() => {
    localStorage.setItem('churras_comandas', JSON.stringify(comandas));
  }, [comandas]);
  useEffect(() => {
    localStorage.setItem('churras_cash_session', JSON.stringify(cashSession));
  }, [cashSession]);
  useEffect(() => {
    localStorage.setItem('churras_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);
  useEffect(() => {
    localStorage.setItem('churras_waste', JSON.stringify(wasteRecords));
  }, [wasteRecords]);
  useEffect(() => {
    localStorage.setItem('churras_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);
  useEffect(() => {
    localStorage.setItem('churras_bills', JSON.stringify(bills));
  }, [bills]);
  useEffect(() => {
    localStorage.setItem('churras_cash_closings', JSON.stringify(cashClosings));
  }, [cashClosings]);
  useEffect(() => {
    localStorage.setItem('churras_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (
    log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole'> & {
      actorId?: string;
      actorName?: string;
      actorRole?: UserRole;
    }
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionType: log.actionType,
      actorId: log.actorId || currentUser?.id || 'emp-admin',
      actorName: log.actorName || currentUser?.name || 'Administrador',
      actorRole: log.actorRole || currentUser?.role || 'ADMIN',
      targetType: log.targetType,
      targetReference: log.targetReference,
      details: log.details,
      reason: log.reason,
      amountImpact: log.amountImpact,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const lowStockIngredients = useMemo(() => {
    return ingredients.filter((ing) => ing.currentStock <= ing.minStock);
  }, [ingredients]);

  // Auth handlers
  const loginWithEmail = (email: string, pass: string) => {
    const found = employees.find(
      (e) => e.email.toLowerCase() === email.toLowerCase().trim() && e.password === pass
    );
    if (!found) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }
    if (!found.active) {
      return { success: false, error: 'Usuário inativo. Contate o administrador.' };
    }
    setCurrentUser(found);
    showToast(`Bem-vindo(a), ${found.name}!`, 'success');
    return { success: true };
  };

  const loginStaffWithGmail = (email: string, name?: string, password?: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || '').toLowerCase().trim();

    const found = employees.find((e) => {
      const emailMatch = e.email.toLowerCase().trim() === cleanEmail;
      if (!emailMatch) return false;
      if (cleanName) {
        return e.name.toLowerCase().includes(cleanName) || cleanName.includes(e.name.toLowerCase().split(' ')[0]);
      }
      return true;
    }) || employees.find((e) => e.email.toLowerCase().trim() === cleanEmail);

    if (!found) {
      return { success: false, error: 'Funcionário não encontrado com este Gmail/E-mail.' };
    }
    if (password !== undefined && found.password && found.password !== password) {
      return { success: false, error: 'Senha incorreta para este funcionário.' };
    }
    if (!found.active) {
      return { success: false, error: 'Conta de funcionário inativa. Contate o administrador.' };
    }
    setCurrentUser(found);
    showToast(`Olá, ${found.name}! Acesso liberado.`, 'success');
    return { success: true };
  };

  const loginWithPin = (pin: string) => {
    const found = employees.find((e) => e.pin === pin);
    if (!found) {
      return { success: false, error: 'PIN não encontrado.' };
    }
    if (!found.active) {
      return { success: false, error: 'Usuário inativo. Contate o administrador.' };
    }
    setCurrentUser(found);
    showToast(`Olá, ${found.name}! Acesso liberado.`, 'success');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const switchUser = (employeeId: string) => {
    const found = employees.find((e) => e.id === employeeId);
    if (found) {
      setCurrentUser(found);
      showToast(`Perfil alterado para ${found.name} (${found.role}).`, 'info');
    }
  };

  // Employee management
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const emailExists = employees.some(
      (e) => e.email.toLowerCase() === empData.email.toLowerCase().trim()
    );
    if (emailExists) {
      return { success: false, error: 'Este Gmail/e-mail já está cadastrado para outro funcionário.' };
    }

    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now().toString(36)}`,
    };
    setEmployees((prev) => [...prev, newEmp]);
    showToast(`Colaborador ${newEmp.name} cadastrado com sucesso!`, 'success');
    return { success: true };
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showToast('Dados do colaborador atualizados.', 'success');
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast('Colaborador removido da equipe.', 'info');
  };

  const resetCredentials = (id: string, newPin: string, newPassword?: string) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            pin: newPin,
            password: newPassword !== undefined ? newPassword : e.password,
          };
        }
        return e;
      })
    );
    showToast('Credenciais redefinidas com sucesso.', 'success');
  };

  // Menu management
  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `menu-${Date.now().toString(36)}`,
    };
    setMenuItems((prev) => [...prev, newItem]);
    showToast(`Item "${newItem.name}" adicionado ao cardápio.`, 'success');
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    showToast('Item do cardápio atualizado.', 'success');
  };

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const next = !m.available;
          showToast(`Item ${m.name} marcado como ${next ? 'DISPONÍVEL' : 'ESGOTADO'}.`, 'info');
          return { ...m, available: next };
        }
        return m;
      })
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    showToast('Item removido do cardápio.', 'info');
  };

  // Settings
  const updateSettings = (updates: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Configurações salvas.', 'success');
  };

  // Tables & Comandas
  const recalculateComandaTotals = (
    items: ComandaItem[],
    includeService: boolean,
    discountAmount: number,
    deliveryFee: number = 0
  ) => {
    const subtotal = items
      .filter((i) => i.status !== 'CANCELADO')
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const serviceFee = includeService
      ? Math.round(subtotal * (settings.serviceTaxPercentage / 100) * 100) / 100
      : 0;

    const total = Math.max(0, Math.round((subtotal + serviceFee + deliveryFee - discountAmount) * 100) / 100);

    return { subtotal, serviceFee, total };
  };

  const openComanda = (
    tableId: number,
    waiterId: string,
    details: {
      customerName: string;
      peopleCount: number;
      hasRodizio: boolean;
      rodizioAdultCount: number;
      rodizioChildCount: number;
      rodizioSeniorCount: number;
    }
  ): string => {
    const table = tables.find((t) => t.id === tableId);
    const waiter = employees.find((e) => e.id === waiterId) || currentUser;
    const comandaId = `cmd-${Date.now().toString(36)}`;
    const comandaCode = `CMD-${tableId < 10 ? '0' + tableId : tableId}-${Math.floor(100 + Math.random() * 900)}`;

    const initialItems: ComandaItem[] = [];

    // Auto-add Rodizio items if enabled
    if (details.hasRodizio) {
      if (details.rodizioAdultCount > 0) {
        const adultItem = menuItems.find((m) => m.id === 'menu-rod-adult');
        if (adultItem) {
          initialItems.push({
            id: `ord-${Date.now()}-1`,
            menuItemId: adultItem.id,
            name: adultItem.name,
            price: settings.rodizioAdultPrice,
            quantity: details.rodizioAdultCount,
            prepStation: adultItem.prepStation,
            status: 'EM_PREPARO',
            createdAt: new Date().toISOString(),
            tableId,
            tableLabel: table?.label || `Mesa ${tableId}`,
            comandaCode,
            waiterId: waiter?.id || '',
            waiterName: waiter?.name || 'Garçom',
          });
        }
      }
      if (details.rodizioChildCount > 0) {
        const childItem = menuItems.find((m) => m.id === 'menu-rod-child');
        if (childItem) {
          initialItems.push({
            id: `ord-${Date.now()}-2`,
            menuItemId: childItem.id,
            name: childItem.name,
            price: settings.rodizioChildPrice,
            quantity: details.rodizioChildCount,
            prepStation: childItem.prepStation,
            status: 'EM_PREPARO',
            createdAt: new Date().toISOString(),
            tableId,
            tableLabel: table?.label || `Mesa ${tableId}`,
            comandaCode,
            waiterId: waiter?.id || '',
            waiterName: waiter?.name || 'Garçom',
          });
        }
      }
      if (details.rodizioSeniorCount > 0) {
        const seniorItem = menuItems.find((m) => m.id === 'menu-rod-senior');
        if (seniorItem) {
          initialItems.push({
            id: `ord-${Date.now()}-3`,
            menuItemId: seniorItem.id,
            name: seniorItem.name,
            price: settings.rodizioSeniorPrice,
            quantity: details.rodizioSeniorCount,
            prepStation: seniorItem.prepStation,
            status: 'EM_PREPARO',
            createdAt: new Date().toISOString(),
            tableId,
            tableLabel: table?.label || `Mesa ${tableId}`,
            comandaCode,
            waiterId: waiter?.id || '',
            waiterName: waiter?.name || 'Garçom',
          });
        }
      }
    }

    const { subtotal, serviceFee, total } = recalculateComandaTotals(initialItems, true, 0, 0);

    const newComanda: Comanda = {
      id: comandaId,
      code: comandaCode,
      orderType: 'MESA',
      tableId,
      tableLabel: table?.label || `Mesa ${tableId}`,
      waiterId: waiter?.id || '',
      waiterName: waiter?.name || 'Garçom',
      customerName: details.customerName,
      peopleCount: details.peopleCount,
      hasRodizio: details.hasRodizio,
      rodizioAdultCount: details.rodizioAdultCount,
      rodizioChildCount: details.rodizioChildCount,
      rodizioSeniorCount: details.rodizioSeniorCount,
      items: initialItems,
      status: 'ABERTA',
      openedAt: new Date().toISOString(),
      includeService: true,
      discountAmount: 0,
      subtotal,
      serviceFee,
      total,
      payments: [],
    };

    setComandas((prev) => [newComanda, ...prev]);

    // Update table
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'OCUPADA',
              currentComandaId: comandaId,
              assignedWaiterId: waiter?.id,
              customerName: details.customerName,
              peopleCount: details.peopleCount,
              openedAt: new Date().toISOString(),
              reservationCustomerName: undefined,
              reservationPhone: undefined,
              reservationTime: undefined,
              reservationNotes: undefined,
            }
          : t
      )
    );

    showToast(`Comanda ${comandaCode} aberta para ${table?.label}!`, 'success');
    return comandaId;
  };

  const openDeliveryComanda = (details: {
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryFee?: number;
    orderType?: 'DELIVERY' | 'BALCAO';
  }): string => {
    const comandaId = `cmd-deliv-${Date.now().toString(36)}`;
    const comandaCode = `DEL-${Math.floor(100 + Math.random() * 900)}`;
    const deliveryFee = details.deliveryFee || 0;

    const newComanda: Comanda = {
      id: comandaId,
      code: comandaCode,
      orderType: details.orderType || 'DELIVERY',
      tableId: 0,
      tableLabel: details.orderType === 'BALCAO' ? 'Balcão / Retirada' : `Delivery (${details.customerName})`,
      waiterId: currentUser?.id || 'emp-caixa',
      waiterName: currentUser?.name || 'Atendente',
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      deliveryAddress: details.deliveryAddress,
      deliveryFee,
      peopleCount: 1,
      hasRodizio: false,
      rodizioAdultCount: 0,
      rodizioChildCount: 0,
      rodizioSeniorCount: 0,
      items: [],
      status: 'ABERTA',
      openedAt: new Date().toISOString(),
      includeService: false,
      discountAmount: 0,
      subtotal: 0,
      serviceFee: 0,
      total: deliveryFee,
      payments: [],
    };

    setComandas((prev) => [newComanda, ...prev]);
    showToast(`Pedido Delivery ${comandaCode} criado!`, 'success');
    return comandaId;
  };

  const addItemsToComanda = (
    comandaId: string,
    itemsToAdd: Array<{
      menuItemId: string;
      quantity: number;
      doneness?: MeatDoneness;
      notes?: string;
      weightInKg?: number;
    }>
  ) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const newItems: ComandaItem[] = itemsToAdd.map((entry) => {
      const menuItem = menuItems.find((m) => m.id === entry.menuItemId);
      const isKg = menuItem?.isWeighed && entry.weightInKg;
      const unitPrice = menuItem ? (isKg ? menuItem.price * (entry.weightInKg || 1) : menuItem.price) : 0;

      return {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: entry.menuItemId,
        name: menuItem ? menuItem.name : 'Item',
        price: unitPrice,
        quantity: entry.quantity,
        doneness: entry.doneness,
        notes: entry.notes,
        weightInKg: entry.weightInKg,
        prepStation: menuItem?.prepStation || 'COZINHA',
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
        tableId: comanda.tableId,
        tableLabel: comanda.tableLabel,
        comandaCode: comanda.code,
        waiterId: comanda.waiterId,
        waiterName: comanda.waiterName,
      };
    });

    const updatedItems = [...comanda.items, ...newItems];
    const { subtotal, serviceFee, total } = recalculateComandaTotals(
      updatedItems,
      comanda.includeService,
      comanda.discountAmount,
      comanda.deliveryFee
    );

    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId
          ? {
              ...c,
              items: updatedItems,
              subtotal,
              serviceFee,
              total,
            }
          : c
      )
    );

    // Deduct direct product stockQuantity for simple sale tracking
    setMenuItems((prev) =>
      prev.map((item) => {
        const matchingAdded = itemsToAdd.find((it) => it.menuItemId === item.id);
        if (matchingAdded) {
          const currentQty = typeof item.stockQuantity === 'number' ? item.stockQuantity : 40;
          return {
            ...item,
            stockQuantity: Math.max(0, currentQty - matchingAdded.quantity),
          };
        }
        return item;
      })
    );

    // Stock deduction for recipes
    itemsToAdd.forEach((entry) => {
      const menuItem = menuItems.find((m) => m.id === entry.menuItemId);
      if (menuItem?.recipe && menuItem.recipe.length > 0) {
        menuItem.recipe.forEach((rec) => {
          const usedQty = Math.round(rec.quantity * entry.quantity * 100) / 100;
          setIngredients((prev) =>
            prev.map((ing) =>
              ing.id === rec.ingredientId
                ? { ...ing, currentStock: Math.max(0, Math.round((ing.currentStock - usedQty) * 100) / 100) }
                : ing
            )
          );
          setStockMovements((prev) => [
            {
              id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              ingredientId: rec.ingredientId,
              ingredientName: ingredients.find((i) => i.id === rec.ingredientId)?.name || 'Insumo',
              type: 'BAIXA_VENDA',
              quantity: usedQty,
              unit: ingredients.find((i) => i.id === rec.ingredientId)?.unit || 'KG',
              date: new Date().toISOString(),
              reference: `Venda ${comanda.code}`,
              registeredBy: 'Ficha Técnica Automática',
            },
            ...prev,
          ]);
        });
      }
    });

    showToast(`${newItems.length} item(ns) lançado(s) com sucesso na ${comanda.tableLabel}!`, 'success');
  };

  const requestBill = (comandaId: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    setComandas((prev) =>
      prev.map((c) => (c.id === comandaId ? { ...c, status: 'CONTA_SOLICITADA' } : c))
    );

    if (comanda.tableId > 0) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === comanda.tableId ? { ...t, status: 'CONTA_SOLICITADA' } : t
        )
      );
    }
    showToast(`Conta solicitada para ${comanda.tableLabel}! Notificação enviada ao Caixa.`, 'info');
  };

  const toggleServiceFee = (comandaId: string) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId) {
          const nextInclude = !c.includeService;
          const { subtotal, serviceFee, total } = recalculateComandaTotals(
            c.items,
            nextInclude,
            c.discountAmount,
            c.deliveryFee
          );
          showToast(
            nextInclude
              ? 'Taxa de serviço (10%) adicionada à comanda.'
              : 'Taxa de serviço isentada da comanda.',
            'info'
          );
          return {
            ...c,
            includeService: nextInclude,
            subtotal,
            serviceFee,
            total,
          };
        }
        return c;
      })
    );
  };

  const transferComanda = (sourceTableId: number, targetTableId: number) => {
    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);

    if (!sourceTable || !sourceTable.currentComandaId) {
      return { success: false, error: 'Mesa de origem sem comanda ativa.' };
    }
    if (!targetTable) {
      return { success: false, error: 'Mesa de destino não encontrada.' };
    }
    if (targetTable.status !== 'LIVRE') {
      return { success: false, error: 'Mesa de destino já está ocupada ou reservada.' };
    }

    const comandaId = sourceTable.currentComandaId;

    // Update comanda label & tableId
    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId
          ? {
              ...c,
              tableId: targetTable.id,
              tableLabel: targetTable.label,
              items: c.items.map((it) => ({
                ...it,
                tableId: targetTable.id,
                tableLabel: targetTable.label,
              })),
            }
          : c
      )
    );

    // Update tables
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === sourceTableId) {
          return {
            ...t,
            status: 'LIVRE',
            currentComandaId: undefined,
            assignedWaiterId: undefined,
            customerName: undefined,
            peopleCount: 0,
            openedAt: undefined,
          };
        }
        if (t.id === targetTableId) {
          return {
            ...t,
            status: sourceTable.status,
            currentComandaId: comandaId,
            assignedWaiterId: sourceTable.assignedWaiterId,
            customerName: sourceTable.customerName,
            peopleCount: sourceTable.peopleCount,
            openedAt: sourceTable.openedAt,
          };
        }
        return t;
      })
    );

    showToast(`Comanda transferida da ${sourceTable.label} para ${targetTable.label}!`, 'success');
    return { success: true };
  };

  const transferItems = (
    sourceComandaId: string,
    targetComandaId: string | null,
    itemIds: string[]
  ) => {
    const source = comandas.find((c) => c.id === sourceComandaId);
    if (!source) return { success: false, error: 'Comanda de origem não encontrada.' };
    if (!targetComandaId) return { success: false, error: 'Selecione a comanda de destino.' };
    const target = comandas.find((c) => c.id === targetComandaId);
    if (!target) return { success: false, error: 'Comanda de destino não encontrada.' };

    const movingItems = source.items.filter((i) => itemIds.includes(i.id)).map((i) => ({
      ...i,
      tableId: target.tableId,
      tableLabel: target.tableLabel,
      comandaCode: target.code,
    }));

    const remainingItems = source.items.filter((i) => !itemIds.includes(i.id));

    const sourceTotals = recalculateComandaTotals(
      remainingItems,
      source.includeService,
      source.discountAmount,
      source.deliveryFee
    );

    const targetUpdatedItems = [...target.items, ...movingItems];
    const targetTotals = recalculateComandaTotals(
      targetUpdatedItems,
      target.includeService,
      target.discountAmount,
      target.deliveryFee
    );

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === sourceComandaId) {
          return {
            ...c,
            items: remainingItems,
            ...sourceTotals,
          };
        }
        if (c.id === targetComandaId) {
          return {
            ...c,
            items: targetUpdatedItems,
            ...targetTotals,
          };
        }
        return c;
      })
    );

    showToast(`${movingItems.length} item(ns) transferido(s) para ${target.tableLabel}!`, 'success');
    return { success: true };
  };

  const mergeComandas = (sourceTableId: number, targetTableId: number) => {
    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!sourceTable?.currentComandaId || !targetTable?.currentComandaId) {
      return { success: false, error: 'Ambas as mesas precisam ter comandas ativas.' };
    }

    const sourceComanda = comandas.find((c) => c.id === sourceTable.currentComandaId);
    const targetComanda = comandas.find((c) => c.id === targetTable.currentComandaId);
    if (!sourceComanda || !targetComanda) {
      return { success: false, error: 'Comandas não localizadas.' };
    }

    // Merge items into target comanda
    const transferredItems = sourceComanda.items.map((i) => ({
      ...i,
      tableId: targetTable.id,
      tableLabel: targetTable.label,
      comandaCode: targetComanda.code,
    }));

    const mergedItems = [...targetComanda.items, ...transferredItems];
    const { subtotal, serviceFee, total } = recalculateComandaTotals(
      mergedItems,
      targetComanda.includeService,
      targetComanda.discountAmount + sourceComanda.discountAmount,
      targetComanda.deliveryFee
    );

    setComandas((prev) =>
      prev
        .filter((c) => c.id !== sourceComanda.id)
        .map((c) =>
          c.id === targetComanda.id
            ? {
                ...c,
                peopleCount: c.peopleCount + sourceComanda.peopleCount,
                items: mergedItems,
                subtotal,
                serviceFee,
                total,
              }
            : c
        )
    );

    // Free source table
    setTables((prev) =>
      prev.map((t) =>
        t.id === sourceTableId
          ? {
              ...t,
              status: 'LIVRE',
              currentComandaId: undefined,
              assignedWaiterId: undefined,
              customerName: undefined,
              peopleCount: 0,
              openedAt: undefined,
            }
          : t.id === targetTableId
          ? {
              ...t,
              peopleCount: (t.peopleCount || 0) + (sourceTable.peopleCount || 0),
            }
          : t
      )
    );

    showToast(`Mesas unificadas na ${targetTable.label}!`, 'success');
    return { success: true };
  };

  const reserveTable = (
    tableId: number,
    details: {
      customerName: string;
      phone?: string;
      time: string;
      peopleCount: number;
      notes?: string;
    }
  ) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'RESERVADA',
              customerName: details.customerName,
              reservationCustomerName: details.customerName,
              reservationPhone: details.phone,
              reservationTime: details.time,
              reservationNotes: details.notes,
              peopleCount: details.peopleCount,
            }
          : t
      )
    );
    showToast(`Mesa ${tableId} reservada para ${details.customerName} às ${details.time}!`, 'success');
  };

  const cancelReservation = (tableId: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'LIVRE',
              customerName: undefined,
              reservationCustomerName: undefined,
              reservationPhone: undefined,
              reservationTime: undefined,
              reservationNotes: undefined,
              peopleCount: 0,
            }
          : t
      )
    );
    showToast(`Reserva da Mesa ${tableId} cancelada.`, 'info');
  };

  const updateOrderItemStatus = (itemId: string, status: OrderItemStatus) => {
    if (status === 'CANCELADO') {
      const itemToCancel = comandas.flatMap((c) => c.items).find((i) => i.id === itemId);
      if (itemToCancel) {
        addAuditLog({
          actionType: 'CANCELAMENTO_ITEM',
          targetType: 'ITEM',
          targetReference: `${itemToCancel.tableLabel} - ${itemToCancel.name}`,
          details: `Item ${itemToCancel.name} (qtd ${itemToCancel.quantity}) cancelado`,
          reason: 'Cancelado pelo operador / salão',
          amountImpact: itemToCancel.price * itemToCancel.quantity,
        });
      }
    }

    setComandas((prev) =>
      prev.map((c) => {
        const hasItem = c.items.some((i) => i.id === itemId);
        if (!hasItem) return c;

        return {
          ...c,
          items: c.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
        };
      })
    );
  };

  const payComanda = (comandaId: string, payments: Payment[], discountAmount: number = 0) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    if (discountAmount > 0) {
      addAuditLog({
        actionType: 'DESCONTO_CONCEDIDO',
        targetType: 'COMANDA',
        targetReference: `${comanda.code} (${comanda.tableLabel})`,
        details: `Desconto de R$ ${discountAmount.toFixed(2)} concedido no fechamento`,
        reason: 'Desconto comercial aplicado no caixa',
        amountImpact: discountAmount,
      });
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Register cash movements in cashier session
    payments.forEach((p) => {
      addCashMovement(
        'VENDA',
        p.amount,
        p.method,
        `Venda ${comanda.code} (${comanda.tableLabel})`,
        comanda.code
      );
    });

    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId
          ? {
              ...c,
              status: 'PAGA',
              closedAt: new Date().toISOString(),
              discountAmount,
              payments: [...c.payments, ...payments],
            }
          : c
      )
    );

    // Free table if associated
    if (comanda.tableId > 0) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === comanda.tableId
            ? {
                ...t,
                status: 'LIVRE',
                currentComandaId: undefined,
                assignedWaiterId: undefined,
                customerName: undefined,
                peopleCount: 0,
                openedAt: undefined,
              }
            : t
        )
      );
    }

    showToast(`Comanda ${comanda.code} liquidada com sucesso! Total: R$ ${totalPaid.toFixed(2)}`, 'success');
  };

  const cancelComanda = (comandaId: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    if (comanda.status === 'PAGA') {
      const primaryMethod = comanda.payments[0]?.method || 'DINHEIRO';
      addCashMovement(
        'ESTORNO',
        comanda.total,
        primaryMethod,
        `Estorno de Comanda ${comanda.code} (${comanda.tableLabel})`,
        comanda.code
      );
    }

    setComandas((prev) =>
      prev.map((c) => (c.id === comandaId ? { ...c, status: 'CANCELADA' } : c))
    );

    addAuditLog({
      actionType: 'CANCELAMENTO_COMANDA',
      targetType: 'COMANDA',
      targetReference: `${comanda.code} (${comanda.tableLabel})`,
      details: `Comanda ${comanda.code} cancelada integralmente`,
      reason: 'Cancelamento efetuado no sistema',
      amountImpact: comanda.total,
    });

    if (comanda.tableId > 0) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === comanda.tableId
            ? {
                ...t,
                status: 'LIVRE',
                currentComandaId: undefined,
                assignedWaiterId: undefined,
                customerName: undefined,
                peopleCount: 0,
                openedAt: undefined,
              }
            : t
        )
      );
    }

    showToast(`Comanda ${comanda.code} cancelada e valor estornado no caixa.`, 'warning');
  };

  const refundComanda = (comandaId: string, reason: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const primaryMethod = comanda.payments[0]?.method || 'DINHEIRO';
    addCashMovement(
      'ESTORNO',
      comanda.total,
      primaryMethod,
      `Estorno de Venda ${comanda.code} - Motivo: ${reason}`,
      comanda.code
    );

    setComandas((prev) =>
      prev.map((c) => (c.id === comandaId ? { ...c, status: 'CANCELADA' } : c))
    );

    addAuditLog({
      actionType: 'ESTORNO_PAGAMENTO',
      targetType: 'COMANDA',
      targetReference: `${comanda.code} (${comanda.tableLabel})`,
      details: `Estorno de venda no valor de R$ ${comanda.total.toFixed(2)}`,
      reason: reason || 'Solicitação de estorno',
      amountImpact: comanda.total,
    });

    showToast(`Comanda ${comanda.code} estornada com sucesso. Saída lançada no caixa.`, 'info');
  };

  // Bills and Expenses
  const addExpenseBill = (billData: Omit<ExpenseBill, 'id' | 'createdAt'>) => {
    const newBill: ExpenseBill = {
      ...billData,
      id: `exp-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setBills((prev) => [newBill, ...prev]);

    // If marked as already paid, launch cash outflow movement immediately
    if (newBill.status === 'PAGO') {
      addCashMovement(
        'DESPESA',
        newBill.amount,
        newBill.paymentMethod || 'PIX',
        `Despesa [${newBill.category}]: ${newBill.description}`,
        newBill.receiptNumber
      );
    }

    showToast(`Despesa "${newBill.description}" cadastrada!`, 'success');
  };

  const payExpenseBill = (id: string, paymentMethod: PaymentMethod) => {
    const bill = bills.find((b) => b.id === id);
    if (!bill) return;

    setBills((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'PAGO',
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod,
            }
          : b
      )
    );

    // Launch cash outflow movement
    addCashMovement(
      'DESPESA',
      bill.amount,
      paymentMethod,
      `Pagamento de Conta [${bill.category}]: ${bill.description}`,
      bill.receiptNumber
    );

    showToast(`Conta "${bill.description}" baixada com sucesso no fluxo de caixa!`, 'success');
  };

  const deleteExpenseBill = (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    showToast('Conta a pagar removida.', 'info');
  };

  // Cash Closing with reconciliation
  const closeShiftCash = (data: {
    type: 'TURNO' | 'MENSAL';
    periodLabel: string;
    countedCash: number;
    notes?: string;
  }): CashClosingRecord => {
    let entries = 0;
    let exits = 0;
    let cashInDrawerExpected = cashSession.initialCash || 0;

    cashSession.movements.forEach((m) => {
      if (m.type === 'VENDA' || m.type === 'SUPRIMENTO') {
        entries += m.amount;
        if (m.paymentMethod === 'DINHEIRO') {
          cashInDrawerExpected += m.amount;
        }
      } else {
        exits += m.amount;
        if (m.paymentMethod === 'DINHEIRO') {
          cashInDrawerExpected -= m.amount;
        }
      }
    });

    const discrepancy = Math.round((data.countedCash - cashInDrawerExpected) * 100) / 100;
    const isMatched = Math.abs(discrepancy) < 0.05;

    const newClosing: CashClosingRecord = {
      id: `close-${Date.now().toString(36)}`,
      type: data.type,
      periodLabel: data.periodLabel,
      date: new Date().toISOString(),
      operatorName: currentUser?.name || 'Operador',
      initialCash: cashSession.initialCash || 0,
      totalEntries: Math.round(entries * 100) / 100,
      totalExits: Math.round(exits * 100) / 100,
      expectedCash: Math.round(cashInDrawerExpected * 100) / 100,
      countedCash: Math.round(data.countedCash * 100) / 100,
      discrepancy,
      status: isMatched ? 'CONCILIADO' : 'DIVERGENTE',
      notes: data.notes,
    };

    setCashClosings((prev) => [newClosing, ...prev]);

    // Audit log for closing and discrepancy
    addAuditLog({
      actionType: isMatched ? 'FECHAMENTO_CAIXA' : 'DIVERGENCIA_CAIXA',
      targetType: 'CAIXA',
      targetReference: `Fechamento ${data.periodLabel}`,
      amountImpact: discrepancy,
      details: `Fechamento de caixa ${data.periodLabel} (${isMatched ? 'Conciliado' : 'Divergente'}). Esperado: ${formatCurrency(cashInDrawerExpected)}, Contado: ${formatCurrency(data.countedCash)}. Diferença: ${formatCurrency(discrepancy)}.`,
      reason: data.notes || 'Fechamento de caixa de turno',
    });

    // Close session
    closeCashSession();

    showToast(
      isMatched
        ? `Fechamento ${data.periodLabel} concluído! Caixa 100% conciliado.`
        : `Fechamento ${data.periodLabel} concluído com divergência de ${formatCurrency(discrepancy)}.`,
      isMatched ? 'success' : 'warning'
    );

    return newClosing;
  };

  // Tips and Service Fee Account
  const releaseTipsDistribution = (amount: number, description: string) => {
    addCashMovement(
      'REPASSE_GORJETA',
      amount,
      'PIX',
      `Repasse de Taxa de Serviço/Gorjetas: ${description}`
    );
    showToast(`Repasse de ${formatCurrency(amount)} registrado com sucesso!`, 'success');
  };

  // Monthly Commissions Calculation & Posting
  const processMonthlyCommissions = (monthYear: string) => {
    const waiters = employees.filter((e) => e.role === 'GARCOM' && e.active);
    let totalCommissions = 0;

    waiters.forEach((waiter) => {
      const waiterComandas = comandas.filter((c) => c.waiterId === waiter.id && c.status === 'PAGA');
      const sales = waiterComandas.reduce((acc, c) => acc + c.total, 0);
      const commission = sales * ((waiter.commissionRate || 10) / 100);

      if (commission > 0) {
        totalCommissions += commission;
        addCashMovement(
          'COMISSAO',
          commission,
          'PIX',
          `Comissão Mensal (${monthYear}) - ${waiter.name} (${waiter.commissionRate}%)`
        );
      }
    });

    showToast(`Comissões de ${monthYear} apuradas e lançadas no caixa: ${formatCurrency(totalCommissions)}!`, 'success');
  };

  // Cash Register
  const openCashSession = (initialCash: number) => {
    const newSession: CashRegisterSession = {
      id: `session-${Date.now().toString(36)}`,
      operatorId: currentUser?.id || 'emp-caixa',
      operatorName: currentUser?.name || 'Operador',
      openedAt: new Date().toISOString(),
      initialCash,
      status: 'ABERTO',
      movements: [
        {
          id: `mov-${Date.now()}`,
          type: 'SUPRIMENTO',
          amount: initialCash,
          paymentMethod: 'DINHEIRO',
          description: 'Fundo de troco inicial de abertura de caixa',
          timestamp: new Date().toISOString(),
          operatorName: currentUser?.name || 'Operador',
        },
      ],
    };
    setCashSession(newSession);
    showToast('Caixa aberto com sucesso!', 'success');
  };

  const closeCashSession = () => {
    setCashSession((prev) => ({
      ...prev,
      status: 'FECHADO',
      closedAt: new Date().toISOString(),
    }));
    showToast('Caixa encerrado com sucesso!', 'info');
  };

  const addCashMovement = (
    type: CashMovementType,
    amount: number,
    paymentMethod: PaymentMethod,
    description: string,
    comandaCode?: string
  ) => {
    const newMov = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      amount,
      paymentMethod,
      description,
      timestamp: new Date().toISOString(),
      operatorName: currentUser?.name || 'Operador',
      comandaCode,
    };

    setCashSession((prev) => ({
      ...prev,
      movements: [newMov, ...prev.movements],
    }));
  };

  // Stock
  const addIngredient = (ingData: Omit<Ingredient, 'id'>) => {
    const newIng: Ingredient = {
      ...ingData,
      id: `ing-${Date.now().toString(36)}`,
    };
    setIngredients((prev) => [...prev, newIng]);
    showToast(`Insumo "${newIng.name}" adicionado ao estoque.`, 'success');
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    showToast('Insumo atualizado.', 'success');
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    showToast('Insumo removido do estoque.', 'info');
  };

  const restockIngredient = (id: string, quantity: number, cost?: number, supplier?: string) => {
    const ing = ingredients.find((i) => i.id === id);
    if (!ing) return;

    setIngredients((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              currentStock: Math.round((i.currentStock + quantity) * 100) / 100,
              costPerUnit: cost !== undefined ? cost : i.costPerUnit,
              supplier: supplier || i.supplier,
              lastRestockedAt: new Date().toISOString().split('T')[0],
            }
          : i
      )
    );

    setStockMovements((prev) => [
      {
        id: `sm-${Date.now()}`,
        ingredientId: id,
        ingredientName: ing.name,
        type: 'ENTRADA',
        quantity,
        unit: ing.unit,
        date: new Date().toISOString(),
        reference: supplier ? `Entrada - ${supplier}` : 'Entrada manual de estoque',
        registeredBy: currentUser?.name || 'Administrador',
      },
      ...prev,
    ]);

    showToast(`Reposição de ${quantity} ${ing.unit} registrada para "${ing.name}"!`, 'success');
  };

  const registerWaste = (recordData: Omit<WasteRecord, 'id' | 'date'>) => {
    const newWaste: WasteRecord = {
      ...recordData,
      id: `waste-${Date.now()}`,
      date: new Date().toISOString(),
    };

    setWasteRecords((prev) => [newWaste, ...prev]);

    // Deduct stock
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === recordData.ingredientId
          ? {
              ...i,
              currentStock: Math.max(0, Math.round((i.currentStock - recordData.quantity) * 100) / 100),
            }
          : i
      )
    );

    // Register movement
    setStockMovements((prev) => [
      {
        id: `sm-${Date.now()}`,
        ingredientId: recordData.ingredientId,
        ingredientName: recordData.ingredientName,
        type: 'PERDA',
        quantity: recordData.quantity,
        unit: recordData.unit,
        date: new Date().toISOString(),
        reference: `Descarte: ${recordData.reason}`,
        registeredBy: recordData.registeredBy,
      },
      ...prev,
    ]);

    addAuditLog({
      actionType: 'AJUSTE_ESTOQUE',
      targetType: 'ESTOQUE',
      targetReference: `${recordData.ingredientName} (${recordData.quantity} ${recordData.unit})`,
      details: `Desperdício/Descarte de ${recordData.quantity} ${recordData.unit} - Custo: R$ ${recordData.estimatedCost.toFixed(2)}`,
      reason: recordData.reason,
      amountImpact: recordData.estimatedCost,
      actorName: recordData.registeredBy,
    });

    showToast(`Perda de ${recordData.quantity} ${recordData.unit} registrada!`, 'warning');
  };

  // Table Management (Admin)
  const addTable = (label: string, capacity: number) => {
    if (!label.trim()) {
      showToast('Nome/número da mesa é obrigatório.', 'error');
      return { success: false, error: 'Nome obrigatório' };
    }
    const maxId = tables.reduce((max, t) => Math.max(max, t.id), 0);
    const newTable: Table = {
      id: maxId + 1,
      label: label.trim(),
      capacity: capacity > 0 ? capacity : 4,
      status: 'LIVRE',
    };
    setTables((prev) => [...prev, newTable]);
    showToast(`Mesa "${newTable.label}" criada com sucesso!`, 'success');
    return { success: true };
  };

  const updateTable = (id: number, updates: { label?: string; capacity?: number }) => {
    const target = tables.find((t) => t.id === id);
    if (!target) {
      return { success: false, error: 'Mesa não encontrada' };
    }
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              label: updates.label !== undefined ? updates.label.trim() : t.label,
              capacity: updates.capacity !== undefined ? updates.capacity : t.capacity,
            }
          : t
      )
    );
    showToast(`Mesa "${updates.label || target.label}" atualizada!`, 'success');
    return { success: true };
  };

  const deleteTable = (id: number) => {
    const target = tables.find((t) => t.id === id);
    if (!target) {
      return { success: false, error: 'Mesa não encontrada' };
    }
    if (target.status === 'OCUPADA' || target.status === 'CONTA_SOLICITADA') {
      showToast('Não é possível excluir uma mesa com comanda ou clientes ativos!', 'error');
      return { success: false, error: 'Mesa ocupada' };
    }
    setTables((prev) => prev.filter((t) => t.id !== id));
    showToast(`Mesa "${target.label}" excluída com sucesso.`, 'success');
    return { success: true };
  };

  // Product Purchase Management (Daily Purchase & Sale Tracking)
  const addProductPurchase = (p: Omit<ProductPurchase, 'id' | 'timestamp'>) => {
    const newPurchase: ProductPurchase = {
      ...p,
      id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setPurchases((prev) => [newPurchase, ...prev]);

    // Automatically increase product stockQuantity for sale
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === p.productId
          ? {
              ...item,
              stockQuantity: (typeof item.stockQuantity === 'number' ? item.stockQuantity : 40) + p.quantity,
              costPrice: p.unitCost > 0 ? p.unitCost : item.costPrice,
            }
          : item
      )
    );

    // Register movement in cash flow
    setCashSession((prev) => ({
      ...prev,
      movements: [
        {
          id: `mov-${Date.now()}`,
          type: 'DESPESA',
          amount: p.totalCost,
          paymentMethod: 'DINHEIRO',
          description: `Compra de estoque: ${p.quantity}x ${p.productName}`,
          operatorName: p.registeredBy || currentUser?.name || 'Admin',
          timestamp: new Date().toISOString(),
        },
        ...prev.movements,
      ],
    }));

    showToast(`Compra registrada: +${p.quantity} un de ${p.productName}!`, 'success');
  };

  const value: ChurrasContextType = {
    currentUser,
    employees,
    menuItems,
    tables,
    comandas,
    cashSession,
    settings,
    ingredients,
    wasteRecords,
    stockMovements,
    lowStockIngredients,
    bills,
    cashClosings,
    auditLogs,
    toasts,
    purchases,
    addProductPurchase,
    addTable,
    updateTable,
    deleteTable,
    loginWithEmail,
    loginStaffWithGmail,
    loginWithPin,
    logout,
    switchUser,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    resetCredentials,
    addMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    deleteMenuItem,
    openComanda,
    openDeliveryComanda,
    addItemsToComanda,
    requestBill,
    toggleServiceFee,
    transferComanda,
    transferItems,
    mergeComandas,
    reserveTable,
    cancelReservation,
    updateOrderItemStatus,
    payComanda,
    cancelComanda,
    refundComanda,
    addExpenseBill,
    payExpenseBill,
    deleteExpenseBill,
    closeShiftCash,
    releaseTipsDistribution,
    processMonthlyCommissions,
    openCashSession,
    closeCashSession,
    addCashMovement,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    restockIngredient,
    registerWaste,
    updateSettings,
    addAuditLog,
    showToast,
    removeToast,
  };

  return <ChurrasContext.Provider value={value}>{children}</ChurrasContext.Provider>;
};

export const useChurras = (): ChurrasContextType => {
  const context = useContext(ChurrasContext);
  if (!context) {
    throw new Error('useChurras must be used within a ChurrasProvider');
  }
  return context;
};
