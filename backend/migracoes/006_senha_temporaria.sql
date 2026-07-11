ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS deve_trocar_senha BOOLEAN DEFAULT false;
