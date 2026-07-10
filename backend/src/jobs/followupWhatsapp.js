const cron = require('node-cron');
const db = require('../conexao');

// Importação lazy do axios para não quebrar o servidor se não estiver instalado ainda
let axios;
try {
  axios = require('axios');
} catch (_) {
  axios = null;
}

/**
 * Formata o telefone para o formato do WhatsApp: 55 + dígitos + @s.whatsapp.net
 */
function formatarNumeroWhatsapp(telefone) {
  const digitos = telefone.replace(/\D/g, '');
  return `55${digitos}@s.whatsapp.net`;
}

/**
 * Dispara mensagens de follow-up para membros sem contato há mais de 90 dias.
 * Função exportada também para disparo manual via endpoint (futuro).
 */
async function executarFollowupAutomatico() {
  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_INSTANCE) {
    console.log('[followup] EVOLUTION_API_URL ou EVOLUTION_INSTANCE não configurados. Pulando.');
    return { enviados: 0, erros: 0, pulado: true };
  }

  if (!axios) {
    console.log('[followup] axios não instalado. Rode npm install.');
    return { enviados: 0, erros: 0, pulado: true };
  }

  const mensagemInativo = (nome) =>
    `Olá, ${nome}! 😊\n\nA gente sente sua falta por aqui! 💛\n\nComo você está? Estamos com saudade e pensando em você.\n\nQue Deus te abençoe! 🙏\n— Igreja do Nazareno`;

  try {
    // Busca membros sem contato há mais de 90 dias que ainda não receberam follow-up neste período
    const resultado = await db.query(`
      SELECT m.id, m.nome, m.telefone
      FROM membros m
      WHERE m.status = 'ativo'
        AND m.ultimo_contato < CURRENT_DATE - INTERVAL '90 days'
        AND NOT EXISTS (
          SELECT 1 FROM whatsapp_followup_log w
          WHERE w.membro_id = m.id
            AND w.enviado_em > now() - INTERVAL '90 days'
        )
      ORDER BY m.ultimo_contato ASC
      LIMIT 100
    `);

    let enviados = 0;
    let erros = 0;

    for (const membro of resultado.rows) {
      const mensagem = mensagemInativo(membro.nome);
      const numero = formatarNumeroWhatsapp(membro.telefone);

      try {
        await axios.post(
          `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
          {
            number: numero,
            textMessage: { text: mensagem }
          },
          {
            headers: { apikey: process.env.EVOLUTION_API_KEY || '' },
            timeout: 15000
          }
        );

        await db.query(
          `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso) VALUES ($1, 'inativo', true)`,
          [membro.id]
        );

        enviados++;
        console.log(`[followup] ✓ Mensagem enviada para ${membro.nome}`);

        // Pausa de 1 segundo entre mensagens para não sobrecarregar a API
        await new Promise((r) => setTimeout(r, 1000));

      } catch (errEnvio) {
        await db.query(
          `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso, erro) VALUES ($1, 'inativo', false, $2)`,
          [membro.id, errEnvio.message]
        );
        erros++;
        console.error(`[followup] ✗ Falha para ${membro.nome}:`, errEnvio.message);
      }
    }

    console.log(`[followup] Concluído: ${enviados} enviados, ${erros} erros`);
    return { enviados, erros };

  } catch (err) {
    console.error('[followup] Erro geral na execução:', err);
    return { enviados: 0, erros: 1, erro: err.message };
  }
}

// Agenda: toda segunda-feira às 9h (horário do servidor)
// Formato cron: minuto hora dia-do-mês mês dia-da-semana
// 0 9 * * 1 = 09:00 toda segunda-feira
cron.schedule('0 9 * * 1', () => {
  console.log('[followup] Iniciando job automático de follow-up WhatsApp...');
  executarFollowupAutomatico().catch((err) => {
    console.error('[followup] Erro não capturado no job:', err);
  });
});

console.log('[followup] Job de follow-up WhatsApp agendado (toda segunda-feira às 9h)');

module.exports = { executarFollowupAutomatico };
