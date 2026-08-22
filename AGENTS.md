# Instruções para agentes

Estas regras valem para qualquer IA ou pessoa que altere este projeto.

## Antes de agir

1. Leia este arquivo, `docs/AI_HANDOFF.md` e a tarefa ativa em `tasks/`.
2. Consulte `docs/ARCHITECTURE.md` e `docs/BUSINESS_RULES.md` nas áreas afetadas.
3. Inspecione o estado atual antes de propor ou editar.
4. Respeite escopo, critérios de aceite e itens explicitamente fora do escopo.
5. Se uma decisão mudar regra de negócio, contrato público, arquitetura, custo ou segurança, registre-a e solicite decisão humana quando necessário.

## Forma de trabalho

- Codex inicia e executa o projeto: aplica o kit, cria tarefas, implementa, testa e atualiza handoff.
- Gemini planeja quando a ideia estiver vaga, o escopo estiver aberto ou os critérios de aceite precisarem ser refinados.
- Lovable explora UI e protótipos visuais; Codex integra o resultado ao repositório.
- Claude revisa somente decisões críticas, segurança, pagamentos, privacidade, arquitetura de alto impacto ou bugs persistentes.
- Um único agente é dono de uma tarefa e de seus arquivos por vez.
- Não reverta, sobrescreva ou reformate alterações alheias sem autorização.
- Prefira a menor mudança que satisfaça os critérios de aceite.
- Não amplie o escopo silenciosamente; registre ideias separadamente.
- Reutilize padrões e componentes existentes antes de criar abstrações.
- Não instale dependências sem justificar necessidade, licença, manutenção e impacto.
- Não publique, faça deploy, merge, push ou operações destrutivas sem autorização explícita.

## Qualidade e segurança

- Nunca grave segredos, tokens, credenciais ou dados pessoais reais no repositório ou logs.
- Valide entradas em fronteiras de confiança e aplique autorização no servidor.
- Preserve isolamento entre tenants e princípio do menor privilégio.
- Mudanças de banco devem ter migração segura e estratégia de reversão/compatibilidade.
- Adicione ou atualize testes proporcionais ao risco.
- Execute os comandos relevantes definidos em `docs/ARCHITECTURE.md`.
- Não declare sucesso sem evidência; informe testes não executados e o motivo.
- Falhas preexistentes devem ser registradas, sem serem confundidas com regressões da tarefa.

## Documentação e handoff

Ao concluir ou pausar, atualize `docs/AI_HANDOFF.md`. Inclua tarefa e branch, status, resumo objetivo, arquivos alterados, comandos executados e resultados, decisões, riscos, pendências e próximo passo exato.

Não apague histórico útil: mova entradas concluídas para a seção de histórico e mantenha o estado atual curto. Atualize também arquitetura, regras ou roadmap quando a implementação mudar a verdade documentada.

## Escalonamento para Claude

Chame Claude somente quando houver decisão arquitetural difícil, risco de segurança/privacidade, pagamentos, migração crítica, incidente, bug persistente após tentativas documentadas ou revisão de alto impacto. Forneça uma pergunta precisa, diff/contexto mínimo, evidências e tentativas. A execução das correções volta ao Codex.
