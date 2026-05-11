# Coffee Rep GDS Frontend

Frontend em **Angular** do sistema Coffee Rep GDS.

## Requisitos

- **Node.js** 22 ou superior
- **pnpm** — [instalação](https://pnpm.io/); recomendado habilitar o [Corepack](https://nodejs.org/api/corepack.html) e usar a versão indicada em `package.json` no campo `packageManager`
- **Backend** acessível (local na porta `8080` em desenvolvimento, ou API em produção — ver `src/environments/`)

## Desenvolvimento local

Na raiz do repositório:

```bash
pnpm install
pnpm run start
```

A aplicação sobe em **http://localhost:4200**. As URLs da API vêm de `src/environments/environment.ts` (dev) e `environment.prod.ts` (build de produção).

## Scripts úteis

| Comando | Descrição |
|--------|------------|
| `pnpm run start` | Servidor de desenvolvimento |
| `pnpm run build` | Build de produção (padrão) |
| `pnpm run build:prod` | Build otimizado explícito |
| `pnpm run test` | Testes unitários |
| `pnpm run biome` | Lint/format Biome com `--write` no `./src` |

Para checagem **sem** alterar arquivos (útil antes de commit): `pnpm exec biome check ./src` — mesmo comportamento do workflow de CI.

## Deploy em produção

- **URL pública:** https://gestao-salas-hu.vercel.app/
- O deploy é feito pela **Vercel**, ligada a este repositório GitHub (push nos branches configurados no projeto Vercel).
- O arquivo **`vercel.json`** define install (`pnpm install --frozen-lockfile`), build e rewrites para SPA.

**CORS:** o backend (Cloud Run) precisa permitir a origem `https://gestao-salas-hu.vercel.app` na variável de ambiente **`CORS_ORIGINS`** (ajuste no `cloudbuild.yaml` / deploy do backend).

## CI no GitHub (qualidade)

O workflow **`.github/workflows/quality.yaml`** roda em push e pull request para `main` e `develop`: instala dependências com lockfile e executa **Biome** em modo somente verificação. **Não substitui** o deploy — só garante padronização do código no repositório.

## Observações

- Não há Dockerfile obrigatório para desenvolvimento local neste fluxo.
- Previews da Vercel (`*.vercel.app`) podem precisar da mesma origem extra em **CORS** no backend, se forem usadas contra a API de produção.
