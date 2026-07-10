-- Habilitar extensão para gerar UUID se necessário (embora gen_random_uuid() seja nativo no PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Igrejas (Tenants)
CREATE TABLE IF NOT EXISTS igrejas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plano TEXT NOT NULL DEFAULT 'gratuito',
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Usuários (Acesso ao Sistema)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('superadmin','admin','lider','pastor','discipulador')),
  igreja_id UUID REFERENCES igrejas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- E-mail deve ser único por igreja (permitindo que o mesmo e-mail exista em igrejas diferentes)
  UNIQUE(email, igreja_id)
);

-- Índice único especial para garantir e-mail único global para superadmins (onde igreja_id é nulo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_superadmin_email_unico 
ON usuarios(email) 
WHERE igreja_id IS NULL;

-- 3. Tabela de Novos Convertidos
CREATE TABLE IF NOT EXISTS novos_convertidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_conversao DATE NOT NULL,
  data_nascimento DATE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado_civil TEXT,
  genero TEXT,
  tem_filhos BOOLEAN DEFAULT false,
  qtd_filhos INTEGER DEFAULT 0,
  profissao TEXT,
  como_conheceu TEXT,
  batizado BOOLEAN DEFAULT false,
  quer_batismo BOOLEAN DEFAULT false,
  ja_frequentava_igreja BOOLEAN DEFAULT false,
  igreja_anterior TEXT,
  ja_fez_discipulado BOOLEAN DEFAULT false,
  observacoes TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Discipuladores
CREATE TABLE IF NOT EXISTS discipuladores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Módulos de Discipulado
CREATE TABLE IF NOT EXISTS modulos_discipulado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  total_aulas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Grupos de Discipulado
CREATE TABLE IF NOT EXISTS grupos_discipulado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  discipulador_id UUID REFERENCES discipuladores(id) ON DELETE SET NULL,
  modulo_id UUID REFERENCES modulos_discipulado(id) ON DELETE SET NULL,
  data_inicio DATE,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabela de Relacionamento Grupo x Membros
CREATE TABLE IF NOT EXISTS grupo_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  grupo_id UUID REFERENCES grupos_discipulado(id) ON DELETE CASCADE,
  convertido_id UUID REFERENCES novos_convertidos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grupo_id, convertido_id)
);

-- 8. Tabela de Progresso de Aulas do Grupo
CREATE TABLE IF NOT EXISTS progresso_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  grupo_id UUID REFERENCES grupos_discipulado(id) ON DELETE CASCADE,
  aula_numero INTEGER NOT NULL,
  data_aula DATE,
  concluida BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grupo_id, aula_numero)
);

-- =========================================================================
-- DADOS INICIAIS (SEEDS)
-- =========================================================================

-- 1. Criar igreja padrão
INSERT INTO igrejas (id, nome, slug, plano, ativa)
VALUES ('e742c0f6-d7a3-48b4-93c2-d3aef6cd7fb5', 'Igreja do Nazareno Sede', 'nazareno-sede', 'premium', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Usuário superadmin global (sem vinculo de igreja, senha original: admin123)
INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
VALUES ('Super Administrador', 'super@nazareno.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', NULL)
ON CONFLICT (email) WHERE igreja_id IS NULL DO NOTHING;

-- 3. Usuário admin da igreja padrão (senha original: admin123)
INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
VALUES ('Administrador Local', 'admin@nazareno.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'e742c0f6-d7a3-48b4-93c2-d3aef6cd7fb5')
ON CONFLICT (email, igreja_id) DO NOTHING;
