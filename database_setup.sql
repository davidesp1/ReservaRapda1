-- database_setup.sql
-- Script para criação completa do banco de dados do sistema Opa Que Delicia

-- Criação dos tipos ENUM
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no-show');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'mbway', 'multibanco', 'transfer');
CREATE TYPE table_category AS ENUM ('standard', 'vip', 'outdoor', 'private');
CREATE TYPE dietary_preference AS ENUM ('vegetarian', 'vegan', 'gluten-free', 'lactose-free', 'pescatarian', 'halal', 'kosher', 'none');

-- Tabela de Usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  birth_date TIMESTAMP,
  profile_picture TEXT,
  biography TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  preferences JSONB,
  member_since TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  status TEXT DEFAULT 'active',
  loyalty_points INTEGER DEFAULT 0
);

-- Tabela de Categorias do Menu
CREATE TABLE menu_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Tabela de Itens do Menu
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Preço em centavos
  image_url TEXT,
  featured BOOLEAN DEFAULT false
);

-- Tabela de Mesas
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  category table_category DEFAULT 'standard',
  available BOOLEAN DEFAULT true
);

-- Tabela de Reservas
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  table_id INTEGER NOT NULL REFERENCES tables(id),
  date TIMESTAMP NOT NULL,
  party_size INTEGER NOT NULL,
  status reservation_status DEFAULT 'pending',
  notes TEXT,
  special_requests TEXT,
  duration INTEGER DEFAULT 120, -- Duração em minutos, padrão 2 horas
  confirmation_code TEXT,
  confirmation_date TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT false,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  dietary_requirements TEXT,
  occasion TEXT -- Aniversário, aniversário de casamento, etc.
);

-- Tabela de Pagamentos
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reservation_id INTEGER REFERENCES reservations(id),
  amount INTEGER NOT NULL, -- Valor em centavos
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  reference TEXT,
  transaction_id TEXT,
  payment_date TIMESTAMP,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Preferências Dietéticas do Usuário
CREATE TABLE user_dietary_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  preference dietary_preference NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  items JSONB, -- Array de itens com id, quantidade, preço, etc.
  total_amount INTEGER NOT NULL, -- Valor total em centavos
  special_instructions TEXT,
  order_time TIMESTAMP DEFAULT NOW(),
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  rating INTEGER, -- Avaliação do cliente (1-5)
  feedback TEXT, -- Feedback do cliente
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL, -- 'general', 'reservations', 'payments', 'notifications'
  key TEXT NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para sessões (necessária para autenticação)
CREATE TABLE sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions (expire);

-- Inserir dados iniciais

-- Administrador padrão
INSERT INTO users (username, password, email, first_name, last_name, role)
VALUES ('admin', 'admin123', 'admin@opaqueidelicia.com', 'Admin', 'System', 'admin');

-- Categorias de menu básicas
INSERT INTO menu_categories (name, description)
VALUES 
  ('Entradas', 'Deliciosas entradas brasileiras'),
  ('Pratos Principais', 'Pratos tradicionais da culinária brasileira'),
  ('Sobremesas', 'Doces e sobremesas típicas'),
  ('Bebidas', 'Bebidas e coquetéis brasileiros');

-- Itens de menu de exemplo
INSERT INTO menu_items (category_id, name, description, price, featured)
VALUES
  (1, 'Pão de Queijo', 'Tradicional pão de queijo mineiro', 450, true),
  (1, 'Coxinha', 'Coxinha de frango cremosa', 550, false),
  (2, 'Feijoada Completa', 'Tradicional feijoada com acompanhamentos', 2500, true),
  (2, 'Moqueca de Peixe', 'Moqueca de peixe com leite de coco e dendê', 2800, true),
  (3, 'Pudim de Leite', 'Clássico pudim de leite condensado', 900, true),
  (3, 'Açaí na Tigela', 'Açaí cremoso com frutas e granola', 1200, false),
  (4, 'Caipirinha', 'Clássica caipirinha de limão', 1500, true),
  (4, 'Guaraná', 'Refrigerante de guaraná', 600, false);

-- Mesas iniciais
INSERT INTO tables (number, capacity, category)
VALUES
  (1, 2, 'standard'),
  (2, 4, 'standard'),
  (3, 6, 'standard'),
  (4, 8, 'standard'),
  (5, 2, 'vip'),
  (6, 4, 'vip'),
  (7, 6, 'outdoor'),
  (8, 8, 'outdoor'),
  (9, 10, 'private');

-- Configurações iniciais
INSERT INTO settings (category, key, value)
VALUES
  ('general', 'restaurant_name', 'Opa que delicia'),
  ('general', 'restaurant_phone', '+351 123 456 789'),
  ('general', 'restaurant_email', 'contato@opaqueidelicia.com'),
  ('reservations', 'max_party_size', '20'),
  ('reservations', 'min_hours_in_advance', '2'),
  ('reservations', 'default_duration', '120'),
  ('payments', 'currency', 'EUR'),
  ('payments', 'vat_rate', '23'),
  ('hours', 'opening_time', '11:00'),
  ('hours', 'closing_time', '23:00'),
  ('hours', 'monday_to_friday', 'true'),
  ('hours', 'saturday', 'true'),
  ('hours', 'sunday', 'true');