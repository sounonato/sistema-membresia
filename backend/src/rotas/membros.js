const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

// Todos os endpoints de /api/membros requerem autenticação e tenant
router.use(autenticar);
router.use(identificarTenant);

// 7.1 GET /api/membros/stats
router.get('/stats', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  try {
    const igrejaId = req.igrejaId;

    const totalRes = await db.query(
      "SELECT COUNT(*) as total FROM membros WHERE igreja_id = $1 AND status != 'excluido'",
      [igrejaId]
    );

    const statusRes = await db.query(
      "SELECT status, COUNT(*) as quantidade FROM membros WHERE igreja_id = $1 AND status != 'excluido' GROUP BY status",
      [igrejaId]
    );

    const batizadosRes = await db.query(
      "SELECT COUNT(*) as batizados FROM membros WHERE igreja_id = $1 AND batizado = true AND status = 'ativo'",
      [igrejaId]
    );

    const discipuladoRes = await db.query(
      "SELECT COUNT(*) as fez_discipulado FROM membros WHERE igreja_id = $1 AND fez_discipulado = true AND status = 'ativo'",
      [igrejaId]
    );

    const generoRes = await db.query(
      "SELECT COALESCE(genero, 'nao_informado') as genero, COUNT(*) as quantidade FROM membros WHERE igreja_id = $1 AND status = 'ativo' GROUP BY genero",
      [igrejaId]
    );

    const ministerioRes = await db.query(
      `SELECT mn.nome as ministerio, COUNT(mm.membro_id) as quantidade
       FROM ministerios mn
       LEFT JOIN membro_ministerios mm ON mn.id = mm.ministerio_id AND mm.ativo = true
       WHERE mn.igreja_id = $1 AND mn.ativo = true
       GROUP BY mn.nome
       ORDER BY quantidade DESC`,
      [igrejaId]
    );

    const semContato60Res = await db.query(
      "SELECT COUNT(*) as sem_contato_60 FROM membros WHERE igreja_id = $1 AND status = 'ativo' AND ultimo_contato < CURRENT_DATE - INTERVAL '60 days'",
      [igrejaId]
    );

    const semContato90Res = await db.query(
      "SELECT COUNT(*) as sem_contato_90 FROM membros WHERE igreja_id = $1 AND status = 'ativo' AND ultimo_contato < CURRENT_DATE - INTERVAL '90 days'",
      [igrejaId]
    );

    const cursoMembreRes = await db.query(
      "SELECT COUNT(*) as fez_curso FROM membros WHERE igreja_id = $1 AND fez_curso_membresia = true AND status = 'ativo'",
      [igrejaId]
    );

    // Process status stats into individual properties
    let ativos = 0;
    let inativos = 0;
    let transferidos = 0;

    statusRes.rows.forEach(r => {
      if (r.status === 'ativo') ativos = parseInt(r.quantidade);
      if (r.status === 'inativo') inativos = parseInt(r.quantidade);
      if (r.status === 'transferido') transferidos = parseInt(r.quantidade);
    });

    return res.json({
      total: parseInt(totalRes.rows[0].total || 0),
      ativos,
      inativos,
      transferidos,
      batizados: parseInt(batizadosRes.rows[0].batizados || 0),
      fez_discipulado: parseInt(discipuladoRes.rows[0].fez_discipulado || 0),
      por_genero: generoRes.rows.map(r => ({ genero: r.genero, quantidade: parseInt(r.quantidade) })),
      por_ministerio: ministerioRes.rows.map(r => ({ ministerio: r.ministerio, quantidade: parseInt(r.quantidade) })),
      sem_contato_60: parseInt(semContato60Res.rows[0].sem_contato_60 || 0),
      sem_contato_90: parseInt(semContato90Res.rows[0].sem_contato_90 || 0),
      fez_curso_membresia: parseInt(cursoMembreRes.rows[0].fez_curso || 0)
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas de membros:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar estatísticas' });
  }
});

// 7.2 GET /api/membros/sem-contato
router.get('/sem-contato', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const dias = parseInt(req.query.dias) || 60;
  try {
    const resultado = await db.query(
      `SELECT
        m.id,
        m.nome,
        m.telefone,
        m.email,
        m.ultimo_contato,
        CURRENT_DATE - m.ultimo_contato AS dias_sem_contato,
        COALESCE(
          (
            SELECT STRING_AGG(mn.nome, ', ')
            FROM membro_ministerios mm
            JOIN ministerios mn ON mm.ministerio_id = mn.id
            WHERE mm.membro_id = m.id AND mm.ativo = true
          ),
          'Sem ministério'
        ) AS ministerios
      FROM membros m
      WHERE m.igreja_id = $1
        AND m.status = 'ativo'
        AND m.ultimo_contato < CURRENT_DATE - ($2 * INTERVAL '1 day')
      ORDER BY m.ultimo_contato ASC`,
      [req.igrejaId, dias]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao buscar membros sem contato:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar membros sem contato' });
  }
});

// 7.3 GET /api/membros
router.get('/', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { status, busca, ministerio_id, sem_ministerio } = req.query;
  try {
    let queryText = `
      SELECT
        m.id,
        m.nome,
        m.telefone,
        m.email,
        m.data_nascimento,
        m.genero,
        m.status,
        m.data_entrada,
        m.tipo_entrada,
        m.batizado,
        m.fez_discipulado,
        m.ultimo_contato,
        CURRENT_DATE - m.ultimo_contato AS dias_sem_contato,
        COALESCE(
          (
            SELECT JSON_AGG(JSON_BUILD_OBJECT('id', mn.id, 'nome', mn.nome, 'cargo', mm.cargo))
            FROM membro_ministerios mm
            JOIN ministerios mn ON mm.ministerio_id = mn.id
            WHERE mm.membro_id = m.id AND mm.ativo = true
          ),
          '[]'::json
        ) AS ministerios
      FROM membros m
      WHERE m.igreja_id = $1
    `;

    const params = [req.igrejaId];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND m.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      queryText += " AND m.status != 'excluido'";
    }

    if (busca) {
      queryText += ` AND (m.nome ILIKE $${paramIndex} OR m.telefone ILIKE $${paramIndex})`;
      params.push(`%${busca}%`);
      paramIndex++;
    }

    if (ministerio_id) {
      queryText += ` AND EXISTS (SELECT 1 FROM membro_ministerios mm WHERE mm.membro_id = m.id AND mm.ministerio_id = $${paramIndex} AND mm.ativo = true)`;
      params.push(ministerio_id);
      paramIndex++;
    }

    if (sem_ministerio === 'true') {
      queryText += ` AND NOT EXISTS (SELECT 1 FROM membro_ministerios mm WHERE mm.membro_id = m.id AND mm.ativo = true)`;
    }

    queryText += ` ORDER BY m.nome ASC`;

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar membros:', err);
    return res.status(500).json({ error: 'Erro interno ao listar membros' });
  }
});

// 7.4 GET /api/membros/:id
router.get('/:id', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  try {
    const [membroRes, ministeriosRes, cargosRes, logRes] = await Promise.all([
      db.query(
        `SELECT
          m.*,
          c.nome AS conjuge_nome_cadastrado,
          nc.nome AS convertido_nome
        FROM membros m
        LEFT JOIN membros c ON m.conjuge_id = c.id
        LEFT JOIN novos_convertidos nc ON m.convertido_id = nc.id
        WHERE m.id = $1 AND m.igreja_id = $2`,
        [id, req.igrejaId]
      ),
      db.query(
        `SELECT
          mm.id,
          mm.cargo,
          mm.data_entrada,
          mm.ativo,
          mn.id AS ministerio_id,
          mn.nome AS ministerio_nome
        FROM membro_ministerios mm
        JOIN ministerios mn ON mm.ministerio_id = mn.id
        WHERE mm.membro_id = $1
        ORDER BY mm.ativo DESC, mn.nome ASC`,
        [id]
      ),
      db.query(
        `SELECT * FROM cargos_membros
        WHERE membro_id = $1
        ORDER BY ativo DESC, data_posse DESC`,
        [id]
      ),
      db.query(
        `SELECT tipo, enviado_em, sucesso
        FROM whatsapp_followup_log
        WHERE membro_id = $1
        ORDER BY enviado_em DESC
        LIMIT 10`,
        [id]
      )
    ]);

    if (membroRes.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    const membro = membroRes.rows[0];
    membro.ministerios = ministeriosRes.rows;
    membro.cargos = cargosRes.rows;
    membro.followup_historico = logRes.rows;

    return res.json(membro);
  } catch (err) {
    console.error('Erro ao buscar detalhe do membro:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhe do membro' });
  }
});

// 7.5 POST /api/membros
router.post('/', checkPerfil(['admin', 'lider']), async (req, res) => {
  const {
    nome,
    telefone,
    email,
    data_nascimento,
    genero,
    estado_civil,
    profissao,
    endereco,
    bairro,
    cidade,
    estado,
    data_entrada,
    tipo_entrada,
    data_batismo,
    batizado,
    fez_discipulado,
    data_conversao,
    fez_curso_membresia,
    convertido_id,
    conjuge_id,
    nome_conjuge,
    tem_filhos,
    qtd_filhos,
    observacoes
  } = req.body;

  if (!nome || !telefone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }

  try {
    const queryText = `
      INSERT INTO membros (
        igreja_id, convertido_id, nome, telefone, email, data_nascimento, genero,
        estado_civil, profissao, endereco, bairro, cidade, estado,
        data_entrada, tipo_entrada, data_batismo, batizado, fez_discipulado,
        data_conversao, fez_curso_membresia,
        conjuge_id, nome_conjuge, tem_filhos, qtd_filhos, observacoes,
        ultimo_contato, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
        COALESCE($14, CURRENT_DATE),$15,$16,COALESCE($17, false),COALESCE($18, false),
        $19,COALESCE($20, false),
        $21,$22,COALESCE($23, false),COALESCE($24, 0),$25,
        CURRENT_DATE, 'ativo'
      )
      RETURNING *
    `;

    const params = [
      req.igrejaId,
      convertido_id || null,
      nome,
      telefone,
      email || null,
      data_nascimento || null,
      genero || null,
      estado_civil || null,
      profissao || null,
      endereco || null,
      bairro || null,
      cidade || null,
      estado || null,
      data_entrada || null,
      tipo_entrada || null,
      data_batismo || null,
      batizado === undefined ? null : batizado,
      fez_discipulado === undefined ? null : fez_discipulado,
      data_conversao || null,
      fez_curso_membresia === undefined ? null : fez_curso_membresia,
      conjuge_id || null,
      nome_conjuge || null,
      tem_filhos === undefined ? null : tem_filhos,
      qtd_filhos === undefined ? null : qtd_filhos,
      observacoes || null
    ];

    const resultado = await db.query(queryText, params);
    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao cadastrar membro:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar membro' });
  }
});

// 7.6 PUT /api/membros/:id
router.put('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    telefone,
    email,
    data_nascimento,
    genero,
    estado_civil,
    profissao,
    endereco,
    bairro,
    cidade,
    estado,
    data_entrada,
    tipo_entrada,
    data_batismo,
    batizado,
    fez_discipulado,
    data_conversao,
    fez_curso_membresia,
    conjuge_id,
    nome_conjuge,
    tem_filhos,
    qtd_filhos,
    observacoes,
    status,
    carta_saida_destino,
    data_saida,
    motivo_saida,
    carta_entrada_origem
  } = req.body;

  try {
    const queryText = `
      UPDATE membros SET
        nome = COALESCE($3, nome),
        telefone = COALESCE($4, telefone),
        email = $5,
        data_nascimento = $6,
        genero = $7,
        estado_civil = $8,
        profissao = $9,
        endereco = $10,
        bairro = $11,
        cidade = $12,
        estado = $13,
        data_entrada = COALESCE($14, data_entrada),
        tipo_entrada = $15,
        data_batismo = $16,
        batizado = COALESCE($17, batizado),
        fez_discipulado = COALESCE($18, fez_discipulado),
        data_conversao = $19,
        fez_curso_membresia = COALESCE($20, fez_curso_membresia),
        conjuge_id = $21,
        nome_conjuge = $22,
        tem_filhos = COALESCE($23, tem_filhos),
        qtd_filhos = COALESCE($24, qtd_filhos),
        observacoes = $25,
        status = COALESCE($26, status),
        carta_saida_destino = $27,
        data_saida = $28,
        motivo_saida = $29,
        carta_entrada_origem = $30,
        updated_at = now()
      WHERE id = $1 AND igreja_id = $2
      RETURNING *
    `;

    const params = [
      id,
      req.igrejaId,
      nome || null,
      telefone || null,
      email === undefined ? null : email,
      data_nascimento === undefined ? null : data_nascimento,
      genero === undefined ? null : genero,
      estado_civil === undefined ? null : estado_civil,
      profissao === undefined ? null : profissao,
      endereco === undefined ? null : endereco,
      bairro === undefined ? null : bairro,
      cidade === undefined ? null : cidade,
      estado === undefined ? null : estado,
      data_entrada === undefined ? null : data_entrada,
      tipo_entrada === undefined ? null : tipo_entrada,
      data_batismo === undefined ? null : data_batismo,
      batizado === undefined ? null : batizado,
      fez_discipulado === undefined ? null : fez_discipulado,
      data_conversao === undefined ? null : data_conversao,
      fez_curso_membresia === undefined ? null : fez_curso_membresia,
      conjuge_id === undefined ? null : conjuge_id,
      nome_conjuge === undefined ? null : nome_conjuge,
      tem_filhos === undefined ? null : tem_filhos,
      qtd_filhos === undefined ? null : qtd_filhos,
      observacoes === undefined ? null : observacoes,
      status || null,
      carta_saida_destino === undefined ? null : carta_saida_destino,
      data_saida === undefined ? null : data_saida,
      motivo_saida === undefined ? null : motivo_saida,
      carta_entrada_origem === undefined ? null : carta_entrada_origem
    ];

    const resultado = await db.query(queryText, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar membro:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar membro' });
  }
});

// 7.7 DELETE /api/membros/:id
router.delete('/:id', checkPerfil(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query(
      `UPDATE membros
       SET status = 'excluido', updated_at = now()
       WHERE id = $1 AND igreja_id = $2
       RETURNING id`,
      [id, req.igrejaId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    return res.json({ message: 'Membro excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir membro:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir membro' });
  }
});

// 7.8 PATCH /api/membros/:id/vi-hoje
router.patch('/:id/vi-hoje', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query(
      `UPDATE membros
       SET ultimo_contato = CURRENT_DATE, updated_at = now()
       WHERE id = $1 AND igreja_id = $2
       RETURNING id, nome, ultimo_contato`,
      [id, req.igrejaId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    return res.json({ ...resultado.rows[0], message: 'Presença registrada!' });
  } catch (err) {
    console.error('Erro ao registrar presença pastoral:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar presença' });
  }
});

// 7.9 POST /api/membros/:id/ministerios
router.post('/:id/ministerios', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params; // membro_id
  const { ministerio_id, cargo } = req.body;

  if (!ministerio_id) {
    return res.status(400).json({ error: 'ministerio_id é obrigatório' });
  }

  try {
    // Verificar se o membro pertence à mesma igreja
    const membroCheck = await db.query(
      'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado nesta igreja' });
    }

    // Verificar se o ministério pertence à mesma igreja e está ativo
    const minCheck = await db.query(
      'SELECT id FROM ministerios WHERE id = $1 AND igreja_id = $2 AND ativo = true',
      [ministerio_id, req.igrejaId]
    );
    if (minCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado ou inativo nesta igreja' });
    }

    const resultado = await db.query(
      `INSERT INTO membro_ministerios (membro_id, ministerio_id, cargo)
       VALUES ($1, $2, $3)
       ON CONFLICT (membro_id, ministerio_id)
       DO UPDATE SET ativo = true, cargo = EXCLUDED.cargo, data_entrada = CURRENT_DATE
       RETURNING *`,
      [id, ministerio_id, cargo || null]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao vincular membro ao ministério:', err);
    return res.status(500).json({ error: 'Erro interno ao vincular membro' });
  }
});

// 7.10 DELETE /api/membros/:id/ministerios/:ministerioId
router.delete('/:id/ministerios/:ministerioId', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id, ministerioId } = req.params;
  try {
    // Verificar se o membro pertence à igreja
    const membroCheck = await db.query(
      'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado nesta igreja' });
    }

    const resultado = await db.query(
      `UPDATE membro_ministerios
       SET ativo = false
       WHERE membro_id = $1 AND ministerio_id = $2
       RETURNING id`,
      [id, ministerioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    return res.json({ message: 'Vínculo com ministério desativado com sucesso' });
  } catch (err) {
    console.error('Erro ao desvincular membro do ministério:', err);
    return res.status(500).json({ error: 'Erro interno ao desvincular membro' });
  }
});

// 7.11 GET /api/membros/:id/cargos
router.get('/:id/cargos', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar se o membro pertence à igreja
    const membroCheck = await db.query(
      'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado nesta igreja' });
    }

    const resultado = await db.query(
      `SELECT * FROM cargos_membros WHERE membro_id = $1 ORDER BY ativo DESC, data_posse DESC`,
      [id]
    );

    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao buscar cargos do membro:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar cargos' });
  }
});

// 7.12 POST /api/membros/:id/cargos
router.post('/:id/cargos', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { cargo, data_posse, observacoes } = req.body;

  if (!cargo) {
    return res.status(400).json({ error: 'O cargo é obrigatório' });
  }

  try {
    // Verificar se o membro pertence à igreja
    const membroCheck = await db.query(
      'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado nesta igreja' });
    }

    const resultado = await db.query(
      `INSERT INTO cargos_membros (membro_id, cargo, data_posse, observacoes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, cargo, data_posse || null, observacoes || null]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao adicionar cargo ao membro:', err);
    return res.status(500).json({ error: 'Erro interno ao adicionar cargo' });
  }
});

// 7.13 PATCH /api/membros/:id/cargos/:cargoId
router.patch('/:id/cargos/:cargoId', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id, cargoId } = req.params;
  const { data_fim, observacoes } = req.body;
  try {
    // Verificar se o membro pertence à igreja
    const membroCheck = await db.query(
      'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado nesta igreja' });
    }

    const resultado = await db.query(
      `UPDATE cargos_membros
       SET ativo = false, data_fim = COALESCE($3, CURRENT_DATE), observacoes = COALESCE($4, observacoes)
       WHERE id = $2 AND membro_id = $1
       RETURNING *`,
      [id, cargoId, data_fim || null, observacoes || null]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao encerrar cargo do membro:', err);
    return res.status(500).json({ error: 'Erro interno ao encerrar cargo' });
  }
});

// 7.14 POST /api/membros/:id/whatsapp
router.post('/:id/whatsapp', checkPerfil(['admin', 'lider', 'pastor']), async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscar o membro
    const membroRes = await db.query(
      "SELECT id, nome, telefone, ultimo_contato FROM membros WHERE id = $1 AND igreja_id = $2 AND status = 'ativo'",
      [id, req.igrejaId]
    );

    if (membroRes.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado ou inativo' });
    }

    const membro = membroRes.rows[0];

    // 2. Calcular dias desde o último contato
    const diasSemContato = membro.ultimo_contato
      ? Math.floor((Date.now() - new Date(membro.ultimo_contato).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // 3. Selecionar template baseado nos dias sem contato
    const tipo = diasSemContato < 60 ? 'ativo' : 'inativo';

    const mensagens = {
      ativo: `Olá, ${membro.nome}! 😊\n\nPassando pra dar um oi e saber como você está.\n\nQue Deus continue te abençoando! 🙏\n— Igreja do Nazareno`,
      inativo: `Olá, ${membro.nome}! 😊\n\nA gente sente sua falta por aqui! 💛\n\nComo você está? Estamos com saudade e pensando in você.\n\nQue Deus te abençoe! 🙏\n— Igreja do Nazareno`,
    };

    const mensagemTexto = mensagens[tipo];

    // 4. Formatar número: remove tudo que não é dígito e adiciona prefixo internacional
    const telefoneFormatado = membro.telefone.replace(/\D/g, '');
    const numero = `55${telefoneFormatado}@s.whatsapp.net`;

    // 5. Verificar se Evolution API está configurada
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_INSTANCE) {
      // Registrar no log mesmo sem enviar (modo desenvolvimento)
      await db.query(
        `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso, erro)
         VALUES ($1, $2, false, 'EVOLUTION_API não configurada')`,
        [id, tipo]
      );
      return res.json({
        sucesso: false,
        tipo,
        mensagem_enviada: mensagemTexto,
        aviso: 'EVOLUTION_API_URL ou EVOLUTION_INSTANCE não configurados no .env'
      });
    }

    // 6. Enviar via Evolution API
    const axios = require('axios');
    await axios.post(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
      {
        number: numero,
        textMessage: { text: mensagemTexto }
      },
      {
        headers: { apikey: process.env.EVOLUTION_API_KEY || '' },
        timeout: 10000
      }
    );

    // 7. Registrar no log
    await db.query(
      `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso) VALUES ($1, $2, true)`,
      [id, tipo]
    );

    return res.json({
      sucesso: true,
      tipo,
      mensagem_enviada: mensagemTexto,
      numero_destino: telefoneFormatado
    });

  } catch (err) {
    // Erro de conexão/HTTP com a Evolution API — retornar graciosamente (não quebrar o sistema)
    const ehErroEvolution = err.isAxiosError || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || (err.response && err.response.status);
    try {
      await db.query(
        `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso, erro) VALUES ($1, $2, false, $3)`,
        [id, 'inativo', err.message]
      );
    } catch (_) {}

    if (ehErroEvolution) {
      console.warn('[whatsapp] Falha na Evolution API:', err.message);
      return res.json({
        sucesso: false,
        aviso: 'Evolution API indisponível ou não autorizada. Verifique EVOLUTION_API_URL, EVOLUTION_INSTANCE e EVOLUTION_API_KEY no .env.',
        detalhe: err.message
      });
    }

    console.error('Erro ao enviar WhatsApp:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem WhatsApp', detalhe: err.message });
  }
});

module.exports = router;
