-- =============================================
-- SISTEMA MEMBRESIA — Schema completo (idempotente)
-- Cole tudo aqui e clique Run
-- =============================================

-- Tabelas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'discipulador' CHECK (perfil IN ('admin', 'pastor', 'lider', 'discipulador')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'discipulador')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE IF NOT EXISTS novos_convertidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_conversao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_nascimento DATE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT DEFAULT 'Fortaleza',
  estado_civil TEXT CHECK (estado_civil IN ('solteiro','casado','divorciado','viuvo','uniao_estavel')),
  tem_filhos BOOLEAN DEFAULT FALSE,
  qtd_filhos INTEGER DEFAULT 0,
  profissao TEXT,
  como_conheceu TEXT CHECK (como_conheceu IN ('amigo','familiar','redes_sociais','evento','culto','outro')),
  batizado BOOLEAN DEFAULT FALSE,
  quer_batismo BOOLEAN DEFAULT FALSE,
  ja_frequentava_igreja BOOLEAN DEFAULT FALSE,
  igreja_anterior TEXT,
  observacoes TEXT,
  foto_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','em_discipulado','encerrado','inativo')),
  criado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_convertidos_atualizado
  BEFORE UPDATE ON novos_convertidos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TABLE IF NOT EXISTS discipuladores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modulos_discipulado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  total_aulas INTEGER NOT NULL DEFAULT 12 CHECK (total_aulas > 0),
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO modulos_discipulado (nome, descricao, total_aulas, ordem) VALUES
  ('Fundamentos da Fé', 'Bases da vida cristã: oração, leitura bíblica, comunhão e serviço', 12, 1),
  ('Vida no Espírito', 'O Espírito Santo, dons e frutos espirituais', 10, 2),
  ('Discipulado Avançado', 'Aprofundamento teológico e formação de líderes', 14, 3)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS grupos_discipulado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  discipulador_id UUID NOT NULL REFERENCES discipuladores(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL DEFAULT 'individual' CHECK (tipo IN ('individual', 'grupo')),
  modulo_id UUID REFERENCES modulos_discipulado(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'pausado')),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupo_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES grupos_discipulado(id) ON DELETE CASCADE,
  convertido_id UUID NOT NULL REFERENCES novos_convertidos(id) ON DELETE CASCADE,
  data_entrada DATE DEFAULT CURRENT_DATE,
  data_saida DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'transferido')),
  UNIQUE(grupo_id, convertido_id)
);

CREATE TABLE IF NOT EXISTS progresso_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES grupos_discipulado(id) ON DELETE CASCADE,
  numero_aula INTEGER NOT NULL CHECK (numero_aula > 0),
  data_realizada DATE,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'realizada' CHECK (status IN ('realizada', 'pendente', 'cancelada')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grupo_id, numero_aula)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convertidos_status ON novos_convertidos(status);
CREATE INDEX IF NOT EXISTS idx_convertidos_data_conversao ON novos_convertidos(data_conversao);
CREATE INDEX IF NOT EXISTS idx_discipuladores_ativo ON discipuladores(ativo);
CREATE INDEX IF NOT EXISTS idx_grupos_status ON grupos_discipulado(status);
CREATE INDEX IF NOT EXISTS idx_grupos_discipulador ON grupos_discipulado(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_grupo_membros_grupo ON grupo_membros(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_membros_convertido ON grupo_membros(convertido_id);
CREATE INDEX IF NOT EXISTS idx_progresso_grupo ON progresso_aulas(grupo_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE novos_convertidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipuladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_aulas ENABLE ROW LEVEL SECURITY;

-- Drop policies antes de recriar (evita erro "already exists")
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles','novos_convertidos','discipuladores','modulos_discipulado','grupos_discipulado','grupo_membros','progresso_aulas')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Recriar policies
CREATE POLICY "read_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "read_convertidos" ON novos_convertidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_convertidos" ON novos_convertidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_convertidos" ON novos_convertidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "all_discipuladores" ON discipuladores FOR ALL TO authenticated USING (true);
CREATE POLICY "all_modulos" ON modulos_discipulado FOR ALL TO authenticated USING (true);
CREATE POLICY "all_grupos" ON grupos_discipulado FOR ALL TO authenticated USING (true);
CREATE POLICY "all_membros" ON grupo_membros FOR ALL TO authenticated USING (true);
CREATE POLICY "all_progresso" ON progresso_aulas FOR ALL TO authenticated USING (true);

-- Criar profile do admin (caso usuário já exista sem profile)
INSERT INTO profiles (id, nome, email, perfil)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'nome', split_part(email, '@', 1)),
  email,
  COALESCE(raw_user_meta_data->>'perfil', 'admin')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
