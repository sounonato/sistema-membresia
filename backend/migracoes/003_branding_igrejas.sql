-- Adiciona campos de branding à tabela igrejas
ALTER TABLE igrejas
  ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#b45309',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;
