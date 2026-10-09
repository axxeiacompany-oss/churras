-- ============================================================================
-- CHURRASGESTÃO - SUPABASE (POSTGRESQL + AUTH + REALTIME + RLS) SCHEMA & SEED
-- Sistema Completo de Gestão de Churrascaria Prime
-- Moedas: BRL (R$) e Guarani (₲ / Gs.)
-- Admin Inicial: admin@churrascaria.com (PIN: 1234 / Senha: admin)
-- ============================================================================

-- 0. EXTENSÕES & COMPATIBILIDADE AUTH
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 1. TABELA: PROFILES (Perfis de Usuários com RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 6. TABELA: RECIPES (Ficha Técnica / Relação Produto x Insumos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(10,3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABELA: ORDERS (Comandas / Atendimentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL DEFAULT 'MESA' CHECK (order_type IN ('MESA', 'DELIVERY', 'BALCAO', 'RETIRADA')),
    table_id INT REFERENCES public.tables(id) ON DELETE SET NULL,
    table_label VARCHAR(50) NOT NULL,
    waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    waiter_name VARCHAR(150) NOT NULL,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(50),
    delivery_address TEXT,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    people_count INT NOT NULL DEFAULT 1,
    has_rodizio BOOLEAN DEFAULT false,
    rodizio_adult_count INT DEFAULT 0,
    rodizio_child_count INT DEFAULT 0,
    rodizio_senior_count INT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'CONTA_SOLICITADA', 'PAGA', 'CANCELADA')),
    include_service BOOLEAN DEFAULT true,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    subtotal NUMERIC(12,2) DEFAULT 0.00,
    service_fee NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) DEFAULT 0.00,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TABELA: ORDER_ITEMS (Itens de Pedido / KDS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 1,
    weight_in_kg NUMERIC(8,3),
    doneness VARCHAR(30) CHECK (doneness IN ('SELANTE', 'MAL_PASSADO', 'AO_PONTO_PARA_MAL', 'AO_PONTO', 'AO_PONTO_PARA_BEM', 'BEM_PASSADO')),
    notes TEXT,
    prep_station VARCHAR(20) NOT NULL DEFAULT 'GRELHA' CHECK (prep_station IN ('GRELHA', 'COZINHA', 'BAR')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')),
    table_id INT,
    table_label VARCHAR(50),
    order_code VARCHAR(30),
    waiter_id UUID REFERENCES public.profiles(id),
    waiter_name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TABELA: PAYMENTS (Pagamentos Recebidos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL CHECK (method IN ('DINHEIRO', 'CREDITO', 'DEBITO', 'PIX', 'VR_VA')),
    amount NUMERIC(12,2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. TABELA: CASH_REGISTERS (Sessões de Abertura e Fechamento de Caixa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.profiles(id),
    operator_name VARCHAR(150) NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'FECHADO'))
);

-- ============================================================================
-- 11. TABELA: CASH_FLOW (Movimentações de Fluxo de Caixa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_flow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('SUPRIMENTO', 'SANGRIA', 'VENDA', 'DESPESA', 'ESTORNO', 'REPASSE_GORJETA', 'COMISSAO')),
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('DINHEIRO', 'CREDITO', 'DEBITO', 'PIX', 'VR_VA')),
    description TEXT NOT NULL,
    operator_name VARCHAR(150) NOT NULL,
    order_code VARCHAR(30),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TABELA: EXPENSES (Contas a Pagar / Despesas Operacionais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'FORNECEDOR_CARNE', 'GAS_CARVAO', 'BEBIDAS_ESTOQUE', 'HORTIFRUTI',
        'ALUGUEL', 'ENERGIA_AGUA', 'SALARIOS', 'IMPOSTOS', 'MANUTENCAO', 'OUTROS'
    )),
    amount NUMERIC(12,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO')),
    payment_method VARCHAR(30) CHECK (payment_method IN ('DINHEIRO', 'CREDITO', 'DEBITO', 'PIX', 'VR_VA')),
    receipt_number VARCHAR(100),
    supplier VARCHAR(150),
    notes TEXT,
    registered_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. TABELA: STOCK_MOVEMENTS (Auditoria de Entradas e Saídas de Estoque)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ENTRADA', 'BAIXA_VENDA', 'PERDA', 'AJUSTE')),
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reference VARCHAR(200),
    registered_by VARCHAR(150) NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. TABELA: AUDIT_LOGS (Trilha de Auditoria Anti-Fraude e Segurança)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'CANCELAMENTO_ITEM', 'CANCELAMENTO_COMANDA', 'ESTORNO_PAGAMENTO',
        'DESCONTO_CONCEDIDO', 'ALTERACAO_PRECO', 'AJUSTE_ESTOQUE',
        'SANGRIA_CAIXA', 'DIFERENCA_FECHAMENTO', 'FECHAMENTO_CAIXA', 'DIVERGENCIA_CAIXA'
    )),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('COMANDA', 'ITEM', 'PRODUTO', 'ESTOQUE', 'CAIXA')),
    target_reference VARCHAR(150) NOT NULL,
    details TEXT NOT NULL,
    reason TEXT,
    amount_impact NUMERIC(12,2) DEFAULT 0.00
);

-- ============================================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON public.orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_station ON public.order_items(prep_station);
CREATE INDEX IF NOT EXISTS idx_cash_flow_timestamp ON public.cash_flow(timestamp);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- ============================================================================
-- TRIGGERS INTELIGENTES
-- ============================================================================

-- TRIGGER 1: Registro Automático de Venda no Fluxo de Caixa
CREATE OR REPLACE FUNCTION public.fn_auto_cash_flow_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_order_code VARCHAR(30);
BEGIN
    SELECT code INTO v_order_code FROM public.orders WHERE id = NEW.order_id;

    INSERT INTO public.cash_flow (
        type,
        amount,
        payment_method,
        description,
        operator_name,
        order_code,
        timestamp
    ) VALUES (
        'VENDA',
        NEW.amount,
        NEW.method,
        CONCAT('Venda recebida ref. Comanda ', COALESCE(v_order_code, 'N/A')),
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

-- TRIGGER 2: Baixa Automática de Estoque por Ficha Técnica
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
                CONCAT('Baixa automática item: ', NEW.name),
                COALESCE(NEW.waiter_name, 'Sistema'),
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

-- TRIGGER 3: Auditoria Automática de Cancelamentos e Descontos
CREATE OR REPLACE FUNCTION public.fn_auto_audit_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'CANCELADA' AND OLD.status <> 'CANCELADA') THEN
        INSERT INTO public.audit_logs (
            actor_id,
            actor_name,
            actor_role,
            action_type,
            target_type,
            target_reference,
            amount_impact,
            details,
            reason
        ) VALUES (
            COALESCE(NEW.waiter_id::text, 'SISTEMA'),
            COALESCE(NEW.waiter_name, 'Operador'),
            'GARCOM',
            'CANCELAMENTO_COMANDA',
            'COMANDA',
            NEW.code,
            NEW.total,
            CONCAT('Comanda ', NEW.code, ' cancelada integralmente.'),
            'Cancelamento operacional registrado no sistema'
        );
    END IF;

    IF (NEW.discount_amount > 40.00 AND (OLD.discount_amount IS DISTINCT FROM NEW.discount_amount)) THEN
        INSERT INTO public.audit_logs (
            actor_id,
            actor_name,
            actor_role,
            action_type,
            target_type,
            target_reference,
            amount_impact,
            details,
            reason
        ) VALUES (
            COALESCE(NEW.waiter_id::text, 'SISTEMA'),
            COALESCE(NEW.waiter_name, 'Operador'),
            'GARCOM',
            'DESCONTO_CONCEDIDO',
            'COMANDA',
            NEW.code,
            NEW.discount_amount,
            CONCAT('Desconto de R$ ', NEW.discount_amount, ' concedido na comanda ', NEW.code),
            'Desconto comercial concedido'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_order_audit_alert
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_audit_orders();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "tables_select_all" ON public.tables FOR SELECT USING (true);
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);

-- Garçom só vê suas comandas; Admin e Caixa vêem tudo
CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CAIXA')
    OR waiter_id = auth.uid()
);

CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT WITH CHECK (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GARCOM', 'CAIXA'))
);

CREATE POLICY "orders_update_policy" ON public.orders
FOR UPDATE USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CAIXA')
    OR waiter_id = auth.uid()
);

CREATE POLICY "order_items_select_policy" ON public.order_items
FOR SELECT USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('CAIXA', 'COZINHA'))
    OR waiter_id = auth.uid()
);

CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
FOR SELECT USING (is_admin());

CREATE POLICY "expenses_select_policy" ON public.expenses
FOR SELECT USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CAIXA')
);

CREATE POLICY "cash_flow_select_policy" ON public.cash_flow
FOR SELECT USING (
    is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CAIXA')
);


-- ============================================================================
-- DADOS DE EXEMPLO (SEED DATA COMPLETO)
-- Cardápio de Churrascaria Prime, Mesas, Funcionários, Estoque e Auditoria
-- ============================================================================

-- 1. FUNCIONÁRIOS (Admin inicial: admin@churrascaria.com)
INSERT INTO public.profiles (id, name, email, role, pin, phone, cpf, commission_rate, shift, active, avatar_url)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Carlos Silveira', 'admin@churrascaria.com', 'ADMIN', '1234', '(11) 99876-1234', '123.456.789-01', 0.00, 'AMBOS', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    ('a0000000-0000-0000-0000-000000000002', 'Patrícia Mendonça', 'caixa@churrascaria.com', 'CAIXA', '2222', '(11) 98765-4321', '234.567.890-12', 2.00, 'ALMOCO', true, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
    ('a0000000-0000-0000-0000-000000000003', 'Marcelo "Gaúcho"', 'gaucho@churrascaria.com', 'GARCOM', '3333', '(11) 97654-3210', '345.678.901-23', 10.00, 'AMBOS', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    ('a0000000-0000-0000-0000-000000000004', 'Juliana Santos', 'juliana@churrascaria.com', 'GARCOM', '4444', '(11) 96543-2109', '456.789.012-34', 10.00, 'ALMOCO', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    ('a0000000-0000-0000-0000-000000000005', 'Mestre Tiago Parrillero', 'tiago@churrascaria.com', 'COZINHA', '5555', '(11) 95432-1098', '567.890.123-45', 0.00, 'AMBOS', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, pin = EXCLUDED.pin, role = EXCLUDED.role;

-- 2. MESAS DO SALÃO
INSERT INTO public.tables (id, label, capacity, status, people_count, customer_name)
VALUES
    (1, 'Mesa 01', 4, 'OCUPADA', 3, 'Família Oliveira'),
    (2, 'Mesa 02', 4, 'LIVRE', 0, NULL),
    (3, 'Mesa 03', 6, 'OCUPADA', 5, 'Diretoria Construtora'),
    (4, 'Mesa 04', 4, 'CONTA_SOLICITADA', 2, 'Casal Almeida'),
    (5, 'Mesa 05', 2, 'LIVRE', 0, NULL),
    (6, 'Mesa 06', 8, 'RESERVADA', 0, 'Dr. Roberto Mendes'),
    (7, 'Mesa 07', 4, 'OCUPADA', 4, 'Amigos da Confraria'),
    (8, 'Mesa 08', 6, 'LIVRE', 0, NULL),
    (9, 'Mesa 09', 2, 'LIVRE', 0, NULL),
    (10, 'Mesa 10', 4, 'LIVRE', 0, NULL),
    (11, 'Mesa 11 (Área Externa)', 6, 'LIVRE', 0, NULL),
    (12, 'Mesa 12 (Camarote VIP)', 12, 'RESERVADA', 0, 'Aniversário Juliana')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, capacity = EXCLUDED.capacity;

-- 3. CATEGORIAS DO CARDÁPIO
INSERT INTO public.categories (id, name, display_order)
VALUES
    ('RODIZIO', 'Rodízio Tradicional Prime', 1),
    ('CORTES_NOBRES', 'Cortes Nobres à la Carte', 2),
    ('ENTRADAS_GUARNACOES', 'Entradas & Acompanhamentos', 3),
    ('CHOPP_DRINKS', 'Chopps & Drinks da Casa', 4),
    ('BEBIDAS', 'Bebidas Sem Álcool', 5),
    ('SOBREMESAS', 'Sobremesas Artesanais', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order;

-- 4. PRODUTOS & CORTES DE CHURRASCARIA
INSERT INTO public.products (id, name, category_id, price, cost, description, prep_station, allows_doneness, highlight)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Rodízio Completo Prime Adulto', 'RODIZIO', 149.90, 48.50, 'Mais de 22 cortes nobres servidos no espeto corrido, buffet livre de saladas, frios e guarnições quentes.', 'GRELHA', false, true),
    ('b0000000-0000-0000-0000-000000000002', 'Rodízio Infantil (6 a 11 anos)', 'RODIZIO', 74.90, 24.20, 'Rodízio completo com buffet livre com tarifa especial para crianças.', 'GRELHA', false, false),
    ('b0000000-0000-0000-0000-000000000003', 'Picanha Prime na Brasa (500g)', 'CORTES_NOBRES', 138.00, 42.00, 'Corte nobre alto com capa de gordura uniforme, grelhado na brasa de lenha nobre. Acompanha farofa de ovos e vinagrete.', 'GRELHA', true, true),
    ('b0000000-0000-0000-0000-000000000004', 'Costela Gaúcha Fogo de Chão (600g)', 'CORTES_NOBRES', 119.00, 36.50, 'Assada lentamente por 8 horas no braseiro suave. Desmancha no garfo com mandioca na manteiga de garrafa.', 'GRELHA', false, true),
    ('b0000000-0000-0000-0000-000000000005', 'Bife de Ancho Black Angus (400g)', 'CORTES_NOBRES', 145.00, 47.00, 'Marmoreio extremo com maciez ímpar, salpicado com flor de sal de Guérande.', 'GRELHA', true, false),
    ('b0000000-0000-0000-0000-000000000006', 'Cupim Casqueirado Mantiqueira (450g)', 'CORTES_NOBRES', 92.00, 26.80, 'Corte fatiado finamente com crocância externa e interior suculento.', 'GRELHA', false, false),
    ('b0000000-0000-0000-0000-000000000007', 'Queijo Coalho Grelhado com Melaço', 'ENTRADAS_GUARNACOES', 38.00, 10.50, 'Quatro espetos dourados com crosta crocante servidos com melaço de cana artesanal e orégano.', 'GRELHA', false, false),
    ('b0000000-0000-0000-0000-000000000008', 'Pão de Alho Especial Recheado', 'ENTRADAS_GUARNACOES', 26.00, 6.20, 'Baguete artesanal crocante recheada com queijo mussarela derretido e creme de alho suave.', 'GRELHA', false, false),
    ('b0000000-0000-0000-0000-000000000009', 'Polenta Frita Crocante com Parmesão', 'ENTRADAS_GUARNACOES', 28.00, 5.50, 'Bastões crocantes de polenta sequinha salpicados com parmesão ralado na hora.', 'COZINHA', false, false),
    ('b0000000-0000-0000-0000-000000000010', 'Chopp Brahma Caneca Congelada (500ml)', 'CHOPP_DRINKS', 16.00, 4.20, 'Tirado na pressão perfeita com colarinho cremoso a -2°C.', 'BAR', false, true),
    ('b0000000-0000-0000-0000-000000000011', 'Caipirinha Tradicional Limão & Cachaça Nobre', 'CHOPP_DRINKS', 32.00, 7.80, 'Cachaça mineira envelhecida em amburana, limão taiti fresco e açúcar cristal.', 'BAR', false, false),
    ('b0000000-0000-0000-0000-000000000012', 'Refrigerante Lata 350ml', 'BEBIDAS', 9.50, 3.20, 'Coca-Cola, Guaraná Antarctica ou Zero gelados.', 'BAR', false, false),
    ('b0000000-0000-0000-0000-000000000013', 'Água Mineral sem Gás (500ml)', 'BEBIDAS', 8.00, 1.80, 'Garrafa de água mineral gelada.', 'BAR', false, false),
    ('b0000000-0000-0000-0000-000000000014', 'Pudim de Leite Condensado da Fazenda', 'SOBREMESAS', 24.00, 4.80, 'Sem furinhos, com calda de caramelo brilhante e aveludada.', 'COZINHA', false, true),
    ('b0000000-0000-0000-0000-000000000015', 'Petit Gâteau com Sorvete de Creme', 'SOBREMESAS', 36.00, 8.90, 'Bolo de chocolate belga quente com recheio cremoso escorrendo, servido com sorvete artesanal.', 'COZINHA', false, false)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost = EXCLUDED.cost;

-- 5. INSUMOS & ESTOQUE
INSERT INTO public.ingredients (id, name, category, unit, current_stock, min_stock, cost_per_unit, supplier)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Picanha Angus In Natura', 'CARNES', 'KG', 48.500, 25.000, 78.00, 'Frigorífico VPJ Alimentos'),
    ('c0000000-0000-0000-0000-000000000002', 'Costela Bovina Janela', 'CARNES', 'KG', 85.000, 40.000, 38.50, 'Frigorífico Friboi Prime'),
    ('c0000000-0000-0000-0000-000000000003', 'Ancho Black Angus', 'CARNES', 'KG', 34.000, 18.000, 89.00, 'Frigorífico VPJ Alimentos'),
    ('c0000000-0000-0000-0000-000000000004', 'Cupim Bovino Selecionado', 'CARNES', 'KG', 52.000, 20.000, 42.00, 'Frigorífico Estrela do Sul'),
    ('c0000000-0000-0000-0000-000000000005', 'Carvão Vegetal em Sacos (10kg)', 'CARVAO_LENHA', 'PACOTE', 6.000, 15.000, 38.00, 'Carvão Brasa Pura SP'),
    ('c0000000-0000-0000-0000-000000000006', 'Barril Chopp Brahma 50L', 'BEBIDAS', 'UN', 4.000, 3.000, 420.00, 'Ambev Distribuição Direta'),
    ('c0000000-0000-0000-0000-000000000007', 'Queijo Coalho Peça', 'HORTIFRUTI', 'KG', 18.500, 10.000, 44.00, 'Laticínios Sertão Forte'),
    ('c0000000-0000-0000-0000-000000000008', 'Cachaça Artesanal Envelhecida', 'BEBIDAS', 'LITRO', 8.000, 5.000, 54.00, 'Alambique Salinas MG')
ON CONFLICT (id) DO UPDATE SET current_stock = EXCLUDED.current_stock;

-- 6. FICHAS TÉCNICAS (RECIPES)
INSERT INTO public.recipes (product_id, ingredient_id, quantity_needed)
VALUES
    ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 0.520), -- 520g Picanha crua p/ 500g servido
    ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 0.750), -- 750g Costela crua c/ osso p/ 600g
    ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 0.430), -- 430g Ancho cru
    ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 0.500), -- 500g Cupim cru
    ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 0.280), -- 280g Queijo coalho
    ('b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000006', 0.010)  -- 0.5L de Chopp de barril (0.01 de 50L)
ON CONFLICT DO NOTHING;

-- 7. DESPESAS OPERACIONAIS (CONTAS A PAGAR)
INSERT INTO public.expenses (id, description, category, amount, due_date, status, supplier, registered_by)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Lote Semanal Picanha & Ancho Angus', 'FORNECEDOR_CARNE', 8450.00, CURRENT_DATE + INTERVAL '3 days', 'PENDENTE', 'VPJ Alimentos', 'Carlos Silveira'),
    ('d0000000-0000-0000-0000-000000000002', 'Carvão Vegetal 50 Sacos Brasa Pura', 'GAS_CARVAO', 1900.00, CURRENT_DATE - INTERVAL '1 day', 'ATRASADO', 'Carvão Brasa Pura SP', 'Carlos Silveira'),
    ('d0000000-0000-0000-0000-000000000003', 'Reposição Barris Chopp Brahma 50L', 'BEBIDAS_ESTOQUE', 3360.00, CURRENT_DATE + INTERVAL '5 days', 'PENDENTE', 'Ambev Distribuição', 'Carlos Silveira'),
    ('d0000000-0000-0000-0000-000000000004', 'Energia Elétrica Câmara Frigorífica', 'ENERGIA_AGUA', 4250.00, CURRENT_DATE + INTERVAL '10 days', 'PENDENTE', 'Enel Distribuição SP', 'Carlos Silveira')
ON CONFLICT (id) DO NOTHING;

-- 8. AUDITORIA INICIAL
INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action_type, target_type, target_reference, details, reason, amount_impact)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Carlos Silveira', 'ADMIN', 'ALTERACAO_PRECO', 'PRODUTO', 'Picanha Prime na Brasa (500g)', 'Reajuste cadastrado de R$ 132,00 para R$ 138,00', 'Reajuste de tabela do fornecedor VPJ Alimentos', 6.00),
    ('a0000000-0000-0000-0000-000000000002', 'Patrícia Mendonça', 'CAIXA', 'SANGRIA_CAIXA', 'CAIXA', 'Caixa Turno Almoço', 'Sangria de segurança no valor de R$ 2.500,00 enviada ao cofre blindado', 'Procedimento padrão de segurança de numerário', 2500.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DO SCRIPT - CHURRASGESTÃO PRONTO PARA USO!
-- ============================================================================
