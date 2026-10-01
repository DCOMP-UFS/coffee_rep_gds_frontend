# Gestão de Salas – Frontend React

Frontend do sistema de gerenciamento de salas do Ambulatório HU-UFS, reescrito em React +
TypeScript no lugar da versão Angular que ficava neste mesmo repositório. Consome o backend
NestJS (`coffee_rep_gds_backend`) sem nenhuma mudança de contrato: endpoints, parâmetros,
corpos e formatos de data são os mesmos que o Angular enviava. As únicas rotas novas são as de
perfis e pedidos de acesso (`auth/me`, `role-request`, `user/:id/role`).

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
| Meu acesso | `/meu-acesso` | Nova |
| Administração | `/admin` | Nova (só administrador) |

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
| `VITE_API_URL` | Não (padrão: backend local em `pnpm dev`; API publicada em `pnpm build`) | URL base da API, terminando em `/api` |

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
    layout/            AppLayout, AppSidebar, AppFooter, PageHeader, barra de progresso, aviso de cold start
    icons/             ícones de marcas ausentes no lucide-react (GitHub, LinkedIn, WhatsApp)
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

### Perfis e permissões

Os perfis são Visualizador, Assistente administrativo, Coordenação e o Administrador único; a
tabela de permissões está no README do backend, que é quem de fato as aplica. No frontend, elas
decidem o que fica liberado; nenhuma funcionalidade é escondida:

- **`useCurrentUser`** (`features/session/hooks.ts`) busca `GET auth/me`, que devolve o perfil e
  a lista de permissões já calculada. Para liberar ou bloquear, o frontend só pergunta se uma
  permissão está na lista.
- **`ProtectedRoute`** espera essa resposta antes de montar qualquer tela, com esqueleto enquanto
  carrega e tela de erro com "Tentar novamente" e "Sair" se falhar. O login descarta a sessão
  anterior do cache, para um usuário nunca herdar as permissões de outro.
- **Ações bloqueadas:** cada tela chama `useAccess(permissão, funcionalidade)` uma vez e repassa o
  `lock` a `LockableButton` (botões "Novo") e `RowActions`/`RowActionButton` (ações das linhas).
  Sem permissão, o botão continua visível com cadeado, `aria-disabled` e um tooltip com o perfil
  mínimo ("Disponível a partir de Coordenação"). O clique abre o modal "Acesso necessário", com o
  perfil atual, o necessário e o passo a passo para pedir acesso. Enquanto verifica os pedidos do
  usuário, o modal mostra "Verificando seus pedidos…"; se já existe um pedido em análise, avisa se ele
  cobre a funcionalidade. O modal é único, montado pelo `AccessDialogProvider` no `AppLayout`.
- **`PERMISSION_REQUIREMENTS`** (`features/session/access.ts`) diz o perfil mínimo de cada
  permissão. É o único ponto que repete a matriz do backend, e um teste o compara com as permissões
  de cada perfil nas fixtures.
- **Menu:** mostra todos os itens; Administração aparece com cadeado para quem não é administrador.
- **`PermissionGate`** protege a rota: quem abre uma tela sem permissão vê "Sem permissão", com a
  mesma explicação do modal.
- **"Pedir acesso"** leva a `/meu-acesso?perfil=COORDINATOR`, que abre o formulário com esse perfil
  marcado. Um valor que o usuário não pode pedir é ignorado.
- **Meu acesso** mostra o perfil atual, a hierarquia, o formulário de pedido (ou o pedido em
  análise, que pode ser cancelado) e o histórico de pedidos.
- **Administração** tem as abas Pedidos, com a contagem de pendentes, e Usuários. A contagem também
  aparece no menu e é atualizada a cada minuto.

## Testes

Regras portadas do Angular (validadores, máscaras, formatadores, mensagens de erro) têm testes
unitários com os mesmos casos das specs originais. As telas têm testes de integração que
montam o app real e verificam, via MSW, a URL, os parâmetros e o corpo exatos de cada
requisição. Requisições sem handler reprovam o teste.

`renderApp(rota, { role })` monta o app já com o `auth/me` do perfil informado no cache (padrão
`COORDINATOR`, que vê tudo o que o Angular via). Os testes "por perfil" de cada tela usam
`role: "VIEWER"` ou `"ASSISTANT"`; `role: null` deixa o cache vazio para o teste declarar o
próprio handler de `auth/me`. `test/access.ts` reúne os auxiliares desses testes:
`getLockedButton` confere o `aria-disabled`, `openAccessDialog` abre o modal, `mockMyRoleRequests`
responde os pedidos do usuário e `recordWrites` prova que nenhuma escrita foi feita.

## Deploy (Vercel)

O projeto na Vercel é o mesmo da versão Angular. O `vercel.json` define o framework (Vite), a
pasta de saída (`dist`), a reescrita de rotas para o `index.html` e o cache longo de `/assets`.
Esses valores prevalecem sobre o painel, que ainda guarda a pasta de saída do Angular.

Sem `VITE_API_URL`, o build de produção usa `https://api-gestao-salas.vercel.app/api`, a mesma
API do Angular. Para apontar para outra, defina `VITE_API_URL` nas variáveis de ambiente do
projeto e faça um novo deploy: o valor entra no código durante o build. O domínio do frontend
precisa estar em `CORS_ORIGINS` do backend.

Esta versão depende de `GET auth/me`, então o backend com os perfis precisa ser publicado (e a
migração `db:migrate-roles` rodada) antes do frontend. A ordem completa está no README do backend.

O workflow em `.github/workflows/ci.yml` roda lint, tipos, testes e build em cada push na `main`
e em cada pull request.

## Licença

Software proprietário, com todos os direitos reservados. Uso, cópia, modificação, distribuição
ou exploração comercial dependem de autorização por escrito do titular. Os termos completos estão
em [LICENSE](LICENSE).
