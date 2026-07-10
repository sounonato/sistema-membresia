-- =========================================================
-- Migração 004 — Módulo Membresia
-- Data: 2026-07-10
-- =========================================================

-- Tabela principal: membros da igreja
CREATE TABLE IF NOT EXISTS membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,

  -- Vínculo com o pipeline de convertidos (opcional — nem todo membro veio pelo pipeline)
  convertido_id UUID REFERENCES novos_convertidos(id) ON DELETE SET NULL,

  -- Dados pessoais
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('masculino', 'feminino', 'outro')),
  estado_civil TEXT CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  profissao TEXT,

  -- Endereço
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,

  -- Dados eclesiásticos
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_entrada TEXT CHECK (tipo_entrada IN ('batismo', 'transferencia', 'aclamacao', 'reconciliacao')),
  data_batismo DATE,
  batizado BOOLEAN DEFAULT false,
  fez_discipulado BOOLEAN DEFAULT false,

  -- Família
  conjuge_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  nome_conjuge TEXT,           -- usado quando o cônjuge não é membro cadastrado
  tem_filhos BOOLEAN DEFAULT false,
  qtd_filhos INTEGER DEFAULT 0,

  -- Acompanhamento pastoral
  ultimo_contato DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'transferido', 'falecido', 'excluido')),
  observacoes TEXT,

  -- Transferência (carta)
  carta_entrada_origem TEXT,   -- nome da igreja de origem (entrada por transferência)
  carta_saida_destino TEXT,    -- nome da igreja de destino (saída por transferência)
  data_saida DATE,
  motivo_saida TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ministérios da igreja
CREATE TABLE IF NOT EXISTS ministerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  lider_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamento N:N entre membros e ministérios
CREATE TABLE IF NOT EXISTS membro_ministerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  cargo TEXT,                  -- ex: "Músico", "Líder de seção", "Tesoureiro"
  data_entrada DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(membro_id, ministerio_id)
);

-- Cargos eclesiásticos formais do membro
CREATE TABLE IF NOT EXISTS cargos_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,         -- ex: 'diacono', 'presbitero', 'pastor', 'evangelista', 'missionario'
  data_posse DATE,
  data_fim DATE,               -- preenchido quando o cargo é encerrado
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de disparos WhatsApp (evita reenvio dentro do período)
CREATE TABLE IF NOT EXISTS whatsapp_followup_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ativo', 'inativo')),
  enviado_em TIMESTAMPTZ DEFAULT now(),
  sucesso BOOLEAN DEFAULT true,
  erro TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_membros_igreja_id ON membros(igreja_id);
CREATE INDEX IF NOT EXISTS idx_membros_status ON membros(status);
CREATE INDEX IF NOT EXISTS idx_membros_ultimo_contato ON membros(ultimo_contato);
CREATE INDEX IF NOT EXISTS idx_membros_convertido_id ON membros(convertido_id);
CREATE INDEX IF NOT EXISTS idx_ministerios_igreja_id ON ministerios(igreja_id);
CREATE INDEX IF NOT EXISTS idx_membro_ministerios_membro_id ON membro_ministerios(membro_id);
CREATE INDEX IF NOT EXISTS idx_membro_ministerios_ministerio_id ON membro_ministerios(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_cargos_membros_membro_id ON cargos_membros(membro_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_membro_id ON whatsapp_followup_log(membro_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_enviado_em ON whatsapp_followup_log(enviado_em);
