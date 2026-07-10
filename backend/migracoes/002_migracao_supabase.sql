-- Migração Supabase → PostgreSQL local
-- Execute: psql -d membresia -f migracoes/002_migracao_supabase.sql

DO $$
DECLARE igreja_id UUID;
BEGIN
  SELECT id INTO igreja_id FROM igrejas WHERE slug = 'nazareno-sede';

  -- MÓDULOS DE DISCIPULADO
  INSERT INTO modulos_discipulado (id, nome, descricao, total_aulas, ordem, igreja_id) VALUES ('94a4621b-0b87-4b7e-96c2-28ef6dadbe5f', 'Fundamentos da Fé', 'Bases da vida cristã: oração, leitura bíblica, comunhão e serviço', 12, 1, igreja_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO modulos_discipulado (id, nome, descricao, total_aulas, ordem, igreja_id) VALUES ('90139cdc-72f7-433a-a8f5-8010e73e0765', 'Vida no Espírito', 'O Espírito Santo, dons e frutos espirituais', 10, 2, igreja_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO modulos_discipulado (id, nome, descricao, total_aulas, ordem, igreja_id) VALUES ('222d1c4c-f61b-49c6-b803-c3bd3295185f', 'Discipulado Avançado', 'Aprofundamento teológico e formação de líderes', 14, 3, igreja_id) ON CONFLICT (id) DO NOTHING;

  -- DISCIPULADORES
  INSERT INTO discipuladores (id, nome, telefone, email, ativo, igreja_id) VALUES ('6d276312-8118-47f9-b47b-04875dd0127d', 'Ryan Miqueias', '81986901790', 'rnmiqueias@gmail.com', true, igreja_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO discipuladores (id, nome, telefone, email, ativo, igreja_id) VALUES ('14303c13-6fd2-4f03-ae06-84fb19eeffef', 'Lorran Moncada', '81997296565', 'dariomoncadamendes@gmail.com', true, igreja_id) ON CONFLICT (id) DO NOTHING;

  -- NOVOS CONVERTIDOS
  INSERT INTO novos_convertidos (id, nome, telefone, email, data_conversao, data_nascimento, endereco, bairro, cidade, estado_civil, genero, tem_filhos, qtd_filhos, profissao, como_conheceu, batizado, quer_batismo, ja_frequentava_igreja, igreja_anterior, ja_fez_discipulado, observacoes, status, igreja_id) VALUES ('7d15b0fa-6c3e-4694-8ec1-eb8410137f83', 'Ana Beatriz Barros da Silva', '81 9 81304315', 'anabsilva2311@gmail.com', '2026-06-22', '2010-11-23', 'Rua Grécia 346', 'Nossa Senhora do Ó', 'Paulista', 'solteiro', 'feminino', false, 0, 'Estudante', 'amigo', false, true, false, NULL, false, '', 'ativo', igreja_id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO novos_convertidos (id, nome, telefone, email, data_conversao, data_nascimento, endereco, bairro, cidade, estado_civil, genero, tem_filhos, qtd_filhos, profissao, como_conheceu, batizado, quer_batismo, ja_frequentava_igreja, igreja_anterior, ja_fez_discipulado, observacoes, status, igreja_id) VALUES ('4b682eef-8808-4b9d-b3f4-191bc61f453f', 'Giovanna Henrique Honorato Fischer', '(81) 98186-8314', 'giovanna.hfischer@hotmail.com', '2026-07-09', '2010-07-07', 'Rua engenho duas barras n31', 'Ibura ur3', 'Recife', 'solteiro', 'adolescente', false, 0, '', 'familiar', false, false, false, NULL, false, '', 'ativo', igreja_id) ON CONFLICT (id) DO NOTHING;

END $$;
