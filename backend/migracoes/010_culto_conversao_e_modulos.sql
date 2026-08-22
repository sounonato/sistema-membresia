-- Migration 010: Persistência de culto_conversao e catálogo oficial de módulos de discipulado

-- 1. Coluna culto_conversao em novos_convertidos
ALTER TABLE novos_convertidos ADD COLUMN IF NOT EXISTS culto_conversao VARCHAR(100);

-- 2. Catálogo oficial de módulos de discipulado para todas as igrejas existentes
-- Preserva registros e módulos pré-existentes sem sobrescrever ou deletar
INSERT INTO modulos_discipulado (igreja_id, nome, descricao, total_aulas, ordem)
SELECT i.id, 'Discipulado Fundamentos', 'Fundamentos essenciais da caminhada cristã', 9, 1
FROM igrejas i
WHERE NOT EXISTS (
  SELECT 1 FROM modulos_discipulado md WHERE md.igreja_id = i.id AND md.nome = 'Discipulado Fundamentos'
);

INSERT INTO modulos_discipulado (igreja_id, nome, descricao, total_aulas, ordem)
SELECT i.id, 'Discipulado Recomeço', 'Um novo começo na caminhada com Cristo', 4, 2
FROM igrejas i
WHERE NOT EXISTS (
  SELECT 1 FROM modulos_discipulado md WHERE md.igreja_id = i.id AND md.nome = 'Discipulado Recomeço'
);

INSERT INTO modulos_discipulado (igreja_id, nome, descricao, total_aulas, ordem)
SELECT i.id, 'Discipulado de Outro Mundo', 'Vivendo os valores e princípios do Reino', 5, 3
FROM igrejas i
WHERE NOT EXISTS (
  SELECT 1 FROM modulos_discipulado md WHERE md.igreja_id = i.id AND md.nome = 'Discipulado de Outro Mundo'
);
