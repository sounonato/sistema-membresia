const db = require('../conexao');

/**
 * Obtém estatísticas consolidadas para o painel (dashboard) isoladas por igreja.
 */
async function obterEstatisticas(igrejaId, usuarioPerfil, discipuladorId) {
  const ehDiscipulador = usuarioPerfil === 'discipulador';

  let totalConvertidosQuery = 'SELECT COUNT(*) FROM novos_convertidos WHERE igreja_id = $1';
  let gruposAtivosQuery = "SELECT COUNT(*) FROM grupos_discipulado WHERE status = 'ativo' AND igreja_id = $1";
  let batizadosQuery = 'SELECT COUNT(*) FROM novos_convertidos WHERE batizado = true AND igreja_id = $1';
  let aguardandoDiscipuladoQuery = `
    SELECT COUNT(*) FROM novos_convertidos nc 
    WHERE nc.id NOT IN (SELECT convertido_id FROM grupo_membros WHERE igreja_id = $1)
    AND nc.igreja_id = $1
  `;
  
  let convertidosPorMesQuery = `
    SELECT TO_CHAR(data_conversao, 'YYYY-MM') as mes, COUNT(*) as quantidade 
    FROM novos_convertidos
    WHERE igreja_id = $1
    GROUP BY mes 
    ORDER BY mes ASC 
    LIMIT 12
  `;

  let porGeneroQuery = `
    SELECT COALESCE(genero, 'Não Informado') as genero, COUNT(*) as quantidade
    FROM novos_convertidos
    WHERE igreja_id = $1
    GROUP BY genero
  `;

  let porFaixaEtariaQuery = `
    SELECT
      CASE
        WHEN data_nascimento IS NULL THEN 'Não informado'
        WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 18 THEN '< 18'
        WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 36 AND 45 THEN '36-45'
        WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 46 AND 60 THEN '46-60'
        ELSE '> 60'
      END as faixa,
      COUNT(*) as quantidade,
      ARRAY_AGG(nome ORDER BY nome) as nomes
    FROM novos_convertidos
    WHERE igreja_id = $1
    GROUP BY faixa
    ORDER BY MIN(COALESCE(data_nascimento, '9999-01-01')) DESC
  `;

  const params = [igrejaId];

  if (ehDiscipulador) {
    // Apenas convertidos que estão nos grupos desse discipulador nesta igreja
    totalConvertidosQuery = `
      SELECT COUNT(DISTINCT nc.id) FROM novos_convertidos nc
      JOIN grupo_membros gm ON nc.id = gm.convertido_id
      JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
      WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
    `;
    gruposAtivosQuery = "SELECT COUNT(*) FROM grupos_discipulado WHERE status = 'ativo' AND discipulador_id = $1 AND igreja_id = $2";
    batizadosQuery = `
      SELECT COUNT(DISTINCT nc.id) FROM novos_convertidos nc
      JOIN grupo_membros gm ON nc.id = gm.convertido_id
      JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
      WHERE gd.discipulador_id = $1 AND nc.batizado = true AND nc.igreja_id = $2
    `;
    // Para discipulador, aguardando discipulado não se aplica
    aguardandoDiscipuladoQuery = `SELECT 0 as count`;
    
    convertidosPorMesQuery = `
      SELECT TO_CHAR(nc.data_conversao, 'YYYY-MM') as mes, COUNT(DISTINCT nc.id) as quantidade 
      FROM novos_convertidos nc
      JOIN grupo_membros gm ON nc.id = gm.convertido_id
      JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
      WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
      GROUP BY mes 
      ORDER BY mes ASC 
      LIMIT 12
    `;

    porGeneroQuery = `
      SELECT COALESCE(nc.genero, 'Não Informado') as genero, COUNT(DISTINCT nc.id) as quantidade 
      FROM novos_convertidos nc
      JOIN grupo_membros gm ON nc.id = gm.convertido_id
      JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
      WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
      GROUP BY nc.genero
    `;
    
    // Para o caso de discipulador, os parâmetros serão [discipuladorId, igrejaId]
    params.length = 0; // Limpa os parâmetros
    params.push(discipuladorId, igrejaId);
  }

  // Se igrejaId for nulo (superadmin geral sem selecionar tenant), podemos retornar tudo ou 0.
  // Vamos dar suporte para superadmin ver estatísticas globais se não informar igrejaId.
  if (!igrejaId && usuarioPerfil === 'superadmin') {
    totalConvertidosQuery = 'SELECT COUNT(*) FROM novos_convertidos';
    gruposAtivosQuery = "SELECT COUNT(*) FROM grupos_discipulado WHERE status = 'ativo'";
    batizadosQuery = 'SELECT COUNT(*) FROM novos_convertidos WHERE batizado = true';
    aguardandoDiscipuladoQuery = `
      SELECT COUNT(*) FROM novos_convertidos nc 
      WHERE nc.id NOT IN (SELECT convertido_id FROM grupo_membros)
    `;
    convertidosPorMesQuery = `
      SELECT TO_CHAR(data_conversao, 'YYYY-MM') as mes, COUNT(*) as quantidade 
      FROM novos_convertidos
      GROUP BY mes 
      ORDER BY mes ASC 
      LIMIT 12
    `;
    porGeneroQuery = `
      SELECT COALESCE(genero, 'Não Informado') as genero, COUNT(*) as quantidade 
      FROM novos_convertidos 
      GROUP BY genero
    `;
    params.length = 0; // Sem parâmetros
  }

  const [
    totalRes,
    gruposRes,
    batizadosRes,
    aguardandoRes,
    mesesRes,
    generoRes,
    faixaRes
  ] = await Promise.all([
    db.query(totalConvertidosQuery, params),
    db.query(gruposAtivosQuery, params),
    db.query(batizadosQuery, params),
    db.query(aguardandoDiscipuladoQuery, (ehDiscipulador || (!igrejaId && usuarioPerfil === 'superadmin')) ? [] : params),
    db.query(convertidosPorMesQuery, params),
    db.query(porGeneroQuery, params),
    db.query(porFaixaEtariaQuery, params)
  ]);

  return {
    total_convertidos: parseInt(totalRes.rows[0].count || 0, 10),
    grupos_ativos: parseInt(gruposRes.rows[0].count || 0, 10),
    batizados: parseInt(batizadosRes.rows[0].count || 0, 10),
    aguardando_discipulado: parseInt(aguardandoRes.rows[0].count || 0, 10),
    convertidos_por_mes: mesesRes.rows,
    por_genero: generoRes.rows,
    por_faixa_etaria: faixaRes.rows
  };
}

module.exports = {
  obterEstatisticas
};
