# Coffee Rep GDS Frontend

Frontend Angular do sistema Coffee Rep GDS.

## Requisitos

- Node.js 22+
- npm 10+
- Backend em execucao local na porta `8080`

## Rodando localmente

No diretorio do frontend:

```bash
npm ci
npm run start
```

Aplicacao disponivel em:

- `http://localhost:4200`

## Scripts uteis

- `npm run start`: sobe o servidor de desenvolvimento
- `npm run build`: gera build de producao
- `npm run build:prod`: gera build otimizado
- `npm run test`: executa testes unitarios

## Observacoes

- O frontend nao sobe via Docker no fluxo local.
- O backend deve estar ativo para as chamadas de API funcionarem.
