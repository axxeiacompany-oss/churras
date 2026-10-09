import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Employee,
  MenuItem,
  Table,
  Comanda,
  OrderItem,
  OrderItemStatus,
  CashRegisterSession,
  PaymentTransaction,
  MeatDoneness,
  RestaurantSettings,
  CashMovement,
  OrderType,
  Ingredient,
  WasteRecord,
  StockMovement,
  WasteReason,
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
} from '../data/initialData';
import { soundManager } from '../utils/audio';

interface ChurrasContextType {
  currentUser: Employee | null;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => { success: boolean; error?: string };
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  resetCredentials: (employeeId: string, newPassword?: string, newPin?: string) => void;
  switchUser: (employeeId: string) => void;
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => { success: boolean; error?: string };
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  tables: Table[];
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  toggleMenuItemAvailability: (id: string) => void;

  // 5. Cardápio e Estoque de Insumos
  ingredients: Ingredient[];
  addIngredient: (item: Omit<Ingredient, 'id'>) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  restockIngredient: (
    id: string,
    quantity: number,
    costPerUnit?: number,
    supplier?: string
  ) => void;
  wasteRecords: WasteRecord[];
  registerWaste: (record: Omit<WasteRecord, 'id' | 'date'>) => void;
  stockMovements: StockMovement[];
  lowStockIngredients: Ingredient[];

  comandas: Comanda[];
  openComanda: (
    tableId: number,
    waiterId: string,
    details: {
      customerName?: string;
      peopleCount: number;
      hasRodizio: boolean;
      rodizioAdultCount: number;
      rodizioChildCount: number;
      rodizioSeniorCount?: number;
      orderType?: OrderType;
      customerPhone?: string;
      deliveryAddress?: string;
      deliveryFee?: number;
    }
  ) => Comanda;
  openDeliveryComanda: (data: {
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    deliveryFee?: number;
    orderType: OrderType;
    waiterId?: string;
  }) => Comanda;
  addItemsToComanda: (
    comandaId: string,
    newItems: Array<{
      menuItemId: string;
      quantity: number;
      doneness?: MeatDoneness;
      notes?: string;
      weightInKg?: number;
    }>
  ) => void;
  updateOrderItemStatus: (itemId: string, newStatus: OrderItemStatus) => void;
  requestBill: (comandaId: string) => void;
  toggleServiceFee: (comandaId: string) => void;
  transferComanda: (sourceTableId: number, targetTableId: number) => { success: boolean; error?: string };
  transferItems: (
    sourceComandaId: string,
    targetComandaId: string,
    itemIds: string[]
  ) => { success: boolean; error?: string };
  mergeComandas: (sourceTableId: number, targetTableId: number) => { success: boolean; error?: string };
  reserveTable: (tableId: number, customerName: string, phone?: string, time?: string) => void;
  cancelReservation: (tableId: number) => void;
  processPayment: (
    comandaId: string,
    payments: PaymentTransaction[],
    discount?: number,
    includeService?: boolean
  ) => void;
  cancelComanda: (comandaId: string) => void;

  cashSession: CashRegisterSession;
  openCashSession: (operatorId: string, initialCash: number) => void;
  closeCashSession: (countedCash: number, closingNotes?: string) => void;
  addCashMovement: (type: 'SANGRIA' | 'SUPRIMENTO', amount: number, description: string) => void;

  settings: RestaurantSettings;
  updateSettings: (updates: Partial<RestaurantSettings>) => void;
  resetDemoData: () => void;

  toast: { message: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const STORAGE_KEY_PREFIX = 'churrasgestao_v1_';

const ChurrasContext = createContext<ChurrasContextType | undefined>(undefined);

export const ChurrasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe LocalStorage helpers
  const loadStorage = <T,>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const [settings, setSettings] = useState<RestaurantSettings>(() =>
    loadStorage('settings', INITIAL_SETTINGS)
  );

  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadStorage('employees', INITIAL_EMPLOYEES)
  );

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return loadStorage<string | null>('current_user_id', INITIAL_EMPLOYEES[0].id);
  });

  const [tables, setTables] = useState<Table[]>(() =>
    loadStorage('tables', INITIAL_TABLES)
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    loadStorage('menu_items', INITIAL_MENU_ITEMS)
  );

  const [comandas, setComandas] = useState<Comanda[]>(() =>
    loadStorage('comandas', INITIAL_COMANDAS)
  );

  const [cashSession, setCashSession] = useState<CashRegisterSession>(() =>
    loadStorage('cash_session', INITIAL_CASH_SESSION)
  );

  // 5. Insumos e Estoque State
  const [ingredients, setIngredients] = useState<Ingredient[]>(() =>
    loadStorage('ingredients', INITIAL_INGREDIENTS)
  );

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() =>
    loadStorage('waste_records', INITIAL_WASTE_RECORDS)
  );

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadStorage('stock_movements', INITIAL_STOCK_MOVEMENTS)
  );

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'employees', JSON.stringify(employees));
    } catch {}
  }, [employees]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'current_user_id', JSON.stringify(currentUserId));
      } else {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_user_id');
      }
    } catch {}
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'tables', JSON.stringify(tables));
    } catch {}
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'menu_items', JSON.stringify(menuItems));
    } catch {}
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'comandas', JSON.stringify(comandas));
    } catch {}
  }, [comandas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_session', JSON.stringify(cashSession));
    } catch {}
  }, [cashSession]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'ingredients', JSON.stringify(ingredients));
    } catch {}
  }, [ingredients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'waste_records', JSON.stringify(wasteRecords));
    } catch {}
  }, [wasteRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'stock_movements', JSON.stringify(stockMovements));
    } catch {}
  }, [stockMovements]);

  useEffect(() => {
    soundManager.setEnabled(settings.enableSoundAlerts);
  }, [settings.enableSoundAlerts]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return employees.find((e) => e.id === currentUserId) || null;
  }, [employees, currentUserId]);

  const isAuthenticated = Boolean(currentUser);

  // Authentication methods
  const loginWithEmail = (email: string, password: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const emp = employees.find((e) => e.email.toLowerCase() === cleanEmail);

    if (!emp) {
      return { success: false, error: 'E-mail não encontrado no sistema.' };
    }

    if (emp.password && emp.password !== cleanPass) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    if (!emp.active) {
      return { success: false, error: 'Esta conta foi desativada pelo administrador.' };
    }

    setCurrentUserId(emp.id);
    showToast(`Bem-vindo(a), ${emp.name}! Acesso autorizado como ${emp.role}.`, 'success');
    return { success: true };
  };

  const loginWithPin = (pin: string): { success: boolean; error?: string } => {
    const cleanPin = pin.trim();

    const emp = employees.find((e) => e.pin === cleanPin);

    if (!emp) {
      return { success: false, error: 'PIN numérico não reconhecido. Digite os 4 dígitos corretos.' };
    }

    if (!emp.active) {
      return { success: false, error: 'Esta conta foi desativada pelo administrador.' };
    }

    setCurrentUserId(emp.id);
    showToast(`Acesso rápido autenticado: ${emp.name} (${emp.role}).`, 'success');
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const resetCredentials = (employeeId: string, newPassword?: string, newPin?: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            password: newPassword !== undefined && newPassword.trim() !== '' ? newPassword.trim() : emp.password,
            pin: newPin !== undefined && newPin.trim() !== '' ? newPin.trim() : emp.pin,
          };
        }
        return emp;
      })
    );
    showToast('Credenciais redefinidas com sucesso pela gerência.', 'success');
  };

  const switchUser = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      if (!emp.active) {
        showToast('Não é possível alternar para uma conta inativa.', 'warning');
        return;
      }
      setCurrentUserId(employeeId);
      showToast(`Perfil alterado para ${emp.name} (${emp.role})`, 'info');
    }
  };

  // Staff management (Admin-only)
  const addEmployee = (empData: Omit<Employee, 'id'>): { success: boolean; error?: string } => {
    const cleanEmail = empData.email.trim().toLowerCase();

    // Check if email already exists
    if (employees.some((e) => e.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Já existe um funcionário cadastrado com este e-mail.' };
    }

    // Check if PIN already used
    if (employees.some((e) => e.pin === empData.pin.trim())) {
      return { success: false, error: 'Este PIN numérico já está em uso por outro funcionário. Escolha outro.' };
    }

    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      email: cleanEmail,
      pin: empData.pin.trim(),
      password: empData.password || '123456',
    };
    setEmployees((prev) => [...prev, newEmp]);
    showToast(`Conta de ${newEmp.name} criada com sucesso!`, 'success');
    return { success: true };
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp))
    );
    showToast('Cadastro de funcionário atualizado.', 'success');
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    showToast('Funcionário removido.', 'warning');
  };

  // Menu items management
  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `menu-${Date.now()}`,
    };
    setMenuItems((prev) => [...prev, newItem]);
    showToast(`Item "${newItem.name}" adicionado ao cardápio!`, 'success');
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    showToast('Item do cardápio atualizado.', 'success');
  };

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = !item.available;
          showToast(`Item "${item.name}" ${updated ? 'disponível' : 'pausado / esgotado'}.`, updated ? 'success' : 'warning');
          return { ...item, available: updated };
        }
        return item;
      })
    );
  };

  // 5. Insumos e Controle de Estoque
  const lowStockIngredients = useMemo(() => {
    return ingredients.filter((ing) => ing.currentStock <= ing.minStock);
  }, [ingredients]);

  const addIngredient = (itemData: Omit<Ingredient, 'id'>) => {
    const newIng: Ingredient = {
      ...itemData,
      id: `ing-${Date.now()}`,
      lastRestockedAt: new Date().toISOString(),
    };
    setIngredients((prev) => [...prev, newIng]);
    showToast(`Insumo "${newIng.name}" cadastrado com sucesso!`, 'success');
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    );
    showToast('Insumo atualizado.', 'success');
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    showToast('Insumo removido do estoque.', 'warning');
  };

  const restockIngredient = (
    id: string,
    quantity: number,
    costPerUnit?: number,
    supplier?: string
  ) => {
    const target = ingredients.find((i) => i.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === id) {
          return {
            ...ing,
            currentStock: Math.round((ing.currentStock + quantity) * 1000) / 1000,
            costPerUnit: costPerUnit !== undefined ? costPerUnit : ing.costPerUnit,
            supplier: supplier !== undefined ? supplier : ing.supplier,
            lastRestockedAt: now,
          };
        }
        return ing;
      })
    );

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      ingredientId: target.id,
      ingredientName: target.name,
      type: 'ENTRADA',
      quantity,
      unit: target.unit,
      date: now,
      reference: supplier ? `Entrada Fornecedor: ${supplier}` : 'Entrada / Reposição de Estoque',
      registeredBy: currentUser?.name || 'Gestor de Estoque',
    };

    setStockMovements((prev) => [movement, ...prev]);
    showToast(
      `Reposição de ${quantity} ${target.unit} de "${target.name}" registrada com sucesso!`,
      'success'
    );
  };

  const registerWaste = (recordData: Omit<WasteRecord, 'id' | 'date'>) => {
    const target = ingredients.find((i) => i.id === recordData.ingredientId);
    if (!target) return;

    const now = new Date().toISOString();
    const wasteRecord: WasteRecord = {
      ...recordData,
      id: `waste-${Date.now()}`,
      date: now,
    };

    // Deduct from stock
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === recordData.ingredientId) {
          const newQty = Math.max(0, ing.currentStock - recordData.quantity);
          return {
            ...ing,
            currentStock: Math.round(newQty * 1000) / 1000,
          };
        }
        return ing;
      })
    );

    setWasteRecords((prev) => [wasteRecord, ...prev]);

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      ingredientId: target.id,
      ingredientName: target.name,
      type: 'PERDA',
      quantity: recordData.quantity,
      unit: target.unit,
      date: now,
      reference: `Perda: ${recordData.reason} (${recordData.notes || 'Sem observações'})`,
      registeredBy: recordData.registeredBy,
    };

    setStockMovements((prev) => [movement, ...prev]);
    showToast(
      `Registro de perda de ${recordData.quantity} ${target.unit} de "${target.name}" salvo.`,
      'warning'
    );
  };

  // Baixa automática no estoque ao vender (ficha técnica simples)
  const deductStockForItems = (
    itemsToDeduct: Array<{ menuItemId: string; quantity: number }>,
    comandaCode: string
  ) => {
    setIngredients((prevIngredients) => {
      const updated = [...prevIngredients];
      const movementsToAdd: StockMovement[] = [];
      const lowStockAlerts: string[] = [];
      const now = new Date().toISOString();

      itemsToDeduct.forEach((item) => {
        const menuItem = menuItems.find((m) => m.id === item.menuItemId);
        if (!menuItem?.recipe || menuItem.recipe.length === 0) return;

        menuItem.recipe.forEach((r) => {
          const ingIndex = updated.findIndex((i) => i.id === r.ingredientId);
          if (ingIndex !== -1) {
            const ing = updated[ingIndex];
            const consumedQty = r.quantity * item.quantity;
            const newStock = Math.max(0, ing.currentStock - consumedQty);

            updated[ingIndex] = {
              ...ing,
              currentStock: Math.round(newStock * 1000) / 1000,
            };

            movementsToAdd.push({
              id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              ingredientId: ing.id,
              ingredientName: ing.name,
              type: 'BAIXA_VENDA',
              quantity: Math.round(consumedQty * 1000) / 1000,
              unit: ing.unit,
              date: now,
              reference: `Venda ${comandaCode} (${menuItem.name})`,
              registeredBy: currentUser?.name || 'Ficha Técnica Automática',
            });

            // Alert trigger if drops to or below minStock
            if (newStock <= ing.minStock && ing.currentStock > ing.minStock) {
              lowStockAlerts.push(`${ing.name} (${newStock.toFixed(1)} ${ing.unit})`);
            }
          }
        });
      });

      if (movementsToAdd.length > 0) {
        setStockMovements((prevMov) => [...movementsToAdd, ...prevMov]);
      }

      if (lowStockAlerts.length > 0) {
        showToast(
          `⚠️ Alerta de Estoque Mínimo atingido: ${lowStockAlerts.join(', ')}`,
          'warning'
        );
      }

      return updated;
    });
  };

  // Table & Comanda logic
  const openComanda = (
    tableId: number,
    waiterId: string,
    details: {
      customerName?: string;
      peopleCount: number;
      hasRodizio: boolean;
      rodizioAdultCount: number;
      rodizioChildCount: number;
      rodizioSeniorCount?: number;
      orderType?: OrderType;
      customerPhone?: string;
      deliveryAddress?: string;
      deliveryFee?: number;
    }
  ): Comanda => {
    const table = tables.find((t) => t.id === tableId);
    const waiter = employees.find((e) => e.id === waiterId) || currentUser || employees[0];
    const orderType: OrderType = details.orderType || (tableId > 0 ? 'MESA' : 'DELIVERY');
    const code = orderType === 'DELIVERY'
      ? `DEL-${Math.floor(100 + Math.random() * 900)}`
      : orderType === 'RETIRADA'
      ? `RET-${Math.floor(100 + Math.random() * 900)}`
      : `CMD-${Math.floor(100 + Math.random() * 900)}`;
    const comandaId = `cmd-${Date.now()}`;
    const now = new Date().toISOString();
    const tableLabel = tableId > 0 ? (table?.label || `Mesa ${tableId}`) : (orderType === 'DELIVERY' ? 'Delivery' : 'Balcão / Retirada');

    const items: OrderItem[] = [];

    // Auto-add rodizios if selected
    if (details.hasRodizio) {
      if (details.rodizioAdultCount > 0) {
        items.push({
          id: `ord-${Date.now()}-1`,
          menuItemId: 'menu-rod-adult',
          name: 'Rodízio Completo Prime (Adulto)',
          price: settings.rodizioAdultPrice,
          quantity: details.rodizioAdultCount,
          prepStation: 'GRELHA',
          status: 'PENDENTE',
          createdAt: now,
          tableId,
          tableLabel,
          comandaCode: code,
          waiterId: waiter.id,
          waiterName: waiter.name,
        });
      }
      if (details.rodizioChildCount > 0) {
        items.push({
          id: `ord-${Date.now()}-2`,
          menuItemId: 'menu-rod-child',
          name: 'Rodízio Infantil (6 a 10 anos)',
          price: settings.rodizioChildPrice,
          quantity: details.rodizioChildCount,
          prepStation: 'GRELHA',
          status: 'PENDENTE',
          createdAt: now,
          tableId,
          tableLabel,
          comandaCode: code,
          waiterId: waiter.id,
          waiterName: waiter.name,
        });
      }
      if ((details.rodizioSeniorCount || 0) > 0) {
        items.push({
          id: `ord-${Date.now()}-3`,
          menuItemId: 'menu-rod-senior',
          name: 'Rodízio Melhor Idade / Sênior (60+ anos)',
          price: settings.rodizioSeniorPrice,
          quantity: details.rodizioSeniorCount!,
          prepStation: 'GRELHA',
          status: 'PENDENTE',
          createdAt: now,
          tableId,
          tableLabel,
          comandaCode: code,
          waiterId: waiter.id,
          waiterName: waiter.name,
        });
      }
    }

    const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const includeService = orderType === 'MESA'; // Mesas incluem 10% por padrão, delivery não
    const serviceFee = includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
    const deliveryFee = details.deliveryFee || 0;
    const total = subtotal + serviceFee + deliveryFee;

    const newComanda: Comanda = {
      id: comandaId,
      code,
      orderType,
      tableId,
      tableLabel,
      waiterId: waiter.id,
      waiterName: waiter.name,
      customerName: details.customerName || (tableId > 0 ? `Cliente ${tableLabel}` : 'Cliente Delivery'),
      customerPhone: details.customerPhone,
      deliveryAddress: details.deliveryAddress,
      deliveryFee,
      peopleCount: details.peopleCount,
      hasRodizio: details.hasRodizio,
      rodizioAdultCount: details.rodizioAdultCount,
      rodizioChildCount: details.rodizioChildCount,
      rodizioSeniorCount: details.rodizioSeniorCount || 0,
      items,
      status: 'ABERTA',
      openedAt: now,
      includeService,
      discountAmount: 0,
      subtotal,
      serviceFee,
      total,
      payments: [],
    };

    setComandas((prev) => [newComanda, ...prev]);

    // Update table status if tableId > 0
    if (tableId > 0) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: 'OCUPADA',
                currentComandaId: comandaId,
                assignedWaiterId: waiter.id,
                customerName: newComanda.customerName,
                peopleCount: details.peopleCount,
                openedAt: now,
              }
            : t
        )
      );
    }

    if (items.length > 0) {
      soundManager.playNewOrderAlert();
      deductStockForItems(
        items.map((it) => ({ menuItemId: it.menuItemId, quantity: it.quantity })),
        code
      );
    }
    showToast(`Comanda ${code} aberta para ${tableLabel} com sucesso!`, 'success');
    return newComanda;
  };

  const openDeliveryComanda = (data: {
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    deliveryFee?: number;
    orderType: OrderType;
    waiterId?: string;
  }): Comanda => {
    return openComanda(0, data.waiterId || currentUser?.id || employees[0]?.id || 'emp-caixa', {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      deliveryFee: data.deliveryFee || (data.orderType === 'DELIVERY' ? 15 : 0),
      orderType: data.orderType,
      peopleCount: 1,
      hasRodizio: false,
      rodizioAdultCount: 0,
      rodizioChildCount: 0,
      rodizioSeniorCount: 0,
    });
  };

  const addItemsToComanda = (
    comandaId: string,
    newItems: Array<{
      menuItemId: string;
      quantity: number;
      doneness?: MeatDoneness;
      notes?: string;
      weightInKg?: number;
    }>
  ) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const now = new Date().toISOString();
    const createdOrderItems: OrderItem[] = newItems.map((it, idx) => {
      const menuItem = menuItems.find((m) => m.id === it.menuItemId);
      const isWeighed = menuItem?.isWeighed || false;
      const weightInKg = it.weightInKg;
      // If weighed item, calculate price = pricePerKg * weightInKg
      const calculatedPrice = isWeighed && weightInKg
        ? menuItem?.price ? menuItem.price * weightInKg : 0
        : (menuItem?.price || 0);

      const itemName = isWeighed && weightInKg
        ? `${menuItem?.name || 'Item'} (${weightInKg.toFixed(3)} kg)`
        : (menuItem?.name || 'Item do Cardápio');

      return {
        id: `ord-${Date.now()}-${idx}`,
        menuItemId: it.menuItemId,
        name: itemName,
        price: calculatedPrice,
        quantity: it.quantity,
        weightInKg,
        isWeighed,
        doneness: it.doneness,
        notes: it.notes,
        prepStation: menuItem?.prepStation || 'COZINHA',
        status: 'PENDENTE',
        createdAt: now,
        tableId: comanda.tableId,
        tableLabel: comanda.tableLabel,
        comandaCode: comanda.code,
        waiterId: currentUser?.id || comanda.waiterId,
        waiterName: currentUser?.name || comanda.waiterName,
      };
    });

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId) {
          const updatedItems = [...c.items, ...createdOrderItems];
          const subtotal = updatedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
          const serviceFee = c.includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
          const total = Math.max(0, subtotal + serviceFee + (c.deliveryFee || 0) - c.discountAmount);
          return {
            ...c,
            items: updatedItems,
            subtotal,
            serviceFee,
            total,
          };
        }
        return c;
      })
    );

    soundManager.playNewOrderAlert();
    deductStockForItems(
      newItems.map((it) => ({ menuItemId: it.menuItemId, quantity: it.quantity })),
      comanda.code
    );
    showToast(`${createdOrderItems.length} novo(s) item(ns) enviado(s) para a cozinha/churrasqueira em tempo real!`, 'success');
  };

  const toggleServiceFee = (comandaId: string) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId) {
          const newInclude = !c.includeService;
          const subtotal = c.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
          const serviceFee = newInclude ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
          const total = Math.max(0, subtotal + serviceFee + (c.deliveryFee || 0) - c.discountAmount);
          showToast(newInclude ? 'Taxa de serviço (10%) adicionada.' : 'Taxa de serviço (10%) removida.', 'info');
          return {
            ...c,
            includeService: newInclude,
            serviceFee,
            total,
          };
        }
        return c;
      })
    );
  };

  const transferComanda = (
    sourceTableId: number,
    targetTableId: number
  ): { success: boolean; error?: string } => {
    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);

    if (!sourceTable || !sourceTable.currentComandaId) {
      return { success: false, error: 'Mesa de origem não possui comanda aberta.' };
    }
    if (!targetTable) {
      return { success: false, error: 'Mesa de destino não encontrada.' };
    }
    if (targetTable.status !== 'LIVRE') {
      return {
        success: false,
        error: `A ${targetTable.label} não está livre. Para unificar contas, utilize a opção "Juntar Mesas".`,
      };
    }

    const comandaId = sourceTable.currentComandaId;
    const now = new Date().toISOString();

    // Update comanda
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId) {
          const updatedItems = c.items.map((it) => ({
            ...it,
            tableId: targetTable.id,
            tableLabel: targetTable.label,
          }));
          return {
            ...c,
            tableId: targetTable.id,
            tableLabel: targetTable.label,
            items: updatedItems,
          };
        }
        return c;
      })
    );

    // Free source table, occupy target table
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
            status: 'OCUPADA',
            currentComandaId: comandaId,
            assignedWaiterId: sourceTable.assignedWaiterId,
            customerName: sourceTable.customerName,
            peopleCount: sourceTable.peopleCount,
            openedAt: sourceTable.openedAt || now,
          };
        }
        return t;
      })
    );

    soundManager.playNewOrderAlert();
    showToast(`Comanda transferida da ${sourceTable.label} para a ${targetTable.label}!`, 'success');
    return { success: true };
  };

  const transferItems = (
    sourceComandaId: string,
    targetComandaId: string,
    itemIds: string[]
  ): { success: boolean; error?: string } => {
    const source = comandas.find((c) => c.id === sourceComandaId);
    const target = comandas.find((c) => c.id === targetComandaId);

    if (!source || !target) {
      return { success: false, error: 'Comandas de origem ou destino não encontradas.' };
    }
    if (itemIds.length === 0) {
      return { success: false, error: 'Selecione ao menos um item para transferir.' };
    }

    const itemsToMove = source.items.filter((it) => itemIds.includes(it.id));
    const itemsRemainingInSource = source.items.filter((it) => !itemIds.includes(it.id));

    const movedItemsForTarget = itemsToMove.map((it) => ({
      ...it,
      tableId: target.tableId,
      tableLabel: target.tableLabel,
      comandaCode: target.code,
    }));

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === sourceComandaId) {
          const subtotal = itemsRemainingInSource.reduce((acc, it) => acc + it.price * it.quantity, 0);
          const serviceFee = c.includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
          const total = Math.max(0, subtotal + serviceFee + (c.deliveryFee || 0) - c.discountAmount);
          return {
            ...c,
            items: itemsRemainingInSource,
            subtotal,
            serviceFee,
            total,
          };
        }
        if (c.id === targetComandaId) {
          const newItems = [...c.items, ...movedItemsForTarget];
          const subtotal = newItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
          const serviceFee = c.includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
          const total = Math.max(0, subtotal + serviceFee + (c.deliveryFee || 0) - c.discountAmount);
          return {
            ...c,
            items: newItems,
            subtotal,
            serviceFee,
            total,
          };
        }
        return c;
      })
    );

    showToast(`${itemIds.length} item(ns) transferido(s) de ${source.tableLabel} para ${target.tableLabel}!`, 'success');
    return { success: true };
  };

  const mergeComandas = (
    sourceTableId: number,
    targetTableId: number
  ): { success: boolean; error?: string } => {
    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);

    if (!sourceTable?.currentComandaId || !targetTable?.currentComandaId) {
      return { success: false, error: 'Ambas as mesas devem possuir comandas ativas para unificar a conta.' };
    }

    const sourceComanda = comandas.find((c) => c.id === sourceTable.currentComandaId);
    const targetComanda = comandas.find((c) => c.id === targetTable.currentComandaId);

    if (!sourceComanda || !targetComanda) {
      return { success: false, error: 'Comandas não localizadas.' };
    }

    const movedItems = sourceComanda.items.map((it) => ({
      ...it,
      tableId: targetTable.id,
      tableLabel: targetTable.label,
      comandaCode: targetComanda.code,
    }));

    setComandas((prev) =>
      prev
        .filter((c) => c.id !== sourceComanda.id)
        .map((c) => {
          if (c.id === targetComanda.id) {
            const combinedItems = [...c.items, ...movedItems];
            const subtotal = combinedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
            const serviceFee = c.includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
            const total = Math.max(0, subtotal + serviceFee + (c.deliveryFee || 0) - c.discountAmount);
            return {
              ...c,
              items: combinedItems,
              peopleCount: c.peopleCount + sourceComanda.peopleCount,
              rodizioAdultCount: c.rodizioAdultCount + sourceComanda.rodizioAdultCount,
              rodizioChildCount: c.rodizioChildCount + sourceComanda.rodizioChildCount,
              rodizioSeniorCount: (c.rodizioSeniorCount || 0) + (sourceComanda.rodizioSeniorCount || 0),
              subtotal,
              serviceFee,
              total,
            };
          }
          return c;
        })
    );

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
            peopleCount: t.peopleCount + sourceTable.peopleCount,
          };
        }
        return t;
      })
    );

    soundManager.playNewOrderAlert();
    showToast(`Conta da ${sourceTable.label} juntada com sucesso na ${targetTable.label}!`, 'success');
    return { success: true };
  };

  const reserveTable = (tableId: number, customerName: string, phone?: string, time?: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'RESERVADA',
              customerName,
              reservationCustomerName: customerName,
              reservationPhone: phone,
              reservationTime: time || 'Horário reservado',
            }
          : t
      )
    );
    showToast(`Mesa ${tableId} reservada com sucesso para ${customerName}!`, 'success');
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
              peopleCount: 0,
            }
          : t
      )
    );
    showToast(`Reserva da Mesa ${tableId} cancelada. Mesa liberada!`, 'info');
  };

  const updateOrderItemStatus = (itemId: string, newStatus: OrderItemStatus) => {
    const now = new Date().toISOString();
    let dishName = '';

    setComandas((prev) =>
      prev.map((comanda) => {
        const itemIdx = comanda.items.findIndex((i) => i.id === itemId);
        if (itemIdx === -1) return comanda;

        const updatedItems = [...comanda.items];
        const item = updatedItems[itemIdx];
        dishName = item.name;

        updatedItems[itemIdx] = {
          ...item,
          status: newStatus,
          startedAt: newStatus === 'EM_PREPARO' ? (item.startedAt || now) : item.startedAt,
          readyAt: newStatus === 'PRONTO' ? now : item.readyAt,
        };

        return { ...comanda, items: updatedItems };
      })
    );

    if (newStatus === 'PRONTO') {
      soundManager.playOrderReady();
      showToast(`🔥 Pedido pronto: ${dishName}! Notificando garçom.`, 'success');
    } else if (newStatus === 'EM_PREPARO') {
      showToast(`🔪 ${dishName} entrou em preparo na grelha/cozinha.`, 'info');
    } else if (newStatus === 'ENTREGUE') {
      showToast(`✅ ${dishName} entregue ao cliente.`, 'info');
    }
  };

  const requestBill = (comandaId: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    setComandas((prev) =>
      prev.map((c) => (c.id === comandaId ? { ...c, status: 'CONTA_SOLICITADA' } : c))
    );

    setTables((prev) =>
      prev.map((t) => (t.id === comanda.tableId ? { ...t, status: 'CONTA_SOLICITADA' } : t))
    );

    showToast(`Conta da ${comanda.tableLabel} solicitada ao Caixa!`, 'info');
  };

  const processPayment = (
    comandaId: string,
    payments: PaymentTransaction[],
    discount: number = 0,
    includeService: boolean = true
  ) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const now = new Date().toISOString();
    const subtotal = comanda.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const serviceFee = includeService ? subtotal * (settings.serviceTaxPercentage / 100) : 0;
    const finalTotal = Math.max(0, subtotal + serviceFee + (comanda.deliveryFee || 0) - discount);

    // Update comanda
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId) {
          return {
            ...c,
            status: 'PAGA',
            closedAt: now,
            discountAmount: discount,
            includeService,
            subtotal,
            serviceFee,
            total: finalTotal,
            payments,
          };
        }
        return c;
      })
    );

    // Free the table if it is a salon table
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

    // Register cash movements in the current cash session
    const newMovements: CashMovement[] = payments.map((p, idx) => ({
      id: `mov-${Date.now()}-${idx}`,
      type: 'VENDA',
      amount: p.amount,
      paymentMethod: p.method,
      description: `Pagamento ${comanda.code} (${comanda.tableLabel})`,
      timestamp: now,
      operatorName: currentUser?.name || 'Operador de Caixa',
      comandaCode: comanda.code,
    }));

    setCashSession((prev) => ({
      ...prev,
      movements: [...prev.movements, ...newMovements],
    }));

    soundManager.playCashSuccess();
    showToast(`Pagamento da ${comanda.code} registrado com sucesso! Mesa liberada.`, 'success');
  };

  const cancelComanda = (comandaId: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    setComandas((prev) =>
      prev.map((c) => (c.id === comandaId ? { ...c, status: 'CANCELADA' } : c))
    );

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
              }
            : t
        )
      );
    }

    showToast(`Comanda ${comanda.code} cancelada e mesa desocupada.`, 'warning');
  };

  // Cash Session
  const openCashSession = (operatorId: string, initialCash: number) => {
    const operator = employees.find((e) => e.id === operatorId) || currentUser || employees[0];
    const opId = operator?.id || 'emp-caixa';
    const opName = operator?.name || 'Operador de Caixa';
    const now = new Date().toISOString();

    const newSession: CashRegisterSession = {
      id: `session-${Date.now()}`,
      operatorId: opId,
      operatorName: opName,
      openedAt: now,
      initialCash,
      status: 'ABERTO',
      movements: [
        {
          id: `mov-${Date.now()}`,
          type: 'SUPRIMENTO',
          amount: initialCash,
          paymentMethod: 'DINHEIRO',
          description: 'Abertura de Caixa - Fundo de Troco',
          timestamp: now,
          operatorName: opName,
        },
      ],
    };

    setCashSession(newSession);
    soundManager.playCashSuccess();
    showToast(`Caixa aberto por ${opName} com fundo de R$ ${initialCash.toFixed(2)}`, 'success');
  };

  const closeCashSession = (countedCash: number, closingNotes?: string) => {
    const now = new Date().toISOString();

    // Calculate total cash expected
    const cashTotal = cashSession.movements.reduce((acc, m) => {
      if (m.paymentMethod === 'DINHEIRO') {
        if (m.type === 'VENDA' || m.type === 'SUPRIMENTO') return acc + m.amount;
        if (m.type === 'SANGRIA' || m.type === 'ESTORNO') return acc - m.amount;
      }
      return acc;
    }, 0);

    const discrepancy = countedCash - cashTotal;

    setCashSession((prev) => ({
      ...prev,
      status: 'FECHADO',
      closedAt: now,
      countedCash,
      discrepancy,
      closingNotes,
    }));

    showToast(
      `Caixa fechado com sucesso! Diferença apurada: R$ ${discrepancy.toFixed(2)}`,
      Math.abs(discrepancy) < 0.05 ? 'success' : 'warning'
    );
  };

  const addCashMovement = (type: 'SANGRIA' | 'SUPRIMENTO', amount: number, description: string) => {
    const now = new Date().toISOString();
    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      type,
      amount,
      paymentMethod: 'DINHEIRO',
      description,
      timestamp: now,
      operatorName: currentUser?.name || 'Operador',
    };

    setCashSession((prev) => ({
      ...prev,
      movements: [...prev.movements, movement],
    }));

    showToast(
      `${type === 'SANGRIA' ? 'Sangria' : 'Suprimento'} de R$ ${amount.toFixed(2)} registrado!`,
      type === 'SANGRIA' ? 'warning' : 'success'
    );
  };

  const updateSettings = (updates: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Configurações atualizadas!', 'success');
  };

  const resetDemoData = () => {
    localStorage.clear();
    setSettings(INITIAL_SETTINGS);
    setEmployees(INITIAL_EMPLOYEES);
    setCurrentUserId(INITIAL_EMPLOYEES[0].id);
    setTables(INITIAL_TABLES);
    setMenuItems(INITIAL_MENU_ITEMS);
    setComandas(INITIAL_COMANDAS);
    setCashSession(INITIAL_CASH_SESSION);
    setIngredients(INITIAL_INGREDIENTS);
    setWasteRecords(INITIAL_WASTE_RECORDS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    showToast('Dados de demonstração restaurados com sucesso!', 'info');
  };

  return (
    <ChurrasContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loginWithEmail,
        loginWithPin,
        logout,
        resetCredentials,
        switchUser,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        tables,
        menuItems,
        addMenuItem,
        updateMenuItem,
        toggleMenuItemAvailability,
        ingredients,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        restockIngredient,
        wasteRecords,
        registerWaste,
        stockMovements,
        lowStockIngredients,
        comandas,
        openComanda,
        openDeliveryComanda,
        addItemsToComanda,
        updateOrderItemStatus,
        requestBill,
        toggleServiceFee,
        transferComanda,
        transferItems,
        mergeComandas,
        reserveTable,
        cancelReservation,
        processPayment,
        cancelComanda,
        cashSession,
        openCashSession,
        closeCashSession,
        addCashMovement,
        settings,
        updateSettings,
        resetDemoData,
        toast,
        showToast,
      }}
    >
      {children}
    </ChurrasContext.Provider>
  );
};

export const useChurras = () => {
  const context = useContext(ChurrasContext);
  if (!context) {
    throw new Error('useChurras must be used within a ChurrasProvider');
  }
  return context;
};
