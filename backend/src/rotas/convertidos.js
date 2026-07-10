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
  try {
    let queryText = 'SELECT * FROM novos_convertidos';
    const params = [];

    if (req.usuarioPerfil === 'discipulador') {
      queryText = `
        SELECT DISTINCT nc.* FROM novos_convertidos nc
        JOIN grupo_membros gm ON nc.id = gm.convertido_id
        JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
        WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
        ORDER BY nc.nome ASC
      `;
      params.push(req.discipuladorId, req.igrejaId);
    } else {
      if (req.igrejaId) {
        queryText += ' WHERE igreja_id = $1';
        params.push(req.igrejaId);
      }
      queryText += ' ORDER BY nome ASC';
    }

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
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
    let queryText = 'SELECT * FROM novos_convertidos WHERE id = $1';

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $2';
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

module.exports = router;
