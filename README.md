# Gestão de Salas – Frontend React

Frontend do sistema de gerenciamento de salas do Ambulatório HU-UFS, reescrito em React +
TypeScript no lugar da versão Angular que ficava neste mesmo repositório. Consome o backend
NestJS (`coffee_rep_gds_backend`) sem nenhuma mudança de contrato: endpoints, parâmetros,
corpos e formatos de data são os mesmos que o Angular enviava.

A migração foi feita por etapas, e todas as telas do Angular já têm versão aqui.

| Tela | Rota | Situação |
| --- | --- | --- |
| Login e cadastro | `/login`, `/cadastro` | Migrada |
| Setores | `/sections` | Migrada |
| Salas | `/rooms` | Migrada |
| Solicitante | `/requester` | Migrada |
| Ausências | `/absences` | Migrada |
| Reservas | `/reservation` | Migrada |
| Histórico | `/historico` | Migrada |
| Calendário | `/calendar` | Migrada |

Mudanças de comportamento intencionais em relação ao Angular estão em
[docs/DIVERGENCIAS.md](docs/DIVERGENCIAS.md). O roteiro para validar as telas à mão antes de
publicar está em [docs/roteiro-testes-manuais.md](docs/roteiro-testes-manuais.md).

## Pilha

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (componentes em `src/components/ui`)
- TanStack Query v5 (dados do servidor) e TanStack Table v8 (tabelas)
- React Hook Form + Zod v4
- React Router 7
- `sonner` (avisos), `lucide-react` (ícones), Plus Jakarta Sans auto-hospedada
- Biome (lint e formatação), Vitest + Testing Library + MSW (testes)

## Como rodar

Requisitos: Node 22+ e pnpm (a versão fica fixada em `packageManager`; com o Corepack
habilitado, `corepack enable` basta).

```bash
pnpm install
cp .env.example .env   # ajuste VITE_API_URL se necessário
pnpm dev               # http://localhost:5173
```

Por padrão o app aponta para o backend local em `http://localhost:8080/api`. Para usar o
backend publicado, defina `VITE_API_URL=https://api-gestao-salas.vercel.app/api` no `.env`
(a origem `http://localhost:5173` precisa estar em `CORS_ORIGINS` do backend).

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | Não (padrão: backend local) | URL base da API, terminando em `/api` |

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Checagem de tipos e build de produção em `dist/` |
| `pnpm preview` | Serve o build localmente |
| `pnpm typecheck` | Só a checagem de tipos |
| `pnpm lint` / `pnpm lint:fix` | Biome (lint + formatação), com ou sem correção automática |
| `pnpm test` / `pnpm test:watch` | Testes unitários e de integração |

## Organização

```
src/
  app/                 App, rotas, casca com providers, aquecimento do backend
  features/<tela>/     api.ts, hooks.ts, schemas.ts, types.ts, página, diálogos e testes
  components/
    ui/                shadcn/ui (gerado pela CLI; fora do lint)
    layout/            AppLayout, AppSidebar, PageHeader, barra de progresso, aviso de cold start
    data-table/        DataTable e PaginationBar
    feedback/          ConfirmDialog, EmptyState, ErrorState, TableSkeleton
    form/              FormField, MaskedInput, PasswordInput, SearchableSelect
  lib/                 cliente HTTP, erros, token, QueryClient, configuração
  shared/              formatadores, máscaras, validadores e tipos de paginação
test/                  setup do Vitest, servidor MSW e helper que monta o app real
docs/                  DIVERGENCIAS.md, roteiro de testes manuais e planta baixa do ambulatório
```

Identificadores em inglês; textos de interface e documentação em português.

## Como funciona

- **Cliente HTTP** (`lib/api/client.ts`): `fetch` com a URL base de `VITE_API_URL`. Envia
  `Authorization: Bearer <token>` em toda chamada, exceto no login, e transforma respostas de
  erro em `ApiError` (status, caminho e corpo).
- **Sessão** (`lib/auth/token.ts`): o token fica no cookie de sessão `gdsToken`, como no
  Angular. Abrir `/login` ou `/cadastro` encerra a sessão anterior.
- **Erros** (`lib/api/error-handler.ts`): tratados num só lugar, pelo cache do TanStack Query.
  Um 401 mostra o aviso de sessão expirada, descarta o token e volta ao login; os demais erros
  mostram a mensagem do backend quando ela é apresentável (porte de `getHttpErrorMessage`) ou
  a mensagem padrão da ação. Login e cadastro têm tratamento próprio.
- **Carregamento**: barra no topo durante qualquer requisição e aviso de "servidor iniciando"
  quando uma requisição passa de 3 segundos (cold start da Vercel).

## Testes

Regras portadas do Angular (validadores, máscaras, formatadores, mensagens de erro) têm testes
unitários com os mesmos casos das specs originais. As telas têm testes de integração que
montam o app real e verificam, via MSW, a URL, os parâmetros e o corpo exatos de cada
requisição. Requisições sem handler reprovam o teste.

## Deploy (Vercel)

O projeto na Vercel é o mesmo da versão Angular. O `vercel.json` define o framework (Vite), a
pasta de saída (`dist`), a reescrita de rotas para o `index.html` e o cache longo de `/assets`.
Esses valores prevalecem sobre o painel, que ainda guarda a pasta de saída do Angular. No painel
do projeto:

1. Defina `VITE_API_URL=https://api-gestao-salas.vercel.app/api` nas variáveis de ambiente.
2. Confira que o domínio do frontend está em `CORS_ORIGINS` do backend.

O workflow em `.github/workflows/ci.yml` roda lint, tipos, testes e build em cada push na `main`
e em cada pull request.
