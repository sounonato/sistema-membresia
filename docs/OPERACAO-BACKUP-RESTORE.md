# Operação de backup e restore

Este procedimento é obrigatório antes de executar migrations ou deploy do backend. Ele não deve ser executado apontando para o banco de produção sem uma janela aprovada.

## Backup

1. Confirmar `DATABASE_URL`, ambiente e destino do arquivo.
2. Criar um dump customizado, sem imprimir dados no terminal:

```bash
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" \
  --file="/caminho/seguro/membresia-$(date +%Y%m%d-%H%M%S).dump"
```

3. Calcular o hash e armazená-lo separado do dump:

```bash
shasum -a 256 /caminho/seguro/membresia-*.dump
```

4. Guardar o dump em armazenamento criptografado com retenção mínima de 30 dias. Nunca versionar dumps, logs de restore ou arquivos `.env`.

## Teste de restore

1. Criar um banco temporário vazio e usar uma `DATABASE_URL` temporária.
2. Restaurar sem sobrescrever o banco original:

```bash
createdb membresia_restore_test
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="$DATABASE_URL_RESTORE" /caminho/seguro/membresia-YYYYMMDD-HHMMSS.dump
```

3. Subir o backend apontando para o banco temporário e validar `/ready`, login de teste, listagem de membros, cadastro público e portal com token.
4. Registrar data, duração, tamanho do dump, resultado e responsável.

## Checklist antes de produção

- backup recém-validado e hash conferido;
- `PORTAL_SECRET` e `JWT_SECRET` fortes e diferentes;
- `DATABASE_SSL_REJECT_UNAUTHORIZED=true`;
- `CORS_ORIGINS` limitado aos domínios reais;
- `FRONTEND_URL` configurada;
- staging validado com as migrations pendentes;
- plano de rollback e contato responsável definidos;
- `/ready` respondendo 200 após o deploy.

RPO/RTO sugeridos: RPO máximo de 24 horas e RTO máximo de 2 horas até que a igreja defina metas próprias.
