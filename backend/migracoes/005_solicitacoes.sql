-- Adicionar status à tabela igrejas (se ainda não existir)
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativa'
  CHECK (status IN ('pendente', 'ativa', 'suspensa'));

-- Nova tabela: solicitações de cadastro de igreja
CREATE TABLE IF NOT EXISTS solicitacoes_igreja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  responsavel_nome TEXT NOT NULL,
  responsavel_email TEXT NOT NULL,
  responsavel_telefone TEXT,
  cargo_responsavel TEXT,
  plano TEXT DEFAULT 'basico',
  mensagem TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
