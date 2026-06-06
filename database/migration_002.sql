-- Migration 002: campo ja_fez_discipulado
ALTER TABLE novos_convertidos
  ADD COLUMN IF NOT EXISTS ja_fez_discipulado BOOLEAN DEFAULT FALSE;
