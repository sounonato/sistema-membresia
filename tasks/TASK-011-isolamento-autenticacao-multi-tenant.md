# TASK-011 — Isolamento, autenticação e cadastro público

Status: concluída localmente — aguardando staging
Prioridade: P0/P1

Objetivo: impedir acesso cruzado entre igrejas, invalidar sessões de usuários inativos e tornar o cadastro público transacional e tenant-safe.

Escopo:

- remover bypass global de perfil para superadmin;
- validar igreja e perfil no ciclo de vida do JWT;
- exigir seleção inequívoca de igreja no login/reset quando o e-mail existir em mais de um tenant;
- validar o grupo público dentro da igreja da URL;
- inserir convertido e vínculo de grupo na mesma transação;
- revisar exposição do portal público.

Critério de aceite: nenhuma operação autenticada consegue atuar em tenant diferente do token/header validado; falhas parciais de cadastro não deixam registros órfãos.

Implementado: perfil explícito sem bypass, JWT revalidado no banco, login/reset sem seleção ambígua, portal tokenizado, cadastro público transacional e grupo validado por `igreja_id`.
