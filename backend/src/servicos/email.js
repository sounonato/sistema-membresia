const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'Sistema Membresia';
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8085';

async function enviarConfirmacaoSolicitacao(email, nomeResponsavel, nomeIgreja) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Solicitação recebida — ${nomeIgreja}`,
    text: `Olá, ${nomeResponsavel}!\n\nRecebemos a solicitação de cadastro da ${nomeIgreja}.\nRetornaremos em até 48 horas com as credenciais de acesso.\n\nEquipe Sistema Membresia`,
  });
}

async function enviarCredenciais(email, nomeResponsavel, nomeIgreja, slug, senhaTemporaria) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Sua igreja foi aprovada — ${nomeIgreja}`,
    text: `Olá, ${nomeResponsavel}!\n\nA ${nomeIgreja} foi aprovada no Sistema Membresia.\n\nSeus dados de acesso:\nEmail: ${email}\nSenha temporária: ${senhaTemporaria}\nLink de acesso: ${BASE_URL}/${slug}/login\n\nNo primeiro acesso você será solicitado a criar uma nova senha.\n\nEquipe Sistema Membresia`,
  });
}

async function enviarResetSenha(email, nomeUsuario, token) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Redefinição de senha — Sistema Membresia',
    text: `Olá, ${nomeUsuario}!\n\nRecebemos uma solicitação para redefinir sua senha.\nUse o código abaixo (válido por 1 hora):\n\n${token}\n\nSe não foi você que solicitou, ignore este email.\n\nEquipe Sistema Membresia`,
  });
}

module.exports = { enviarConfirmacaoSolicitacao, enviarCredenciais, enviarResetSenha };
