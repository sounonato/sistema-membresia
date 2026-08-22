# Regras de negócio

Este arquivo e a fonte oficial das regras do produto. Cada regra recebe um ID estavel para ser citada em tarefas, codigo e testes.

## Glossario

| Termo | Definicao inequivoca |
|---|---|
| Tenant | Igreja/conta isolada que possui seus proprios dados e branding. |
| Igreja | Entidade multi-tenant com nome, slug, cor primaria e logo. |
| Usuario | Pessoa autenticada com um perfil de acesso ao sistema. |

## Papeis e permissoes

| Papel | Pode | Nao pode |
|---|---|---|
| superadmin | gerir igrejas, branding, aprovar solicitacoes e criar admins de igreja | acessar o painel operacional de uma igreja como usuario normal |
| admin | gerir dados operacionais do tenant, usuarios, relatorios, importacao e cadastro | acessar a area superadmin de igrejas |
| lider | gerir os mesmos fluxos operacionais que o admin no painel atual | acessar a area superadmin de igrejas |
| pastor | acessar areas pastorais, painel, membros, discipulado, ministerios, relatorios e manual | acessar a area superadmin e tarefas administrativas restritas |
| discipulador | acessar seu painel e os convertidos sob sua responsabilidade | acessar gestao administrativa e area superadmin |

## Regras

### BR-001 - Isolamento de tenant

- Regra: usuarios so podem acessar dados dos tenants aos quais pertencem.
- Excecoes: `superadmin` pode acessar a area global de igrejas
- Evidencia/teste: consultas e acoes sao testadas contra acesso entre tenants

### BR-002 - Branding por tenant

- Regra: a igreja logada define a cor primaria e o logo exibidos no painel e nas entradas publicas quando disponiveis
- Motivo: cada igreja deve reconhecer seu proprio espaco visual sem depender de configuracao manual por tela
- Excecoes: fallback para a marca padrao quando o tenant nao tiver logo ou cor configurados
- Evidencia/teste: um tenant com logo/cor diferentes precisa renderizar a identidade correta apos login e nas rotas publicas

### BR-003 - Acesso por perfil

- Regra: o painel libera as rotas conforme o perfil do usuario logado
- Motivo: limitar operacoes destrutivas e reduzir confusao de interface
- Excecoes: nenhuma alem das rotas permitidas ao `superadmin`
- Evidencia/teste: `superadmin` entra apenas em `/igrejas`; `admin` e `lider` acessam gestao operacional; `pastor` e `discipulador` veem um subconjunto menor

## Assinaturas, cobranca e limites

| Plano | Preco/ciclo | Recursos | Limites | Comportamento ao exceder |
|---|---|---|---|---|
| Nao se aplica ainda | | | | |

- Periodo de teste: nao definido
- Upgrade/downgrade: nao definido
- Cancelamento/reembolso: nao definido
- Falha de pagamento: nao definido

## Ciclos de estado

```text
pendente -> ativo -> inativo
```

Transicoes proibidas e efeitos colaterais: exclusao ou troca de estado precisa respeitar o tenant e o perfil do usuario

## Privacidade e conformidade

- Dados coletados e finalidade: nomes, e-mails, telefones, perfis, dados de membros, jornadas e registros de contato para operacao pastoral
- Retencao/exclusao/exportacao: nao ha politica especifica documentada; o backend deve preservar consistencia ao excluir ou desativar registros
- Consentimento e auditoria: cadastro publico e acao de usuario devem ficar rastreaveis pelo banco e pelos logs de aplicacao

## Casos-limite conhecidos

- Usuario sem igreja vinculada deve ser tratado com fallback seguro ou fluxo de superadmin
- Tenant sem branding configurado usa a identidade padrao do sistema
- Login com conta inativa deve ser bloqueado pelo backend
