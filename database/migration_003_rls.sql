-- Garantir RLS ativo em todas as tabelas
ALTER TABLE novos_convertidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipuladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE acompanhamentos ENABLE ROW LEVEL SECURITY;

-- Helper function para verificar perfil
CREATE OR REPLACE FUNCTION get_user_perfil()
RETURNS TEXT AS $$
  SELECT perfil FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: é líder?
CREATE OR REPLACE FUNCTION is_lider()
RETURNS BOOLEAN AS $$
  SELECT get_user_perfil() IN ('admin', 'pastor', 'lider')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- novos_convertidos
DROP POLICY IF EXISTS "lider_all_convertidos" ON novos_convertidos;
DROP POLICY IF EXISTS "public_insert_convertidos" ON novos_convertidos;
DROP POLICY IF EXISTS "auth_read_convertidos" ON novos_convertidos;

CREATE POLICY "lider_all_convertidos" ON novos_convertidos
  FOR ALL TO authenticated
  USING (is_lider())
  WITH CHECK (is_lider());

CREATE POLICY "auth_read_convertidos" ON novos_convertidos
  FOR SELECT TO authenticated
  USING (true); -- todos autenticados podem ler (discipulador vê membros do seu grupo via join)

CREATE POLICY "public_insert_convertidos" ON novos_convertidos
  FOR INSERT TO anon
  WITH CHECK (true); -- formulário público

-- grupos_discipulado
DROP POLICY IF EXISTS "lider_all_grupos" ON grupos_discipulado;
DROP POLICY IF EXISTS "disc_read_own_grupos" ON grupos_discipulado;

CREATE POLICY "lider_all_grupos" ON grupos_discipulado
  FOR ALL TO authenticated
  USING (is_lider())
  WITH CHECK (is_lider());

CREATE POLICY "disc_read_own_grupos" ON grupos_discipulado
  FOR SELECT TO authenticated
  USING (
    discipulador_id IN (
      SELECT id FROM discipuladores WHERE usuario_id = auth.uid()
    )
  );

-- progresso_aulas
DROP POLICY IF EXISTS "disc_update_progresso" ON progresso_aulas;
DROP POLICY IF EXISTS "lider_all_progresso" ON progresso_aulas;

CREATE POLICY "lider_all_progresso" ON progresso_aulas
  FOR ALL TO authenticated USING (is_lider()) WITH CHECK (is_lider());

CREATE POLICY "disc_read_update_progresso" ON progresso_aulas
  FOR ALL TO authenticated
  USING (
    grupo_id IN (
      SELECT gd.id FROM grupos_discipulado gd
      JOIN discipuladores d ON d.id = gd.discipulador_id
      WHERE d.usuario_id = auth.uid()
    )
  );

-- acompanhamentos
DROP POLICY IF EXISTS "disc_own_acomp" ON acompanhamentos;
DROP POLICY IF EXISTS "lider_all_acomp" ON acompanhamentos;

CREATE POLICY "lider_all_acomp" ON acompanhamentos
  FOR ALL TO authenticated USING (is_lider()) WITH CHECK (is_lider());

CREATE POLICY "disc_own_acomp" ON acompanhamentos
  FOR ALL TO authenticated
  USING (
    discipulador_id IN (
      SELECT id FROM discipuladores WHERE usuario_id = auth.uid()
    )
  );
