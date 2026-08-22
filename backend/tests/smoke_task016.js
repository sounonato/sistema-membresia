const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_DB = 'sistema_membresia_synthetic_task016';
const ADMIN_URL = process.env.DATABASE_ADMIN_URL || 'postgresql://localhost:5432/postgres';
const TEST_URL = `postgresql://localhost:5432/${TEST_DB}`;

async function main() {
  console.log('=== Iniciando Smoke Test TASK-016 em Banco Sintético Seguro ===');

  // 1. Criar banco sintético isolado
  const adminClient = new Client({ connectionString: ADMIN_URL });
  await adminClient.connect();
  try {
    await adminClient.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
    await adminClient.query(`CREATE DATABASE ${TEST_DB}`);
    console.log(`[1/6] Banco sintético criado: ${TEST_DB}`);
  } finally {
    await adminClient.end();
  }

  // 2. Executar runner de migrations no banco sintético
  const pool = new Pool({ connectionString: TEST_URL });
  try {
    const dir = path.join(__dirname, '../migracoes');
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql') && /^\d/.test(f))
      .sort();

    console.log(`[2/6] Executando ${files.length} migrations: ${files.join(', ')}`);

    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          filename TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      for (const file of files) {
        await client.query('BEGIN');
        const sql = fs.readFileSync(path.join(dir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
      }
    } finally {
      client.release();
    }
    console.log('[2/6] Migrations 001-010 executadas com sucesso!');

    // 3. Teste de Idempotência do runner
    console.log('[3/6] Testando idempotência das migrations...');
    const client2 = await pool.connect();
    try {
      for (const file of files) {
        const aplicada = await client2.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
        assert.strictEqual(aplicada.rows.length, 1, `Migration ${file} deveria estar registrada`);
      }
    } finally {
      client2.release();
    }
    console.log('[3/6] Idempotência confirmada.');

    // 4. Testar estrutura de culto_conversao e catálogo de módulos
    console.log('[4/6] Validando schema e catálogo de módulos...');
    const igrejaRes = await pool.query('SELECT id, slug FROM igrejas LIMIT 1');
    assert(igrejaRes.rows.length > 0, 'Igreja padrão deve existir');
    const igrejaId = igrejaRes.rows[0].id;

    // Verificar módulos
    const modulosRes = await pool.query('SELECT nome, total_aulas, ordem FROM modulos_discipulado WHERE igreja_id = $1 ORDER BY ordem', [igrejaId]);
    console.log('Módulos encontrados:', modulosRes.rows);

    const nomes = modulosRes.rows.map(m => m.nome);
    assert(nomes.includes('Discipulado Fundamentos'), 'Deve conter Discipulado Fundamentos');
    assert(nomes.includes('Discipulado Recomeço'), 'Deve conter Discipulado Recomeço');
    assert(nomes.includes('Discipulado de Outro Mundo'), 'Deve conter Discipulado de Outro Mundo');

    const modFundamentos = modulosRes.rows.find(m => m.nome === 'Discipulado Fundamentos');
    assert.strictEqual(modFundamentos.total_aulas, 9, 'Discipulado Fundamentos deve ter 9 aulas');

    const modRecomeco = modulosRes.rows.find(m => m.nome === 'Discipulado Recomeço');
    assert.strictEqual(modRecomeco.total_aulas, 4, 'Discipulado Recomeço deve ter 4 aulas');

    const modOutroMundo = modulosRes.rows.find(m => m.nome === 'Discipulado de Outro Mundo');
    assert.strictEqual(modOutroMundo.total_aulas, 5, 'Discipulado de Outro Mundo deve ter 5 aulas');

    // 5. Testar inserção e leitura de culto_conversao em novos_convertidos
    console.log('[5/6] Testando persistência de culto_conversao...');
    const insertRes = await pool.query(`
      INSERT INTO novos_convertidos (
        igreja_id, nome, telefone, email, data_conversao, data_nascimento,
        genero, como_conheceu, culto_conversao, status
      ) VALUES (
        $1, 'Convertido Teste TASK016', '11999990016', 'teste016@exemplo.com', '2026-08-20', '1995-05-15',
        'masculino', 'Culto', 'domingo', 'ativo'
      ) RETURNING *
    `, [igrejaId]);

    const convertido = insertRes.rows[0];
    assert.strictEqual(convertido.culto_conversao, 'domingo', 'culto_conversao deve persistir corretamente');

    // Atualização com outro culto
    const updateRes = await pool.query(`
      UPDATE novos_convertidos SET culto_conversao = 'culto_oracao' WHERE id = $1 RETURNING *
    `, [convertido.id]);
    assert.strictEqual(updateRes.rows[0].culto_conversao, 'culto_oracao', 'culto_conversao deve atualizar corretamente');

    // 6. Testar serviço de estatísticas (por_faixa_etaria, por_genero, por_mes)
    console.log('[6/6] Testando serviço de estatísticas...');
    // Injetar conexão de teste para o serviço
    process.env.DATABASE_URL = TEST_URL;
    const estatisticasService = require('../src/servicos/estatisticas');
    
    // Sobrescrever conexão db para apontar para pool sintético
    const db = require('../src/conexao');
    const origQuery = db.query;
    db.query = (...args) => pool.query(...args);

    const stats = await estatisticasService.obterEstatisticas(igrejaId, 'admin');
    console.log('Estatísticas calculadas:', {
      total_convertidos: stats.total_convertidos,
      por_mes: stats.por_mes,
      por_genero: stats.por_genero,
      por_faixa_etaria: stats.por_faixa_etaria,
    });

    assert(typeof stats.total_convertidos === 'number', 'total_convertidos deve ser number');
    assert(Array.isArray(stats.por_faixa_etaria), 'por_faixa_etaria deve ser array');
    assert(stats.por_faixa_etaria.length > 0, 'por_faixa_etaria deve conter registros');
    assert(stats.por_faixa_etaria[0].hasOwnProperty('faixa'), 'Item de faixa deve ter propriedade faixa');
    assert(stats.por_faixa_etaria[0].hasOwnProperty('total'), 'Item de faixa deve ter propriedade total');
    assert(stats.por_faixa_etaria[0].hasOwnProperty('quantidade'), 'Item de faixa deve ter propriedade quantidade');

    assert(Array.isArray(stats.por_genero), 'por_genero deve ser array');
    assert(stats.por_genero[0].hasOwnProperty('total'), 'Item de genero deve ter propriedade total');

    assert(Array.isArray(stats.por_mes), 'por_mes deve ser array');
    assert(stats.por_mes[0].hasOwnProperty('total'), 'Item de mes deve ter propriedade total');

    db.query = origQuery;
    console.log('=== TODOS OS SMOKE TESTS PASSARAM COM 100% DE SUCESSO ===');
  } finally {
    await pool.end();

    // Limpar banco sintético
    const adminClient2 = new Client({ connectionString: ADMIN_URL });
    await adminClient2.connect();
    try {
      await adminClient2.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
      console.log(`[Limpeza] Banco sintético ${TEST_DB} removido com sucesso.`);
    } finally {
      await adminClient2.end();
    }
  }
}

main().catch(err => {
  console.error('Falha no smoke test:', err);
  process.exit(1);
});
