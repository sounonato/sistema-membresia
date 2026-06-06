-- ============================================================
-- MIGRATION 001 — Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Campo gênero em novos_convertidos
ALTER TABLE novos_convertidos
  ADD COLUMN IF NOT EXISTS genero TEXT CHECK (genero IN ('masculino', 'feminino', 'outro'));

-- 2. Tabela de acompanhamentos
CREATE TABLE IF NOT EXISTS acompanhamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convertido_id   UUID NOT NULL REFERENCES novos_convertidos(id) ON DELETE CASCADE,
  grupo_id        UUID REFERENCES grupos_discipulado(id) ON DELETE SET NULL,
  discipulador_id UUID NOT NULL REFERENCES discipuladores(id) ON DELETE CASCADE,
  data_contato    DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_contato    TEXT CHECK (tipo_contato IN ('presencial', 'telefone', 'mensagem', 'outro')) DEFAULT 'presencial',
  observacao      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acomp_convertido    ON acompanhamentos(convertido_id);
CREATE INDEX IF NOT EXISTS idx_acomp_discipulador  ON acompanhamentos(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_acomp_grupo         ON acompanhamentos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_acomp_data          ON acompanhamentos(data_contato DESC);

-- 3. RLS
ALTER TABLE acompanhamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discipulador_own_acompanhamentos" ON acompanhamentos;
DROP POLICY IF EXISTS "lider_all_acompanhamentos" ON acompanhamentos;

CREATE POLICY "discipulador_own_acompanhamentos" ON acompanhamentos FOR ALL USING (
  discipulador_id IN (SELECT id FROM discipuladores WHERE usuario_id = auth.uid())
);

CREATE POLICY "lider_all_acompanhamentos" ON acompanhamentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND perfil IN ('admin','pastor','lider'))
);

CREATE POLICY "lider_insert_acompanhamentos" ON acompanhamentos FOR INSERT WITH CHECK (true);
