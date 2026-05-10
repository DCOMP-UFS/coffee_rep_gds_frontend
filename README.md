# Coffee Rep GDS Frontend

Frontend Angular do sistema Coffee Rep GDS.

## Requisitos

- Node.js 22+
- [pnpm](https://pnpm.io/) (recomendado: `corepack enable` e usar a versão em `package.json` → `packageManager`)
- Backend em execucao local na porta `8080`

## Rodando localmente

No diretorio do frontend:

```bash
pnpm install
pnpm run start
```

Aplicacao disponivel em:

- `http://localhost:4200`

## Scripts uteis

- `pnpm run start`: sobe o servidor de desenvolvimento
- `pnpm run build`: gera build de producao
- `pnpm run build:prod`: gera build otimizado
- `pnpm run test`: executa testes unitarios

## Observacoes

- O frontend nao sobe via Docker no fluxo local.
- O backend deve estar ativo para as chamadas de API funcionarem.
