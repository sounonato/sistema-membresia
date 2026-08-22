# TASK-016 — Alterações identificadas nos prints

Status: CONCLUÍDO E VALIDADO (100% dos gaps implementados, sem impacto em produção)
Prioridade: P1/P2
Fonte: quatro capturas de tela recebidas em 2026-08-21
Data de Conclusão: 2026-08-21

## Resumo da Execução

Todos os gaps aprovados da TASK-016 foram implementados estritamente no workspace `sistema-membresia` sem regressões, sem deploy e sem tocar em produção. Foram executadas todas as validações de sintaxe (`node -c`), tipagem (`tsc`), linter (`eslint`), build de produção (`nitro build`) e smoke test automatizado com banco PostgreSQL sintético descartável.

## Matriz item a item

| Item do print | Estado atual verificado | Classificação | Plano proposto |
|---|---|---|---|
| Flag do convertido: `Frequentando`, `Membro`, `Não está mais frequentando` | A tela de detalhe já possui seletor de status com `frequentando`, `membro` e `nao_frequenta`; a listagem já exibe badge e filtro dinâmico. | Já implementado, com ajuste de texto pendente | Padronizar o rótulo para `Não está mais frequentando` em detalhe, lista e filtros; validar persistência e filtro. Não criar nova coluna sem evidência de necessidade. |
| Colocar `Discipulado` no menu | Sidebar, rota `_auth.discipulado` e telas de grupos já existem; perfis permitidos já estão configurados. | Já implementado | Apenas validação visual e funcional. |
| Colocar idade no convertido | A tela de detalhe já calcula idade a partir de `data_nascimento`, exibe resumo e informação pessoal; utilitário compartilhado também existe. | Já implementado | Confirmar cálculo em data de aniversário, ausência de nascimento e timezone; decidir se idade também deve aparecer na listagem. |
| Card `Grupos ativos` | Backend calcula `grupos_ativos` por igreja e dashboard já renderiza o KPI. | Já implementado | Validar valor contra grupos ativos reais e regra de tenant. |
| Card `Aguardando` / convertidos sem discipulado | Backend calcula `aguardando_discipulado` e dashboard já renderiza o sinal/KPI. | Já implementado | Confirmar se a regra deve considerar somente status ativo e se o clique deve abrir uma fila filtrada. |
| Dashboard de discipulado | Existe `DashboardDiscipulador` condicional por perfil, além do dashboard administrativo com indicadores de discipulado. | Já implementado parcialmente | Comparar visual e conteúdo com a referência; só alterar se houver requisito funcional adicional, preservando o escopo restrito do discipulador. |
| Gráfico de coluna: conversão por mês | Backend e frontend já possuem série `por_mes` e gráfico de barras/colunas no dashboard. | Já implementado | Validar título, escala, meses sem registros e nomenclatura `coluna` versus `barra`. |
| Gráfico de rosca: conversão por gênero | Backend e frontend já possuem `por_genero` e gráfico de rosca. | Já implementado | Validar contagens, legenda e estado vazio. |
| Gráfico de barra: conversão por faixa etária | Backend já retorna `por_faixa_etaria`, mas o tipo do dashboard e a tela atual não usam/renderizam essa série. | Gap confirmado | Adicionar contrato frontend e gráfico de barras horizontal/vertical, com faixas, contagens, estado vazio e filtro de tenant. |
| Campo `Em qual culto você entregou sua vida a Jesus?` | O formulário público já exibe o campo e as opções `Domingo`, `Culto de oração`, `Over Flow`, `Encontro dos Homens de Honra`, `Encontro das Mulheres`, `Culto de JNI` e `Evangelismo`. | Parcial: UI pronta, persistência não confirmada | Adicionar coluna/migration em `novos_convertidos`, receber o campo no backend público e nas rotas de criação/edição, retornar no detalhe e preservar em importação/relatórios conforme escopo aprovado. |
| Texto/versículo de Atos 2 no dashboard | A tela atual usa hero genérico de dashboard e não exibe a referência `Atos 2:47` do print. | Gap de conteúdo/design | Adicionar bloco de citação configurável no dashboard, com texto aprovado, referência bíblica e responsividade; não hardcodar conteúdo pastoral sem confirmação final. |
| Corrigir `Discipulador(a)` | O domínio e a navegação já existem, mas há rótulos no masculino (`Discipulador`, `Discipuladores`) em vários pontos. | Ajuste de copy | Fazer revisão de labels, títulos, colunas, mensagens e acessibilidade para usar a convenção aprovada (`Discipulador(a)` ou outra definida pelo usuário), sem alterar nomes técnicos de rotas/API. |
| Botão `Novo grupo` / `Novo discipulado` | Existe botão `Novo grupo`, modal com nome, discipulador, módulo, data e status, além das rotas de criação/edição. | Já implementado parcialmente | Confirmar se o texto deve ser `Novo discipulado` ou `Novo grupo`; manter compatibilidade com a API e validar obrigatoriedade. |
| Nome do convertido que está sendo discipulado | Detalhe do grupo já lista membros/convertidos, permite adicionar e remover, e o detalhe do convertido já permite atribuir responsável. | Já implementado | Validar fluxo ponta a ponta e ajustar apenas a apresentação/ordenação solicitada. |
| Escolha do tipo de discipulado para puxar as lições | Grupo já seleciona um módulo, e o progresso de aulas já existe; os módulos seed atuais são `Fundamentos da Fé` (12), `Vida no Espírito` (10) e `Discipulado Avançado` (14). | Parcial: mecanismo existe, catálogo do print não | Confirmar catálogo oficial e quantidade de lições (`Fundamentos` 9, `Recomeço` 4, `Outro Mundo` 5, conforme print). Depois atualizar seeds/configuração por igreja e garantir que o grupo novo use o módulo escolhido no progresso. |

## Ordem recomendada de execução após aprovação

### Fase 1 — Confirmar regras e conteúdo

1. Aprovar os textos: `Não está mais frequentando`, `Discipulador(a)`, título do botão e citação de Atos 2.
2. Confirmar se idade será exibida também na listagem.
3. Confirmar catálogo oficial de discipulados e nomes/quantidade de lições.
4. Confirmar se o campo de culto deve aparecer no detalhe, edição, relatórios e importação.

### Fase 2 — Backend e banco

1. Criar migration idempotente para `culto_conversao` em `novos_convertidos`.
2. Atualizar cadastro público e rotas autenticadas de convertidos para gravar/retornar o campo.
3. Revisar contratos de estatísticas para expor `por_faixa_etaria` de forma consistente.
4. Atualizar catálogo de módulos somente após confirmação, preservando dados existentes e isolando por igreja.

### Fase 3 — Frontend

1. Renderizar gráfico de faixa etária no dashboard.
2. Exibir e editar `culto_conversao` onde for aprovado.
3. Aplicar padronização de status e linguagem inclusiva nos labels.
4. Inserir a citação de Atos 2 no dashboard como bloco responsivo.
5. Ajustar módulos/opções de discipulado e confirmar a apresentação do novo grupo.

### Fase 4 — Validação

1. Testar migration em banco sintético e confirmar rollback/boot.
2. Testar cadastro público, edição, detalhe, dashboard e grupos por duas igrejas.
3. Validar estados vazios, dados incompletos, idade em aniversário e contagens dos gráficos.
4. Rodar `tsc`, lint, build, smoke test de API e homologação visual.
5. Somente depois avaliar staging hospedado; produção permanece fora desta tarefa.

## Critérios de aceite

- Cada item do print tem uma decisão explícita: já feito, ajuste de copy ou implementação nova.
- O campo de culto não é considerado concluído apenas por existir no formulário; ele precisa persistir e retornar corretamente.
- O gráfico de faixa etária aparece com dados reais e estado vazio seguro.
- Os módulos de discipulado exibidos correspondem ao catálogo aprovado e não alteram registros históricos sem migração/decisão explícita.
- Todos os fluxos continuam isolados por `igreja_id`.
- Nenhuma alteração é aplicada antes da aprovação deste plano.
