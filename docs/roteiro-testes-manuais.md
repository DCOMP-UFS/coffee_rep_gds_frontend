# Roteiro de testes manuais — Coffee Rep GDS

Guia para validar os fluxos principais do frontend em ambiente local. Cada cenário traz **dados literais** para digitar ou selecionar na tela indicada.

## Pré-requisitos

| Item | Valor / comando |
|------|-----------------|
| Backend | `http://localhost:8080` (`.\mvnw.cmd -Pdev spring-boot:run` no backend). Reinicie após alterações em autenticação/cadastro. |
| Banco | Postgres em `localhost:5433` (`docker compose up -d postgres`) |
| Frontend | `http://localhost:4200` (`pnpm start` em `coffee_rep_gds_frontend`) |
| Admin padrão | CPF `170.556.610-30` (só dígitos: `17055661030`), senha `1234` |
| Navegador | Chrome ou Edge; DevTools (F12) → aba **Console** ao testar selects e modais |

### Perfis de base de dados

| Perfil | Como preparar | Objetivo |
|--------|---------------|----------|
| **A — Vazio** | Banco sem setores, salas, solicitantes e reservas | Empty states, links “Cadastrar …”, validações |
| **B — Mínimo** | Cadastrar apenas o **Kit B** (abaixo) | Um fluxo feliz ponta a ponta |
| **C — Rico** | Cadastrar o **Kit C** completo | Filtros, busca, paginação, recorrência, ausência, cancelamentos |

### Ordem recomendada de execução

1. Autenticação (`/login`, `/cadastro`)
2. Setores (`/sections`) — Kit B ou C
3. Salas (`/rooms`)
4. Solicitantes (`/requester`)
5. Calendário (`/calendar`)
6. Reservas (`/reservation`)
7. Ausências (`/absences`)
8. Regressão dos selects e modais

---

## Kit de dados reutilizável

Use os mesmos valores entre telas para não se perder. CPFs abaixo têm **11 dígitos** (validação do formulário).

### Usuários (login / cadastro)

| Papel | Nome | CPF (máscara) | CPF (só números) | Senha | E-mail | Telefone | Nascimento |
|-------|------|---------------|------------------|-------|--------|----------|------------|
| Admin (já existe no backend) | — | `170.556.610-30` | `17055661030` | `1234` | `admin@admin.com` | — | — |
| Novo usuário (cadastro C1) | `Maria Oliveira Teste` | `529.982.247-25` | `52998224725` | `Teste@1234` | `maria.oliveira.teste@example.com` | `(79) 99888-7766` | `15/03/1990` |
| Segundo usuário (opcional) | `Carlos Souza Teste` | `390.533.447-05` | `39053344705` | `Teste@5678` | `carlos.souza.teste@example.com` | `(11) 91234-5678` | `22/07/1985` |
| Conflito de CPF (cadastro C3) | `Maria Oliveira Teste` | `170.556.610-30` | `17055661030` | `Teste@1234` | `maria.oliveira.teste@example.com` | `(79) 99888-7766` | `15/03/1990` |
| Conflito de e-mail (cadastro C4) | `Maria Oliveira Teste` | `529.982.247-25` | `52998224725` | `Teste@1234` | `admin@admin.com` | `(79) 99888-7766` | `15/03/1990` |

### Kit B — catálogo mínimo (1 de cada)

| Entidade | Campos |
|----------|--------|
| Setor | Nome: `Ambulatório` · Observação: `Andar térreo` |
| Sala | Nome: `Amb-A1` · Setor: `Ambulatório` |
| Solicitante | Nome: `Dra. Ana Silva` · CPF: `529.982.247-25` · Telefone: `(11) 98765-4321` · Especialidade: `Clínica geral` |
| Reserva pontual (rápida) | Setor: `Ambulatório` · Sala: `Amb-A1` · Responsável: `Dra. Ana Silva` · Data: **hoje** · Horário: `08:00 - 09:00` |

### Kit C — catálogo rico

**Setores**

| Nome | Observação |
|------|------------|
| `Ambulatório` | `Andar térreo` |
| `Cardiologia` | *(vazio)* |
| `Ortopedia` | `Bloco B` |

**Salas**

| Nome da sala | Setor |
|--------------|-------|
| `Amb-A1` | Ambulatório |
| `Amb-A2` | Ambulatório |
| `Cardio-01` | Cardiologia |
| `Orto-01` | Ortopedia |

**Solicitantes**

| Nome | CPF | Telefone | Especialidade |
|------|-----|----------|---------------|
| `Dra. Ana Silva` | `529.982.247-25` | `(11) 98765-4321` | `Clínica geral` |
| `Dr. Bruno Costa` | `390.533.447-05` | `(21) 97654-3210` | `Cardiologia` |
| `Dra. Carla Mendes` | `123.456.789-09` | `(79) 98877-6655` | `Ortopedia` |

**Reservas (modal em `/reservation`)**

| Tipo | Setor | Sala | Responsável | Datas | Horário | Dias da semana |
|------|-------|------|-------------|-------|---------|----------------|
| Pontual | Ambulatório | Amb-A1 | Dra. Ana Silva | Data de reserva: **12/05/2026** | `10:00 - 11:00` | — |
| Recorrente | Cardiologia | Cardio-01 | Dr. Bruno Costa | Início: `01/06/2026` · Fim: `30/06/2026` | `14:00 - 15:00` | Segunda, Quarta |
| Conflito (CAL7 / RES) | Ambulatório | Amb-A1 | Dra. Ana Silva | **Mesmo dia** da reserva pontual acima | `10:00 - 11:00` | — |

**Ausência (impacto no calendário)**

| Profissional | Início | Fim |
|--------------|--------|-----|
| Dra. Ana Silva | `10/06/2026` | `20/06/2026` |

*(Cadastre uma reserva da Dra. Ana em um dia dentro desse intervalo para validar “Livre (férias / ausência)” no calendário.)*

### Datas e períodos auxiliares

| Uso | Início | Fim |
|-----|--------|-----|
| Listagem sem resultados (`/reservation`) | `01/01/2020` | `31/01/2020` |
| Busca ampla no mês de teste | `01/05/2026` | `31/05/2026` |
| Período padrão ao abrir `/reservation` | **hoje** | **hoje + 30 dias** (automático) |

---

## Autenticação

### `http://localhost:4200/login`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| L1 | Login válido | CPF `170.556.610-30` · Senha `1234` · **Entrar** | Redireciona para área autenticada (ex.: `/rooms`); menu lateral visível |
| L2 | CPF inválido | CPF `123.456.789` (menos de 11 dígitos) · Senha `1234` | Botão **Entrar** desabilitado ou erro “11 dígitos” |
| L3 | Senha incorreta | CPF `170.556.610-30` · Senha `0000` · **Entrar** | Snackbar vermelho com erro de autenticação; permanece em `/login` |
| L4 | Campos vazios | CPF em branco · Senha em branco · **Entrar** | Validação nos campos; sem login |
| L5 | Mostrar/ocultar senha | CPF `170.556.610-30` · Senha `1234` · ícone do olho | Texto da senha alterna visível/oculto |
| L6 | Ir para cadastro | Clicar **Ainda não possui acesso? Clique aqui.** | URL `http://localhost:4200/cadastro` |
| L7 | Rota protegida sem sessão | Sem login, abrir `http://localhost:4200/calendar` | Redireciona para `/login` |

### `http://localhost:4200/cadastro`

Use os dados do **Kit de usuários** (tabela acima). Em erros de API, o snackbar vermelho aparece no canto superior direito; a página permanece em `/cadastro`.

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| C1 | Cadastro válido | Nome `Maria Oliveira Teste` · Telefone `(79) 99888-7766` · E-mail `maria.oliveira.teste@example.com` · CPF `529.982.247-25` · Nascimento `15/03/1990` · Senha `Teste@1234` · **Cadastre-se** | Snackbar de sucesso; redireciona para `/login?registered=1` |
| C2 | E-mail inválido | Mesmos dados de C1, exceto E-mail `email@` | `mat-error` no e-mail; **Cadastre-se** desabilitado |
| C3 | CPF duplicado | Mesmos dados de C1, exceto CPF `170.556.610-30` (admin) · **Cadastre-se** | Snackbar vermelho: `Este CPF já está cadastrado.`; permanece em `/cadastro` |
| C4 | E-mail duplicado | Mesmos dados de C1, exceto E-mail `admin@admin.com` (e-mail do admin) · **Cadastre-se** | Snackbar vermelho: `Este e-mail já está cadastrado.`; permanece em `/cadastro` |
| C5 | Data de nascimento inválida | Mesmos dados de C1, exceto Nascimento `32/13/1990` · **Cadastre-se** | `mat-error` em nascimento; envio bloqueado |
| C6 | Máscara de nascimento | Mesmos dados de C1 · digitar `15031990` no campo Nascimento | Campo exibe `15/03/1990` (máscara `DD/MM/AAAA`) |
| C7 | Validação sem scroll interno | Disparar erros em vários campos (ex.: C2 + C5) | Mensagens abaixo dos campos; card **sem** barra de rolagem interna |
| C8 | Mostrar/ocultar senha | Senha `Teste@1234` · ícone do olho | Texto da senha alterna visível/oculto |
| C9 | Voltar | Em `/cadastro`, **Voltar** | URL `http://localhost:4200/login` |

### Sair

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| S1 | Logout | Logado como admin · menu **Sair** | Cookies limpos; `http://localhost:4200/calendar` volta para login |

---

## Setores — `http://localhost:4200/sections`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| SEC1 | Lista vazia (perfil A) | Abrir a página sem setores | Título `Nenhum setor cadastrado` · botão **Novo setor** |
| SEC2 | Criar setor | **Novo setor** · Nome `Ambulatório` · Observação `Andar térreo` · **Salvar** | Modal fecha; linha `Ambulatório` / `Andar térreo` |
| SEC3 | Criar sem observação | **Novo setor** · Nome `Cardiologia` · Observação *(vazio)* · **Salvar** | Linha `Cardiologia` · observação `—` |
| SEC4 | Nome obrigatório | **Novo setor** · Nome *(vazio)* · **Salvar** | Botão desabilitado ou erro no nome |
| SEC5 | Editar | Editar `Ambulatório` · Observação `Recepção principal` · **Salvar** | Lista mostra nova observação |
| SEC6 | Excluir sem dependências | Excluir setor `Ortopedia` sem salas vinculadas · confirmar | Linha removida |
| SEC7 | Erro de rede | Parar backend · recarregar `/sections` | Erro + **Tentar novamente** |

---

## Salas — `http://localhost:4200/rooms`

Página inicial: `http://localhost:4200/` redireciona para `/rooms`.

### Toolbar e filtros

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| SAL1 | Lista vazia (perfil A) | Sem salas cadastradas | Empty state · **Nova sala** |
| SAL2 | Filtro **Todas** | Setor `Todas` · Status `Todas` · **Buscar** | Todas as salas (ex.: `Amb-A1`, `Amb-A2`, `Cardio-01`) |
| SAL3 | Filtro por setor | Setor `Cardiologia` · Status `Todas` · **Buscar** | Só `Cardio-01` |
| SAL4 | Status **Ocupada** | Antes: reserva pontual em `Amb-A1` hoje `08:00 - 09:00` · Setor `Ambulatório` · Status `Ocupada` · **Buscar** | `Amb-A1` com chip **Ocupada** |
| SAL5 | Busca no select Setor | No painel Setor, buscar `card` | Opção `Cardiologia`; hint com contagem filtrada |
| SAL6 | Paginação | Cadastrar 6+ salas · paginador **10** itens · página 2 | Segunda página coerente com total |

### Modal Nova sala / Editar sala

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| SAL7 | Criar sala | **Nova sala** · Nome `Amb-A1` · Setor `Ambulatório` · **Salvar** | Linha `Amb-A1` / `Ambulatório` |
| SAL8 | Sem setor no sistema | Perfil A · **Nova sala** · painel Setor vazio · **Cadastrar setor** | Navega para `/sections`; modal fecha |
| SAL9 | Nome obrigatório | **Nova sala** · Nome *(vazio)* · Setor `Ambulatório` | **Salvar** desabilitado |
| SAL10 | Editar | Editar `Amb-A1` · Nome `Amb-A1 Consultório` · **Salvar** | Nome atualizado na tabela |
| SAL11 | Excluir | Excluir `Orto-01` · confirmar | Sala removida |
| SAL12 | Modal / select | **Nova sala** · abrir select Setor com vários itens | Painel não cortado; scroll interno se necessário |

---

## Solicitantes — `http://localhost:4200/requester`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| REQ1 | Lista vazia | Perfil A | Empty state · **Novo Solicitante** |
| REQ2 | Criar | **Novo Solicitante** · Nome `Dra. Ana Silva` · CPF `529.982.247-25` · Telefone `(11) 98765-4321` · Especialidade `Clínica geral` · **Salvar** | Linha na tabela com esses dados |
| REQ3 | Editar | Editar `Dra. Ana Silva` · Especialidade `Medicina de família` · **Salvar** | Especialidade atualizada |
| REQ4 | Excluir | Excluir `Dra. Carla Mendes` · confirmar | Registro removido |
| REQ5 | Paginação | 6+ solicitantes · tamanho `10` · página 2 | Paginação correta |
| REQ6 | Select em `/calendar` | Após REQ2 · `/calendar` · Responsável · buscar `Ana` | Opção `Dra. Ana Silva` |

---

## Calendário e reserva rápida — `http://localhost:4200/calendar`

### Reserva Rápida (somente pontual)

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| CAL1 | Sem setores | Perfil A · abrir select **Setor** | Mensagem vermelha · **Cadastrar setor** → `/sections` · mensagem **não** vira valor |
| CAL2 | Setor sem salas | Só setor `Ortopedia` sem salas · Setor `Ortopedia` · abrir **Sala** | **Cadastrar sala** → `/rooms` |
| CAL3 | Cascata setor → sala | Setor `Ambulatório` · Sala `Amb-A1` · trocar setor para `Cardiologia` | Sala limpa; lista só salas do setor escolhido |
| CAL4 | Sem solicitantes | Perfil A · **Responsável** | **Cadastrar solicitante** → `/requester` |
| CAL5 | Horário inválido | Setor/Sala/Responsável válidos · Data hoje · Horário `25:00 - 26:00` · **Reservar Agora** | Erro ou envio bloqueado |
| CAL6 | Horário válido | Setor `Ambulatório` · Sala `Amb-A1` · Responsável `Dra. Ana Silva` · Data **hoje** · Horário `08:00 - 09:00` · **Reservar Agora** | Sucesso; evento pontual (amarelo) no calendário |
| CAL7 | Conflito | Repetir exatamente CAL6 (mesma sala, data e horário) | Erro de conflito do backend |
| CAL8 | Busca nos selects | Kit C · Setor: buscar `amb` · Sala: buscar `a1` · Responsável: buscar `bruno` | Filtros e hints de contagem corretos |

### Calendário do mês

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| CAL9 | Legenda | Conferir legenda | Amarelo pontual · vermelho recorrente · verde livre (ausência) |
| CAL10 | Evento pontual | Clicar reserva `Amb-A1` `08:00 - 09:00` (pontual) | Modal: título com sala/setor · tipo **Pontual** |
| CAL11 | Evento recorrente | Clicar ocorrência da série `Cardio-01` / `14:00 - 15:00` | Tipo **Recorrente** |
| CAL12 | Ausência | Reserva da `Dra. Ana Silva` em `15/06/2026` + ausência `10/06/2026`–`20/06/2026` | Tipo **Livre (profissional em ausência / férias)** |
| CAL13 | Mês atual | Reservas em maio/2026 (perfil C) | Eventos nos dias corretos do mês exibido |

---

## Reservas — `http://localhost:4200/reservation`

### Listagem e período

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| RES1 | Período padrão | Abrir a página (sem alterar datas) | Período ~hoje até +30 dias |
| RES2 | Sem resultados | Início `01/01/2020` · Fim `31/01/2020` · **Buscar** | Empty state · **Nova Reserva** |
| RES3 | Busca no mês | Início `01/05/2026` · Fim `31/05/2026` · **Buscar** | Reservas do Kit C no intervalo |
| RES4 | Paginação | Várias reservas · tamanho `10` · página 2 | Lista e total alinhados |
| RES5 | Coluna tipo | Linha pontual `Amb-A1` vs linha com recorrência `Cardio-01` | **Pontual** / **Recorrente** corretos |

### Modal Cadastro de Reserva

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| RES6 | Selects vazios | Perfil A · **Nova Reserva** | Hints vermelhos · **Cadastrar …** navega e fecha modal |
| RES7 | Modo **Pontual** | Toggle **Pontual** (esquerda) | Só **Data de reserva** + **Horário** |
| RES8 | Modo **Recorrente** | Toggle **Recorrente** (direita) | **Data início**, **Data fim**, **Horário**, chips Seg–Sáb |
| RES9 | Salvar pontual | Pontual · Setor `Ambulatório` · Sala `Amb-A1` · Responsável `Dra. Ana Silva` · Data `12/05/2026` · Horário `10:00 - 11:00` · **Salvar** | Modal fecha; linha pontual na lista |
| RES10 | Salvar recorrente | Recorrente · Setor `Cardiologia` · Sala `Cardio-01` · Responsável `Dr. Bruno Costa` · Início `01/06/2026` · Fim `30/06/2026` · Horário `14:00 - 15:00` · dias **Segunda** e **Quarta** · **Salvar** | Linhas/série **Recorrente** |
| RES11 | Recorrente sem dias | Recorrente · mesmas datas/horário de RES10 · **nenhum** chip de dia · **Salvar** | Erro “Nenhuma reserva foi criada” ou validação |
| RES12 | Fim antes do início | Recorrente · Início `30/06/2026` · Fim `01/06/2026` · Horário `14:00 - 15:00` · Segunda · **Salvar** | Erro de parâmetros |
| RES13 | UI da modal | **Nova Reserva** · abrir selects e datepicker | Labels visíveis; painéis não cortados |

### Cancelamento

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| RES14 | Cancelar pontual | Linha pontual `Amb-A1` `12/05/2026` · ícone cancelar · confirmar | Reserva some |
| RES15 | Uma ocorrência | Linha **Recorrente** `Cardio-01` · cancelar · **Cancelar apenas esta** | Só essa ocorrência some |
| RES16 | Série inteira | Outra linha **Recorrente** · cancelar · **Cancelar todas** | Série removida conforme backend |
| RES17 | Desistir | Abrir cancelamento · **Cancelar** no diálogo | Nenhuma alteração |

---

## Ausências e férias — `http://localhost:4200/absences`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| AUS1 | Lista vazia | Perfil A | Empty state · **Nova ausência** |
| AUS2 | Criar | **Nova ausência** · Profissional `Dra. Ana Silva` · Início `10/06/2026` · Fim `20/06/2026` · **Salvar** | Linha com profissional e datas |
| AUS3 | Sem solicitantes | Perfil A · **Nova ausência** · select vazio · **Cadastrar solicitante** | Navega para `/requester` |
| AUS4 | Editar | Editar ausência da Ana · Fim `25/06/2026` · **Salvar** | Data fim atualizada |
| AUS5 | Excluir | Excluir ausência · confirmar | Linha removida |
| AUS6 | Calendário | Após AUS2 + reserva da Ana em `15/06/2026` · `/calendar` | Evento com **Livre (férias / ausência)** |
| AUS7 | Datas invertidas | Início `20/06/2026` · Fim `10/06/2026` · **Salvar** | Validação ou erro |

---

## Regressão transversal — selects e modais

| # | Onde testar | Dados / ação | Resultado esperado |
|---|-------------|--------------|-------------------|
| X1 | `/calendar` · modal `/reservation` · filtro `/rooms` · modal sala · modal ausência | Perfil A · abrir select vazio | Mensagem vermelha não selecionável; sem checkmark no texto de estado |
| X2 | Mesmas telas | **Cadastrar setor** / **sala** / **solicitante** | Rotas `/sections`, `/rooms`, `/requester`; modal fecha; console sem erro |
| X3 | Qualquer modal de formulário | Abrir select e datepicker | Painel fora do conteúdo cortado |
| X4 | `/reservation` · **Nova Reserva** | Alternar Pontual ↔ Recorrente | Campos condicionais corretos |
| X5 | Kit C · select Setor em `/rooms` | Buscar `zzz` | “Nenhum resultado…” · **Limpar busca** |

---

## Matriz rápida por URL

| URL | Menu | Foco principal |
|-----|------|----------------|
| `http://localhost:4200/login` | — | Login |
| `http://localhost:4200/cadastro` | — | Cadastro de usuário |
| `http://localhost:4200/calendar` | Calendário | Reserva rápida + calendário mensal |
| `http://localhost:4200/reservation` | Reservas | Listagem, nova reserva, cancelamentos |
| `http://localhost:4200/rooms` | Salas | CRUD e filtros |
| `http://localhost:4200/sections` | Setores | CRUD de setores |
| `http://localhost:4200/requester` | Solicitante | CRUD de solicitantes |
| `http://localhost:4200/absences` | Ausências | Ausências/férias |

---

## Checklist final

- [ ] Autenticação: login com snackbar de erro (L3) e cadastro C1–C9
- [ ] Cadastro: CPF duplicado (C3) e e-mail duplicado (C4) com mensagens claras no snackbar vermelho
- [ ] Perfil A: empty states e links dos selects
- [ ] Perfil B: Kit B completo até reserva rápida e listagem em `/reservation`
- [ ] Perfil C: filtros, recorrente, cancelamentos, ausência no calendário
- [ ] Console limpo em `/calendar` e modais
- [ ] Toggle Pontual/Recorrente: mais campos em **Recorrente**
- [ ] `pnpm run build` e `pnpm test:ci` verdes
