const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);

// GET /api/discipulado/grupos - Listar grupos
router.get('/grupos', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  try {
    let queryText = `
      SELECT gd.*, d.nome as discipulador_nome, md.nome as modulo_nome 
      FROM grupos_discipulado gd
      LEFT JOIN discipuladores d ON gd.discipulador_id = d.id
      LEFT JOIN modulos_discipulado md ON gd.modulo_id = md.id
    `;
    const params = [];

    const conditions = [];

    if (req.usuarioPerfil === 'discipulador') {
      conditions.push('gd.discipulador_id = $' + (params.length + 1));
      params.push(req.discipuladorId);
    }

    if (req.igrejaId) {
      conditions.push('gd.igreja_id = $' + (params.length + 1));
      params.push(req.igrejaId);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY gd.created_at DESC';

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar grupos:', err);
    return res.status(500).json({ error: 'Erro interno ao listar grupos' });
  }
});

// GET /api/discipulado/grupos/:id - Detalhes do grupo (com membros)
router.get('/grupos/:id', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;

  try {
    if (req.usuarioPerfil === 'discipulador') {
      const checkGrupo = await db.query(
        'SELECT 1 FROM grupos_discipulado WHERE id = $1 AND discipulador_id = $2 AND igreja_id = $3',
        [id, req.discipuladorId, req.igrejaId]
      );
      if (checkGrupo.rows.length === 0) {
        return res.status(403).json({ error: 'Acesso negado: você não é o discipulador deste grupo' });
      }
    }

    let grupoQuery = `
      SELECT gd.*, d.nome as discipulador_nome, md.nome as modulo_nome 
      FROM grupos_discipulado gd
      LEFT JOIN discipuladores d ON gd.discipulador_id = d.id
      LEFT JOIN modulos_discipulado md ON gd.modulo_id = md.id
      WHERE gd.id = $1
    `;
    const grupoParams = [id];

    if (req.igrejaId) {
      grupoQuery += ' AND gd.igreja_id = $2';
      grupoParams.push(req.igrejaId);
    }

    const grupoRes = await db.query(grupoQuery, grupoParams);

    if (grupoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado nesta igreja' });
    }

    // Buscar os membros do grupo
    let membrosQuery = `
      SELECT nc.id, nc.nome, nc.telefone, nc.email, nc.status, gm.created_at as data_adesao
       FROM grupo_membros gm
       JOIN novos_convertidos nc ON gm.convertido_id = nc.id
       WHERE gm.grupo_id = $1
    `;
    const membrosParams = [id];

    if (req.igrejaId) {
      membrosQuery += ' AND gm.igreja_id = $2';
      membrosParams.push(req.igrejaId);
    }

    membrosQuery += ' ORDER BY nc.nome ASC';

    const membrosRes = await db.query(membrosQuery, membrosParams);

    const grupo = grupoRes.rows[0];
    grupo.membros = membrosRes.rows;

    return res.json(grupo);
  } catch (err) {
    console.error('Erro ao obter grupo:', err);
    return res.status(500).json({ error: 'Erro interno ao obter grupo' });
  }
});

// POST /api/discipulado/grupos - Criar grupo (Apenas admin e lider)
router.post('/grupos', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { nome, discipulador_id, modulo_id, data_inicio, status } = req.body;

  if (!nome || !discipulador_id || !modulo_id) {
    return res.status(400).json({ error: 'Nome, discipulador e módulo são obrigatórios' });
  }

  const novoGrupoIgrejaId = req.usuarioPerfil === 'superadmin' ? (req.body.igreja_id || req.igrejaId) : req.igrejaId;

  if (!novoGrupoIgrejaId) {
    return res.status(400).json({ error: 'É necessário selecionar uma igreja (tenant)' });
  }

  try {
    // Validar se discipulador e módulo pertencem à mesma igreja
    const discipuladorValido = await db.query('SELECT 1 FROM discipuladores WHERE id = $1 AND igreja_id = $2', [discipulador_id, novoGrupoIgrejaId]);
    const moduloValido = await db.query('SELECT 1 FROM modulos_discipulado WHERE id = $1 AND igreja_id = $2', [modulo_id, novoGrupoIgrejaId]);

    if (discipuladorValido.rows.length === 0 || moduloValido.rows.length === 0) {
      return res.status(400).json({ error: 'Discipulador ou módulo inválido para esta igreja' });
    }

    const resultado = await db.query(
      `INSERT INTO grupos_discipulado (igreja_id, nome, discipulador_id, modulo_id, data_inicio, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [novoGrupoIgrejaId, nome, discipulador_id, modulo_id, data_inicio || null, status || 'ativo']
    );
    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar grupo:', err);
    return res.status(500).json({ error: 'Erro interno ao criar grupo' });
  }
});

// PUT /api/discipulado/grupos/:id - Editar grupo (Apenas admin e lider)
router.put('/grupos/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { nome, discipulador_id, modulo_id, data_inicio, status } = req.body;

  if (!nome || !discipulador_id || !modulo_id) {
    return res.status(400).json({ error: 'Nome, discipulador e módulo são obrigatórios' });
  }

  try {
    let queryText = `
      UPDATE grupos_discipulado 
      SET nome = $1, discipulador_id = $2, modulo_id = $3, data_inicio = $4, status = $5
      WHERE id = $6
    `;
    const valores = [nome, discipulador_id, modulo_id, data_inicio, status || 'ativo', id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $7';
      valores.push(req.igrejaId);
    }

    queryText += ' RETURNING *';

    const resultado = await db.query(queryText, valores);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado nesta igreja' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao editar grupo:', err);
    return res.status(500).json({ error: 'Erro interno ao editar grupo' });
  }
});

// POST /api/discipulado/grupos/:id/membros - Adicionar membro ao grupo (Apenas admin e lider)
router.post('/grupos/:id/membros', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { convertido_id } = req.body;

  if (!convertido_id) {
    return res.status(400).json({ error: 'ID do convertido é obrigatório' });
  }

  try {
    // Verificar se o grupo existe e obter igreja_id
    let grupoQuery = 'SELECT igreja_id FROM grupos_discipulado WHERE id = $1';
    const grupoParams = [id];
    if (req.igrejaId) {
      grupoQuery += ' AND igreja_id = $2';
      grupoParams.push(req.igrejaId);
    }
    const grupoRes = await db.query(grupoQuery, grupoParams);

    if (grupoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado nesta igreja' });
    }

    const grupoIgrejaId = grupoRes.rows[0].igreja_id;

    // Verificar se o convertido existe na mesma igreja
    const convertidoRes = await db.query('SELECT 1 FROM novos_convertidos WHERE id = $1 AND igreja_id = $2', [convertido_id, grupoIgrejaId]);
    if (convertidoRes.rows.length === 0) {
      return res.status(400).json({ error: 'Convertido não encontrado nesta igreja' });
    }

    // Inserir relacionamento
    const resultado = await db.query(
      'INSERT INTO grupo_membros (igreja_id, grupo_id, convertido_id) VALUES ($1, $2, $3) RETURNING *',
      [grupoIgrejaId, id, convertido_id]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Este convertido já é membro deste grupo' });
    }
    console.error('Erro ao adicionar membro ao grupo:', err);
    return res.status(500).json({ error: 'Erro interno ao adicionar membro' });
  }
});

// DELETE /api/discipulado/grupos/:id/membros/:convertidoId - Remover membro do grupo (Apenas admin e lider)
router.delete('/grupos/:id/membros/:convertidoId', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id, convertidoId } = req.params;

  try {
    let queryText = 'DELETE FROM grupo_membros WHERE grupo_id = $1 AND convertido_id = $2';
    const params = [id, convertidoId];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $3';
      params.push(req.igrejaId);
    }

    queryText += ' RETURNING *';

    const resultado = await db.query(queryText, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado neste grupo' });
    }

    return res.json({ message: 'Membro removido do grupo com sucesso' });
  } catch (err) {
    console.error('Erro ao remover membro do grupo:', err);
    return res.status(500).json({ error: 'Erro interno ao remover membro' });
  }
});

// GET /api/discipulado/grupos/:id/progresso - Ver progresso de aulas
router.get('/grupos/:id/progresso', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;

  try {
    if (req.usuarioPerfil === 'discipulador') {
      const checkGrupo = await db.query(
        'SELECT 1 FROM grupos_discipulado WHERE id = $1 AND discipulador_id = $2 AND igreja_id = $3',
        [id, req.discipuladorId, req.igrejaId]
      );
      if (checkGrupo.rows.length === 0) {
        return res.status(403).json({ error: 'Acesso negado: você não é o discipulador deste grupo' });
      }
    }

    let queryText = 'SELECT * FROM progresso_aulas WHERE grupo_id = $1';
    const params = [id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $2';
      params.push(req.igrejaId);
    }

    queryText += ' ORDER BY aula_numero ASC';

    const progressoRes = await db.query(queryText, params);
    return res.json(progressoRes.rows);
  } catch (err) {
    console.error('Erro ao obter progresso de aulas:', err);
    return res.status(500).json({ error: 'Erro interno ao obter progresso de aulas' });
  }
});

// POST /api/discipulado/grupos/:id/progresso - Registrar/atualizar progresso de uma aula (Admin, Lider ou Discipulador do grupo)
router.post('/grupos/:id/progresso', checkPerfil(['admin', 'lider', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  const { aula_numero, data_aula, concluida, observacoes } = req.body;

  if (aula_numero === undefined || concluida === undefined) {
    return res.status(400).json({ error: 'Número da aula e status de conclusão são obrigatórios' });
  }

  try {
    // Buscar o grupo e obter seu igreja_id
    let grupoQuery = 'SELECT igreja_id FROM grupos_discipulado WHERE id = $1';
    const grupoParams = [id];

    if (req.usuarioPerfil === 'discipulador') {
      grupoQuery += ' AND discipulador_id = $2';
      grupoParams.push(req.discipuladorId);
    }

    if (req.igrejaId) {
      grupoQuery += ` AND igreja_id = $${grupoParams.length + 1}`;
      grupoParams.push(req.igrejaId);
    }

    const checkGrupo = await db.query(grupoQuery, grupoParams);

    if (checkGrupo.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado ou grupo não encontrado nesta igreja' });
    }

    const grupoIgrejaId = checkGrupo.rows[0].igreja_id;

    // Verificar se a aula já foi registrada para este grupo
    const aulaExistente = await db.query(
      'SELECT id FROM progresso_aulas WHERE grupo_id = $1 AND aula_numero = $2 AND igreja_id = $3',
      [id, aula_numero, grupoIgrejaId]
    );

    let resultado;
    if (aulaExistente.rows.length > 0) {
      // Atualizar
      resultado = await db.query(
        `UPDATE progresso_aulas 
         SET data_aula = $1, concluida = $2, observacoes = $3 
         WHERE grupo_id = $4 AND aula_numero = $5 AND igreja_id = $6 
         RETURNING *`,
        [data_aula || null, concluida, observacoes || null, id, aula_numero, grupoIgrejaId]
      );
    } else {
      // Inserir
      resultado = await db.query(
        `INSERT INTO progresso_aulas (igreja_id, grupo_id, aula_numero, data_aula, concluida, observacoes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [grupoIgrejaId, id, aula_numero, data_aula || null, concluida, observacoes || null]
      );
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao registrar progresso de aula:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar progresso de aula' });
  }
});

module.exports = router;
