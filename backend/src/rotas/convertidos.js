const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

// Registrar middlewares de autenticação e tenant
router.use(autenticar);
router.use(identificarTenant);

// GET /api/convertidos - Listar novos convertidos (com isolamento por igreja_id)
router.get('/', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const pagina = parseInt(req.query.pagina) || 1;
  const porPagina = Math.min(parseInt(req.query.por_pagina) || 50, 100);
  const offset = (pagina - 1) * porPagina;

  try {
    let countQueryText = '';
    let listQueryText = '';
    const params = [];
    let paramIndex = 1;

    if (req.usuarioPerfil === 'discipulador') {
      countQueryText = `
        SELECT COUNT(DISTINCT nc.id) FROM novos_convertidos nc
        JOIN grupo_membros gm ON nc.id = gm.convertido_id
        JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
        WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
      `;
      listQueryText = `
        SELECT DISTINCT nc.* FROM novos_convertidos nc
        JOIN grupo_membros gm ON nc.id = gm.convertido_id
        JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
        WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
        ORDER BY nc.nome ASC
        LIMIT $3 OFFSET $4
      `;
      params.push(req.discipuladorId, req.igrejaId);
      paramIndex = 3;
    } else {
      let whereClause = '';
      if (req.igrejaId) {
        whereClause = ' WHERE nc.igreja_id = $1';
        params.push(req.igrejaId);
        paramIndex = 2;
      }
      countQueryText = `SELECT COUNT(*) FROM novos_convertidos nc${whereClause}`;
      listQueryText = `
        SELECT nc.* FROM novos_convertidos nc
        ${whereClause}
        ORDER BY nc.nome ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    }

    const countResult = await db.query(countQueryText, params);
    const total = parseInt(countResult.rows[0].count);

    const paginatedParams = [...params, porPagina, offset];
    const { rows } = await db.query(listQueryText, paginatedParams);

    return res.json({
      data: rows,
      total,
      pagina,
      paginas: Math.ceil(total / porPagina),
      por_pagina: porPagina,
    });
  } catch (err) {
    console.error('Erro ao listar novos convertidos:', err);
    return res.status(500).json({ error: 'Erro interno ao listar novos convertidos' });
  }
});

// GET /api/convertidos/:id - Detalhes do convertido
router.get('/:id', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;

  try {
    const params = [id];
    let queryText = `
      SELECT nc.*, gd.discipulador_id 
      FROM novos_convertidos nc
      LEFT JOIN grupo_membros gm ON nc.id = gm.convertido_id
      LEFT JOIN grupos_discipulado gd ON gm.grupo_id = gd.id AND gd.status = 'ativo'
      WHERE nc.id = $1
    `;

    if (req.igrejaId) {
      queryText += ' AND nc.igreja_id = $2';
      params.push(req.igrejaId);
    }

    if (req.usuarioPerfil === 'discipulador') {
      // Verificar se o convertido pertence ao grupo do discipulador
      const checkVinculo = await db.query(
        `SELECT 1 FROM grupo_membros gm
         JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
         WHERE gm.convertido_id = $1 AND gd.discipulador_id = $2 AND gd.igreja_id = $3`,
        [id, req.discipuladorId, req.igrejaId]
      );

      if (checkVinculo.rows.length === 0) {
        return res.status(403).json({ error: 'Acesso negado: você não lidera o discipulado deste convertido' });
      }
    }

    const resultado = await db.query(queryText, params);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Convertido não encontrado nesta igreja' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao obter detalhes do convertido:', err);
    return res.status(500).json({ error: 'Erro interno ao obter convertido' });
  }
});

// POST /api/convertidos - Cadastrar novo convertido (Apenas admin e lider)
router.post('/', checkPerfil(['admin', 'lider']), async (req, res) => {
  const {
    nome, telefone, email, data_conversao, data_nascimento,
    endereco, bairro, cidade, estado_civil, genero,
    tem_filhos, qtd_filhos, profissao, como_conheceu,
    batizado, quer_batismo, ja_frequentava_igreja, igreja_anterior,
    ja_fez_discipulado, observacoes, status
  } = req.body;

  if (!nome || !telefone || !data_conversao) {
    return res.status(400).json({ error: 'Nome, telefone e data de conversão são obrigatórios' });
  }

  // Determinar igreja_id (se superadmin, deve passar igreja_id no body ou via header)
  const novoConvertidoIgrejaId = req.usuarioPerfil === 'superadmin' ? (req.body.igreja_id || req.igrejaId) : req.igrejaId;

  if (!novoConvertidoIgrejaId) {
    return res.status(400).json({ error: 'É necessário selecionar uma igreja (tenant) para esta operação' });
  }

  try {
    // Buscar plano e contagem atual da igreja
    const planoResult = await db.query(
      `SELECT i.plano, COUNT(nc.id) AS total
       FROM igrejas i
       LEFT JOIN novos_convertidos nc ON nc.igreja_id = i.id AND nc.status = 'ativo'
       WHERE i.id = $1
       GROUP BY i.plano`,
      [novoConvertidoIgrejaId]
    );

    if (planoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    const { plano, total } = planoResult.rows[0];
    const LIMITES = { basico: 100, pro: Infinity };

    if (parseInt(total) >= (LIMITES[plano] ?? 100)) {
      return res.status(403).json({
        error: `Seu plano ${plano} permite até ${LIMITES[plano]} membros ativos. Faça upgrade para continuar.`
      });
    }

    const queryText = `
      INSERT INTO novos_convertidos (
        igreja_id, nome, telefone, email, data_conversao, data_nascimento,
        endereco, bairro, cidade, estado_civil, genero,
        tem_filhos, qtd_filhos, profissao, como_conheceu,
        batizado, quer_batismo, ja_frequentava_igreja, igreja_anterior,
        ja_fez_discipulado, observacoes, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `;

    const valores = [
      novoConvertidoIgrejaId, nome, telefone, email || null, data_conversao, data_nascimento || null,
      endereco || null, bairro || null, cidade || null, estado_civil || null, genero || null,
      tem_filhos === undefined ? false : tem_filhos, qtd_filhos || 0, profissao || null, como_conheceu || null,
      batizado === undefined ? false : batizado, quer_batismo === undefined ? false : quer_batismo,
      ja_frequentava_igreja === undefined ? false : ja_frequentava_igreja, igreja_anterior || null,
      ja_fez_discipulado === undefined ? false : ja_fez_discipulado, observacoes || null, status || 'ativo'
    ];

    const resultado = await db.query(queryText, valores);
    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao cadastrar novo convertido:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar novo convertido' });
  }
});

// PUT /api/convertidos/:id - Atualizar convertido (Apenas admin e lider)
router.put('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const {
    nome, telefone, email, data_conversao, data_nascimento,
    endereco, bairro, cidade, estado_civil, genero,
    tem_filhos, qtd_filhos, profissao, como_conheceu,
    batizado, quer_batismo, ja_frequentava_igreja, igreja_anterior,
    ja_fez_discipulado, observacoes, status
  } = req.body;

  if (!nome || !telefone || !data_conversao) {
    return res.status(400).json({ error: 'Nome, telefone e data de conversão são obrigatórios' });
  }

  try {
    let queryText = `
      UPDATE novos_convertidos SET
        nome = $1, telefone = $2, email = $3, data_conversao = $4, data_nascimento = $5,
        endereco = $6, bairro = $7, cidade = $8, estado_civil = $9, genero = $10,
        tem_filhos = $11, qtd_filhos = $12, profissao = $13, como_conheceu = $14,
        batizado = $15, quer_batismo = $16, ja_frequentava_igreja = $17, igreja_anterior = $18,
        ja_fez_discipulado = $19, observacoes = $20, status = $21
      WHERE id = $22
    `;
    const valores = [
      nome, telefone, email || null, data_conversao, data_nascimento || null,
      endereco || null, bairro || null, cidade || null, estado_civil || null, genero || null,
      tem_filhos === undefined ? false : tem_filhos, qtd_filhos || 0, profissao || null, como_conheceu || null,
      batizado === undefined ? false : batizado, quer_batismo === undefined ? false : quer_batismo,
      ja_frequentava_igreja === undefined ? false : ja_frequentava_igreja, igreja_anterior || null,
      ja_fez_discipulado === undefined ? false : ja_fez_discipulado, observacoes || null, status || 'ativo',
      id
    ];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $23';
      valores.push(req.igrejaId);
    }

    queryText += ' RETURNING *';

    const resultado = await db.query(queryText, valores);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Convertido não encontrado nesta igreja' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar convertido:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar convertido' });
  }
});

// PATCH /api/convertidos/:id/transferir - Transferir convertido para outra igreja (Apenas superadmin)
router.patch('/:id/transferir', checkPerfil([]), async (req, res) => {
  if (req.usuarioPerfil !== 'superadmin') {
    return res.status(403).json({ error: 'Apenas superadmin pode transferir convertidos entre igrejas' });
  }
  const { id } = req.params;
  const { igreja_id } = req.body;
  if (!igreja_id) return res.status(400).json({ error: 'igreja_id é obrigatório' });
  try {
    const resultado = await db.query(
      'UPDATE novos_convertidos SET igreja_id = $1 WHERE id = $2 RETURNING id, nome, igreja_id',
      [igreja_id, id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Convertido não encontrado' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao transferir convertido:', err);
    return res.status(500).json({ error: 'Erro interno ao transferir convertido' });
  }
});

// DELETE /api/convertidos/:id - Excluir convertido (Apenas admin e lider)
router.delete('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;

  try {
    let queryText = 'DELETE FROM novos_convertidos WHERE id = $1';
    const params = [id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $2';
      params.push(req.igrejaId);
    }

    queryText += ' RETURNING id';

    const resultado = await db.query(queryText, params);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Convertido não encontrado nesta igreja' });
    }
    return res.json({ message: 'Convertido removido com sucesso', id });
  } catch (err) {
    console.error('Erro ao excluir convertido:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir convertido' });
  }
});

// PATCH /api/convertidos/:id/responsavel — Atribuir discipulador a um convertido (admin/lider)
router.patch('/:id/responsavel', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params; // id do convertido
  const { discipulador_id } = req.body; // pode ser null para remover

  try {
    // Remover de grupos existentes primeiro
    await db.query(
      `DELETE FROM grupo_membros WHERE convertido_id = $1
       AND grupo_id IN (
         SELECT id FROM grupos_discipulado WHERE igreja_id = $2
       )`,
      [id, req.igrejaId]
    );

    if (!discipulador_id) {
      return res.json({ message: 'Responsável removido' });
    }

    // Verificar discipulador
    const disc = await db.query(
      'SELECT * FROM discipuladores WHERE id = $1 AND igreja_id = $2 AND ativo = true',
      [discipulador_id, req.igrejaId]
    );
    if (disc.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado ou inativo' });
    }

    // Buscar ou criar grupo padrão do discipulador
    let grupo = await db.query(
      `SELECT id FROM grupos_discipulado
       WHERE discipulador_id = $1 AND igreja_id = $2 AND status = 'ativo'
       ORDER BY created_at DESC LIMIT 1`,
      [discipulador_id, req.igrejaId]
    );

    let grupoId;
    if (grupo.rows.length === 0) {
      // Criar grupo padrão
      const novoGrupo = await db.query(
        `INSERT INTO grupos_discipulado (igreja_id, nome, discipulador_id, data_inicio, status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'ativo') RETURNING id`,
        [req.igrejaId, `Grupo de ${disc.rows[0].nome}`, discipulador_id]
      );
      grupoId = novoGrupo.rows[0].id;
    } else {
      grupoId = grupo.rows[0].id;
    }

    // Adicionar convertido ao grupo
    await db.query(
      `INSERT INTO grupo_membros (igreja_id, grupo_id, convertido_id)
       VALUES ($1, $2, $3) ON CONFLICT (grupo_id, convertido_id) DO NOTHING`,
      [req.igrejaId, grupoId, id]
    );

    return res.json({
      message: 'Responsável atribuído',
      discipulador: disc.rows[0],
      grupo_id: grupoId
    });
  } catch (err) {
    console.error('Erro ao atribuir responsável:', err);
    return res.status(500).json({ error: 'Erro interno ao atribuir responsável' });
  }
});

module.exports = router;
