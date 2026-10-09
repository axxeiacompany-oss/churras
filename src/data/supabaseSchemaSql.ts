export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- CHURRASGESTÃO - SUPABASE (POSTGRESQL + AUTH + REALTIME + RLS) SCHEMA
-- Sistema Completo de Gestão de Churrascaria Prime
-- Moeda: BRL (R$) e Guarani (₲ / Gs.)
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELA: PROFILES (Perfis de Usuários com RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CAIXA', 'GARCOM', 'COZINHA')),
    pin VARCHAR(6) DEFAULT '1234',
    phone VARCHAR(30),
    cpf VARCHAR(20),
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    shift VARCHAR(20) DEFAULT 'ALMOCO' CHECK (shift IN ('ALMOCO', 'JANTAR', 'AMBOS')),
    active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TABELA: TABLES (Mesas do Salão)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tables (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(30) NOT NULL DEFAULT 'LIVRE' CHECK (status IN ('LIVRE', 'OCUPADA', 'CONTA_SOLICITADA', 'RESERVADA')),
    current_order_id UUID,
    assigned_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(120),
    people_count INT DEFAULT 0,
    opened_at TIMESTAMPTZ,
    reservation_time TIMESTAMPTZ,
    reservation_customer VARCHAR(120),
    reservation_phone VARCHAR(30),
    reservation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA: CATEGORIES (Categorias do Cardápio)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TABELA: PRODUCTS (Produtos & Cortes do Cardápio)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    prep_station VARCHAR(20) NOT NULL DEFAULT 'GRELHA' CHECK (prep_station IN ('GRELHA', 'COZINHA', 'BAR')),
    available BOOLEAN DEFAULT true,
    allows_doneness BOOLEAN DEFAULT false,
    highlight BOOLEAN DEFAULT false,
    is_weighed BOOLEAN DEFAULT false,
    unit_label VARCHAR(20) DEFAULT 'un',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABELA: INGREDIENTS (Insumos & Controle de Estoque)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('CARNES', 'BEBIDAS', 'CARVAO_LENHA', 'HORTIFRUTI', 'MERCEARIA', 'SOBREMESAS', 'OUTROS')),
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('KG', 'UN', 'PACOTE', 'LITRO')),
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    min_stock NUMERIC(12,3) NOT NULL DEFAULT 5.000,
    cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(150),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TABELA: RECIPES (Ficha Técnica / Relação Produto x Insumos para Baixa Automática)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(12,3) NOT NULL DEFAULT 1.000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABELA: ORDERS (Comandas / Atendimentos de Salão ou Delivery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL DEFAULT 'MESA' CHECK (order_type IN ('MESA', 'DELIVERY', 'BALCAO', 'RETIRADA')),
    table_id INT REFERENCES public.tables(id) ON DELETE SET NULL,
    table_label VARCHAR(50) NOT NULL,
    waiter_id UUID NOT NULL REFERENCES public.profiles(id),
    waiter_name VARCHAR(150) NOT NULL,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(30),
    delivery_address TEXT,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    people_count INT NOT NULL DEFAULT 1,
    has_rodizio BOOLEAN DEFAULT false,
    rodizio_adult_count INT DEFAULT 0,
    rodizio_child_count INT DEFAULT 0,
    rodizio_senior_count INT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'CONTA_SOLICITADA', 'PAGA', 'CANCELADA')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    include_service BOOLEAN DEFAULT true,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    subtotal NUMERIC(12,2) DEFAULT 0.00,
    service_fee NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TABELA: ORDER_ITEMS (Itens dos Pedidos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 1,
    doneness VARCHAR(30),
    notes TEXT,
    weight_in_kg NUMERIC(6,3),
    prep_station VARCHAR(20) NOT NULL DEFAULT 'GRELHA',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')),
    waiter_id UUID NOT NULL REFERENCES public.profiles(id),
    waiter_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TABELA: STOCK_MOVEMENTS (Movimentações de Estoque)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ENTRADA', 'BAIXA_VENDA', 'PERDA', 'AJUSTE')),
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reference VARCHAR(150),
    registered_by VARCHAR(150) NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. TABELA: CASH_REGISTERS (Sessões de Caixa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES public.profiles(id),
    operator_name VARCHAR(150) NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'FECHADO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. TABELA: PAYMENTS (Pagamentos das Comandas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL CHECK (method IN ('DINHEIRO', 'CREDITO', 'DEBITO', 'PIX', 'VR_VA')),
    amount NUMERIC(12,2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TABELA: CASH_FLOW (Movimentações no Fluxo de Caixa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('SUPRIMENTO', 'SANGRIA', 'VENDA', 'DESPESA', 'ESTORNO', 'REPASSE_GORJETA', 'COMISSAO')),
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    operator_name VARCHAR(150) NOT NULL,
    order_code VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. TABELA: EXPENSES (Contas a Pagar & Despesas Operacionais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO')),
    payment_method VARCHAR(30),
    receipt_number VARCHAR(100),
    supplier VARCHAR(150),
    notes TEXT,
    registered_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. TABELA: COMMISSIONS & TIPS (Comissões e Gorjetas da Brigada)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sales_amount NUMERIC(12,2) NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL,
    commission_value NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'REPASSADO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. TABELA: AUDIT_LOGS (Trilha de Auditoria & Prevenção de Perdas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_reference VARCHAR(150) NOT NULL,
    amount_impact NUMERIC(12,2),
    details TEXT NOT NULL,
    reason TEXT
);

-- ============================================================================
-- TRIGGERS INTELIGENTES (Automação de Caixa e Baixa de Estoque)
-- ============================================================================

-- TRIGGER 1: Gerar lançamento automático no caixa ao registrar pagamento
CREATE OR REPLACE FUNCTION public.fn_auto_cash_flow_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_order_code VARCHAR(30);
    v_active_session UUID;
BEGIN
    SELECT code INTO v_order_code FROM public.orders WHERE id = NEW.order_id;
    SELECT id INTO v_active_session FROM public.cash_registers WHERE status = 'ABERTO' ORDER BY opened_at DESC LIMIT 1;

    INSERT INTO public.cash_flow (
        session_id,
        type,
        amount,
        payment_method,
        description,
        operator_name,
        order_code,
        timestamp
    ) VALUES (
        v_active_session,
        'VENDA',
        NEW.amount,
        NEW.method,
        CONCAT('Venda recebida ref. Comanda ', v_order_code),
        'Sistema Automático',
        v_order_code,
        NEW.timestamp
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_payment_create_cash_flow
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_cash_flow_on_payment();


-- TRIGGER 2: Baixar estoque automaticamente conforme a ficha técnica do produto
CREATE OR REPLACE FUNCTION public.fn_auto_deduct_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
BEGIN
    IF (NEW.status = 'ENTREGUE' AND (OLD.status IS DISTINCT FROM 'ENTREGUE')) THEN
        FOR r IN (SELECT ingredient_id, quantity_needed FROM public.recipes WHERE product_id = NEW.product_id) LOOP
            UPDATE public.ingredients
            SET current_stock = current_stock - (r.quantity_needed * NEW.quantity),
                updated_at = NOW()
            WHERE id = r.ingredient_id;

            INSERT INTO public.stock_movements (
                ingredient_id,
                type,
                quantity,
                unit,
                reference,
                registered_by,
                date
            ) VALUES (
                r.ingredient_id,
                'BAIXA_VENDA',
                (r.quantity_needed * NEW.quantity),
                (SELECT unit FROM public.ingredients WHERE id = r.ingredient_id),
                CONCAT('Venda item: ', NEW.name),
                NEW.waiter_name,
                NOW()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_order_item_delivered_stock
AFTER UPDATE OF status ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_deduct_stock_on_order_item();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- "garçom só vê suas comandas; admin vê tudo"
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: ORDERS (Comandas)
-- Garçom só vê suas próprias comandas (waiter_id = auth.uid()); Admin e Caixa vêem tudo!
CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CAIXA')
    OR waiter_id = auth.uid()
);

-- RLS: ORDER_ITEMS
CREATE POLICY "order_items_select_policy" ON public.order_items
FOR SELECT USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('CAIXA', 'COZINHA'))
    OR waiter_id = auth.uid()
);
`;
