-- =========================================================
-- Migração 008 — Adicionar usuario_id à tabela membros
-- Data: 2026-08-08
-- Motivo: permite vincular um membro a uma conta de usuário
--         (ex: membro que também é lider/admin no sistema)
-- =========================================================

ALTER TABLE membros
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_membros_usuario_id ON membros(usuario_id);
