## Visão geral

Você selecionou 9 frentes grandes. Para não entregar tudo pela metade, proponho dividir em **4 fases entregáveis** — cada fase é funcional sozinha. Confirme a fase 1 e eu já implemento; as próximas seguem no mesmo chat.

---

## Fase 1 — Jornada + Manual + Relatórios (entrego agora)

**1. Jornada do Convertido (Timeline)**
- Nova página `/convertidos/:id/jornada` com linha do tempo vertical: Cadastro → Decisão → Batismo → Módulos do discipulado (1 etapa por módulo concluído) → Líder em formação.
- Cada etapa mostra data, responsável e status (concluído / em andamento / pendente).
- Barra de progresso e "próximo passo sugerido" no topo.
- Badge de gamificação por etapa concluída.

**2. Manual integrado à Jornada e ao Discipulado**
- Página `/manual` deixa de ser só chat: ganha aba **"Conteúdo"** com o manual completo navegável (sumário lateral + leitor).
- O manual será carregado de `manual.json` (estrutura: módulos → capítulos → seções com markdown). Você me envia o PDF/DOCX e eu transcrevo e estruturo.
- Dentro de cada etapa da Jornada e de cada módulo do discipulado, aparece botão **"Abrir no manual"** que leva direto à seção correspondente.
- Chat IA continua, mas agora ele **cita trechos do manual** (busca por palavras-chave nas seções carregadas) — RAG simples client-side, sem custo extra de API.

**3. Relatórios e exportação (PDF/Excel)**
- Nova página `/relatorios` (admin/líder/pastor):
  - Convertidos por período / status / grupo
  - Frequência e progresso por módulo
  - Aniversariantes do mês
  - Decisões e batismos por período
- Botões **"Exportar Excel"** (xlsx via `xlsx` lib) e **"Exportar PDF"** (jspdf + autotable) em cada relatório.

---

## Fase 2 — Notificações & IA pastoral

- **Notificações automáticas** (sino no header + página `/notificacoes`):
  - Aniversários do dia/semana
  - Visitantes sem retorno há 14 dias
  - Aulas pendentes por aluno
  - Convertidos sem progresso há 30 dias
- Geração via React Query polling (sua API expõe `/notificacoes`). Toast no login para alertas urgentes.
- **IA pastoral** (usa o Lovable AI Gateway, server function):
  - Botão "Sugerir próximo passo" no perfil do convertido
  - "Resumo pastoral semanal" no dashboard (1 clique → texto narrativo da semana)
  - Análise de sentimento nos pedidos de oração (tag automática: urgente / gratidão / saúde / família)

---

## Fase 3 — PWA + Check-in QR + Certificado

- **PWA instalável**: manifest + ícones + service worker (offline-first para sidebar e listas), push opcional.
- **Check-in QR nas aulas**: cada aula do discipulado gera um QR único; aluno escaneia em `/checkin/:codigo` (rota pública autenticada por token curto) → presença marcada automaticamente. Tela do discipulador mostra presença em tempo real.
- **Certificado digital**: ao concluir todos os módulos, gera PDF com nome, igreja, data, assinatura do pastor e **QR de validação pública** que aponta para `/validar/:codigo` (mostra dados públicos do certificado).

---

## Fase 4 — Dashboard pastoral com mapa

- Mapa (Leaflet + OpenStreetMap, gratuito) com pinos dos convertidos agrupados por bairro.
- Heatmap de concentração + filtros por status, grupo, período.
- Estatísticas por região no painel lateral.

---

## Detalhes técnicos (resumo)

- **Dependências novas por fase**: F1 → `xlsx`, `jspdf`, `jspdf-autotable`, `react-markdown`; F2 → server function Lovable AI Gateway; F3 → `vite-plugin-pwa`, `workbox`; F4 → `leaflet`, `react-leaflet`, `leaflet.heat`.
- **API**: cada fase lista os endpoints novos que sua API local em `:3031` deve expor. Eu deixo mock/fallback no front pra você desenvolver em paralelo.
- **Manual**: preciso do arquivo (PDF/DOCX) pra transcrever. Pode subir aqui no chat.

---

## O que preciso de você agora

1. **Confirma começar pela Fase 1?**
2. **Manda o manual** (PDF ou DOCX) pra eu transcrever e estruturar.
3. Se preferir outra ordem (ex: PWA antes de relatórios), me diga.