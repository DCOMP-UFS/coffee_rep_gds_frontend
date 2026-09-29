# Roteiro de testes manuais — Gestão de Salas

Guia para validar os fluxos principais do frontend em ambiente local, antes de publicar. Cada
cenário traz **dados literais** para digitar ou selecionar na tela indicada. Os comportamentos que
mudaram em relação ao frontend Angular estão explicados em [DIVERGENCIAS.md](DIVERGENCIAS.md), e
cada cenário indica o item correspondente quando houver.

> Rode este roteiro só contra o banco **local**. Ele cria, edita e exclui registros; nunca aponte o
> frontend para o backend publicado ou para o MongoDB Atlas ao executá-lo.

## Pré-requisitos

| Item | Valor / comando |
|------|-----------------|
| Backend | `http://localhost:8080` — em `coffee_rep_gds_backend`: `pnpm db:up`, `pnpm seed:admin` e `pnpm start:dev` (detalhes no README do backend) |
| Banco | MongoDB local em `localhost:27018`; para inspecionar os dados, mongo-express em `http://localhost:8081` |
| Frontend | `http://localhost:5173` — `pnpm dev` neste repositório, com `VITE_API_URL=http://localhost:8080/api` (padrão do `.env.example`) |
| Admin padrão | CPF `170.556.610-30` (só dígitos: `17055661030`), senha `1234` — criado por `pnpm seed:admin` |
| Navegador | Chrome ou Edge; DevTools (F12) com as abas **Console** e **Application → Cookies** à mão |

### Datas relativas

As datas dos kits são relativas ao dia do teste, para o roteiro não envelhecer. **D** é a data de
hoje; **D+1** é amanhã, **D+30** é daqui a 30 dias, e assim por diante. Digite sempre no formato
`DD/MM/AAAA`.

### Perfis de base de dados

| Perfil | Como preparar | Objetivo |
|--------|---------------|----------|
| **A — Vazio** | No backend: `pnpm db:reset` e depois `pnpm seed:admin` (só o admin) | Estados vazios, atalhos "Ir para …", validações |
| **B — Mínimo** | Perfil A + cadastrar o **Kit B** (abaixo) | Um fluxo feliz de ponta a ponta |
| **C — Rico** | Perfil A + cadastrar o **Kit C** completo | Filtros, busca, paginação, recorrência, ausência, cancelamentos |
| **D — Volume** | No backend: `pnpm db:reset`, `pnpm db:migrate` e `pnpm seed:admin` (importa o dump local) | Calendário cheio, "+N mais", paginação com muitos registros |

### Ordem recomendada de execução

1. Autenticação (`/login`, `/cadastro`)
2. Setores (`/sections`)
3. Salas (`/rooms`)
4. Solicitantes (`/requester`)
5. Reservas (`/reservation`)
6. Calendário (`/calendar`)
7. Ausências (`/absences`)
8. Histórico (`/historico`)
9. Regressão transversal (selects, diálogos, sessão e erros)

---

## Kit de dados reutilizável

Use os mesmos valores entre telas para não se perder.

### Usuários (login / cadastro)

| Papel | Nome | CPF (máscara) | CPF (só números) | Senha | E-mail | Telefone | Nascimento |
|-------|------|---------------|------------------|-------|--------|----------|------------|
| Admin (criado pelo seed) | — | `170.556.610-30` | `17055661030` | `1234` | `admin@admin.com` | — | — |
| Novo usuário (cadastro C1) | `Maria Oliveira Teste` | `529.982.247-25` | `52998224725` | `Teste@1234` | `maria.oliveira.teste@example.com` | `(79) 99888-7766` | `15/03/1990` |
| Conflito de CPF (cadastro C3) | `Maria Oliveira Teste` | `170.556.610-30` | `17055661030` | `Teste@1234` | `outro.email.teste@example.com` | `(79) 99888-7766` | `15/03/1990` |
| Conflito de e-mail (cadastro C4) | `Carlos Souza Teste` | `390.533.447-05` | `39053344705` | `Teste@5678` | `admin@admin.com` | `(11) 91234-5678` | `22/07/1985` |

### Kit B — catálogo mínimo (1 de cada)

| Entidade | Campos |
|----------|--------|
| Setor | Nome do setor: `Ambulatório` · Observação: `Andar térreo` |
| Sala | Nome da sala: `Amb-A1` · Setor: `Ambulatório` |
| Solicitante | Nome: `Dra. Ana Silva` · Telefone: `(11) 98765-4321` · Especialidade: `Clínica geral` |
| Reserva pontual | Setor: `Ambulatório` · Sala: `Amb-A1` · Solicitante: `Dra. Ana Silva` · Data da reserva: **D+1** · Horário: `08:00` às `09:00` |

### Kit C — catálogo rico

**Setores**

| Nome do setor | Observação |
|---------------|------------|
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

**Solicitantes** (o telefone é opcional e aceita fixo ou celular)

| Nome | Telefone | Especialidade |
|------|----------|---------------|
| `Dra. Ana Silva` | `(11) 98765-4321` | `Clínica geral` |
| `Dr. Bruno Costa` | `(79) 3212-3456` | `Cardiologia` |
| `Dra. Carla Mendes` | *(vazio)* | `Ortopedia` |

**Reservas** (diálogo "Nova reserva")

| Tipo | Setor | Sala | Solicitante | Datas | Horário | Dias da semana |
|------|-------|------|-------------|-------|---------|----------------|
| Pontual | Ambulatório | Amb-A1 | Dra. Ana Silva | Data da reserva: **D+1** | `10:00` às `11:00` | — |
| Recorrente | Cardiologia | Cardio-01 | Dr. Bruno Costa | Início: **D+1** · Fim: **D+30** | `14:00` às `15:00` | Segunda, Quarta |
| Noturna | Ambulatório | Amb-A2 | Dr. Bruno Costa | Data da reserva: **D+2** | `22:00` às `23:00` | — |
| Conflito | Ambulatório | Amb-A1 | Dra. Ana Silva | **Mesmo dia** da pontual acima | `10:00` às `11:00` | — |

**Ausência** (impacto no calendário)

| Profissional | Início | Fim |
|--------------|--------|-----|
| Dra. Ana Silva | **D+5** | **D+15** |

*(Cadastre uma reserva pontual da Dra. Ana em **D+10** para validar "Livre (férias / ausência)" no
calendário.)*

### Períodos auxiliares

| Uso | De | Até |
|-----|----|-----|
| Listagem sem resultados (`/reservation`) | `01/01/2020` | `31/01/2020` |
| Busca ampla | **D** | **D+60** |
| Período padrão ao abrir `/reservation` | **D** | **D+30** (automático) |

---

## Autenticação

### `http://localhost:5173/login`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| L1 | Login válido | CPF `170.556.610-30` · Senha `1234` · **Entrar** | Vai para `/rooms`; menu lateral visível |
| L2 | CPF incompleto | CPF `123.456.789` · Senha `1234` · **Entrar** | "Informe um CPF válido (11 dígitos)." no campo; nada é enviado |
| L3 | Senha incorreta | CPF `170.556.610-30` · Senha `0000` · **Entrar** | "CPF ou senha incorretos. Tente novamente." em vermelho dentro do formulário; continua em `/login` (item 13) |
| L4 | Campos vazios | CPF e senha em branco · **Entrar** | Mensagens em cada campo ("Informe a senha." na senha); sem login (item 9) |
| L5 | Mostrar/ocultar senha | Senha `1234` · botão do olho | A senha alterna entre visível e oculta |
| L6 | Ir para cadastro | **Ainda não possui acesso? Clique aqui.** | Abre `/cadastro` |
| L7 | Rota protegida sem sessão | Sem login, abrir `http://localhost:5173/calendar` | Volta para `/login` |

### `http://localhost:5173/cadastro`

Use os dados do **Kit de usuários**. Falhas do backend aparecem em vermelho dentro do formulário, que
continua em `/cadastro` (item 13).

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| C1 | Cadastro válido | Nome `Maria Oliveira Teste` · Telefone `(79) 99888-7766` · Data de nascimento `15/03/1990` · E-mail `maria.oliveira.teste@example.com` · CPF `529.982.247-25` · Senha `Teste@1234` · **Cadastre-se** | Vai para `/login` com "Cadastro realizado. Faça login com seu CPF e senha." em verde |
| C2 | E-mail inválido | Dados de C1, exceto E-mail `email@` · **Cadastre-se** | "E-mail inválido." no campo; nada é enviado |
| C3 | CPF duplicado | Linha "Conflito de CPF" do kit · **Cadastre-se** | Mensagem do backend de CPF já cadastrado, dentro do formulário |
| C4 | E-mail duplicado | Linha "Conflito de e-mail" do kit · **Cadastre-se** | "Este e-mail já está cadastrado." dentro do formulário, uma única vez |
| C5 | Data inexistente | Dados de C1, exceto Nascimento `31/02/1990` | "Data inválida." (item 10) |
| C6 | Data incompleta | Dados de C1, exceto Nascimento `15/03` | "Informe a data no formato DD/MM/AAAA." (item 10) |
| C7 | Máscaras | Digitar `15031990` no nascimento e `79998887766` no telefone | Campos mostram `15/03/1990` e `(79) 99888-7766` |
| C8 | Nome só com espaços | Nome `   ` · demais dados de C1 | "Informe o nome." (item 10) |
| C9 | Voltar | Em `/cadastro`, **Voltar** | Abre `/login` |

### Sair

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| S1 | Logout | Logado como admin · **Sair** no menu | Vai para `/login`; o cookie `gdsToken` some e os demais cookies continuam (item 4) |
| S2 | Voltar sem sessão | Depois de S1, abrir `http://localhost:5173/calendar` | Volta para `/login` |

---

## Setores — `http://localhost:5173/sections`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| SEC1 | Lista vazia (perfil A) | Abrir a página | "Nenhum setor cadastrado" com botão de cadastro |
| SEC2 | Criar setor | **Novo setor** · Nome do setor `Ambulatório` · Observação `Andar térreo` · **Salvar** | Diálogo fecha; "Setor salvo com sucesso."; linha `Ambulatório` / `Andar térreo` |
| SEC3 | Criar sem observação | **Novo setor** · Nome `Cardiologia` · Observação vazia · **Salvar** | Linha `Cardiologia` com observação `—` |
| SEC4 | Nome obrigatório | **Novo setor** · Nome vazio · **Salvar** | "Informe o nome." no campo; nada é enviado |
| SEC5 | Editar | **Editar setor Ambulatório** · Observação `Recepção principal` · **Salvar** | Lista mostra a nova observação |
| SEC6 | Excluir sem salas | **Excluir setor Ortopedia** (sem salas) · **Excluir** | "Verificando se o setor tem salas…" e depois exclusão; "Setor removido." |
| SEC7 | Excluir com salas | Kit C · **Excluir setor Ambulatório** | Botão **Excluir** desabilitado; "Este setor tem 2 salas. Exclua as salas deste setor antes de excluir o setor." e atalho **Ver salas do setor** (item 20) |
| SEC8 | Atalho para Salas | Em SEC7, **Ver salas do setor** | Abre `/rooms?setor=ID` já filtrada por Ambulatório |
| SEC9 | Backend fora do ar | Parar o backend · recarregar `/sections` | Quadro de erro com **Tentar novamente**; religar o backend e clicar recupera a lista |

---

## Salas — `http://localhost:5173/rooms`

A página inicial `http://localhost:5173/` leva para `/rooms` quando há sessão.

### Resumo e filtros

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| SAL1 | Lista vazia (perfil A) | Abrir a página | "Nenhuma sala cadastrada" |
| SAL2 | Resumo | Kit C | Faixa com **Total de salas**, **Ocupadas** e **Livres**, somando o total (item 16) |
| SAL3 | Filtro por setor | Setor `Cardiologia` | A lista atualiza na hora, só com `Cardio-01`; aparece **Limpar filtros** (item 14) |
| SAL4 | Status Ocupada | Reserva do Kit B em andamento agora (ajuste o horário para incluir o momento do teste) · Status `Ocupada` | A sala reservada aparece como ocupada |
| SAL5 | Filtro sem resultado | Setor `Ortopedia` · Status `Ocupada` (sem reservas) | "Nenhuma sala encontrada" com opção de limpar os filtros (item 18) |
| SAL6 | Busca no select de setor | Abrir Setor · digitar `ORTO` e depois `ambulatorio` (sem acento) | Encontra `Ortopedia` e `Ambulatório`, ignorando acentos e maiúsculas |
| SAL7 | Filtro no endereço | Abrir `http://localhost:5173/rooms?setor=999999` | O filtro inválido é ignorado e a lista mostra todos os setores |
| SAL8 | Paginação | 6+ salas · **Itens por página** `5` · próxima página | Segunda página coerente com o total |

### Diálogo Nova sala / Editar sala

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| SAL9 | Criar sala | **Nova sala** · Nome da sala `Amb-A1` · Setor `Ambulatório` · **Salvar** | "Sala salva com sucesso."; linha `Amb-A1` / `Ambulatório` (item 17) |
| SAL10 | Sem setores (perfil A) | **Nova sala** | "Cadastre um setor antes de criar salas." com **Ir para Setores** |
| SAL11 | Campos obrigatórios | **Nova sala** · tudo vazio · **Salvar** | "Informe o nome da sala." e "Selecione o setor." |
| SAL12 | Editar | **Editar sala Amb-A1** · Nome `Amb-A1 Consultório` · **Salvar** | Nome atualizado na tabela |
| SAL13 | Excluir | **Excluir sala Orto-01** · **Excluir** | "Sala excluída com sucesso." |
| SAL14 | Excluir o último da última página | Deixar 1 sala na última página · excluí-la | A tela volta para a página anterior, sem estado vazio falso (item 15) |

---

## Solicitantes — `http://localhost:5173/requester`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| REQ1 | Lista vazia | Perfil A | "Nenhum solicitante cadastrado" · **Novo solicitante** |
| REQ2 | Criar com celular | **Novo solicitante** · Nome `Dra. Ana Silva` · Telefone `(11) 98765-4321` · Especialidade `Clínica geral` · **Salvar** | "Solicitante salvo com sucesso."; linha com esses dados |
| REQ3 | Criar com fixo | Nome `Dr. Bruno Costa` · Telefone `(79) 3212-3456` · Especialidade `Cardiologia` | Aceito (item 23) |
| REQ4 | Criar sem telefone | Nome `Dra. Carla Mendes` · Telefone vazio · Especialidade `Ortopedia` | Aceito |
| REQ5 | Telefone incompleto | Telefone `(11) 9876` · demais dados válidos · **Salvar** | "Informe um telefone com DDD (10 ou 11 dígitos)." (item 23) |
| REQ6 | Só espaços | Nome `   ` · Especialidade `   ` · **Salvar** | "Informe o nome." e "Informe a especialidade." |
| REQ7 | Editar | **Editar solicitante Dra. Ana Silva** · Especialidade `Medicina de família` · **Salvar** | Diálogo "Editar solicitante"; especialidade atualizada (item 24) |
| REQ8 | Buscar | Buscar solicitante `ana` · **Buscar** | Só a Dra. Ana; aparece **Limpar busca** |
| REQ9 | Busca só vale enviada | Buscar `ana` e enviar · digitar `bruno` sem enviar · trocar **Itens por página** | A lista continua filtrada por `ana` (item 22) |
| REQ10 | Excluir | **Excluir solicitante Dra. Carla Mendes** · confirmar | "Solicitante excluído com sucesso." |
| REQ11 | Cancelar exclusão | Abrir a exclusão · **Cancelar** | Só fecha; console sem erro (item 25) |

---

## Reservas — `http://localhost:5173/reservation`

### Listagem e período

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| RES1 | Período padrão | Abrir a página | De **D** até **D+30**, mesmo depois das 21h (item 30) |
| RES2 | Sem resultados | De `01/01/2020` · Até `31/01/2020` · **Buscar** | "Nenhuma reserva encontrada" |
| RES3 | Período invertido | De **D+10** · Até **D** · **Buscar** | "A data final deve ser igual ou posterior à data inicial."; nada é enviado |
| RES4 | Período só vale enviado | Buscar **D** a **D+60** · alterar as datas sem enviar · trocar de página | A lista continua no período enviado (item 30) |
| RES5 | Coluna de tipo | Kit C | Linhas **Pontual** e **Recorrente** corretas |

### Diálogo Nova reserva

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| RES6 | Sem cadastros (perfil A) | **Nova reserva** | "Cadastre um setor antes de reservar salas." e "Cadastre um solicitante antes de reservar salas.", com atalhos |
| RES7 | Tipo inicial | **Nova reserva** | Começa em **Pontual**, com "Data da reserva" e horários (item 31) |
| RES8 | Tipo Recorrente | Marcar **Recorrente** | Aparecem "Data de início", "Data de fim" e os dias Segunda a Sábado |
| RES9 | Sala depende do setor | Sala antes de escolher setor · depois Setor `Ambulatório` · trocar para `Cardiologia` | "Selecione o setor primeiro"; "Carregando salas..."; a sala é limpa ao trocar de setor (item 33) |
| RES10 | Setor sem salas | Setor recém-criado sem salas | "Nenhuma sala neste setor." com **Ir para Salas** já filtrado |
| RES11 | Salvar pontual | Linha "Pontual" do Kit C · **Salvar** | "Salvando…"; "Reserva criada com sucesso."; linha pontual na lista (item 34) |
| RES12 | Salvar recorrente | Linha "Recorrente" do Kit C · **Salvar** | Ocorrências **Recorrente** nas segundas e quartas do período |
| RES13 | Validações juntas | Recorrente · Início **D+10** · Fim **D+1** · Horário `15:00` às `14:00` · nenhum dia · **Salvar** | Mostra de uma vez: fim antes do início, horário de fim antes do início e "Selecione ao menos um dia da semana." (item 32) |
| RES14 | Dias fora do período | Recorrente · Início e Fim no mesmo dia, marcando só um dia da semana diferente dele | "Nenhum dos dias escolhidos cai dentro do período." |
| RES15 | Conflito | Linha "Conflito" do Kit C · **Salvar** | "Já existe uma reserva para esta sala no horário solicitado!" dentro do diálogo, que continua aberto |
| RES16 | Clique duplo | Em RES11, clicar duas vezes rápido em **Salvar** | Só uma reserva é criada |

### Cancelamento

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| RES17 | Cancelar pontual | Botão de cancelar da linha pontual · **Cancelar reserva** | "Reserva cancelada."; a linha some |
| RES18 | Só uma ocorrência | Linha **Recorrente** · manter "Só esta reserva" · **Cancelar reserva** | Só essa ocorrência some |
| RES19 | Série inteira | Outra linha **Recorrente** · "Toda a série (inclusive datas que já passaram)" · **Cancelar a série** | "Série cancelada."; todas as ocorrências somem |
| RES20 | Desistir | Abrir o cancelamento · **Voltar** | Nada muda; console sem erro (item 35) |
| RES21 | Teclado | Chegar ao botão de cancelar com **Tab** e acionar com **Enter** | A confirmação abre |

---

## Calendário — `http://localhost:5173/calendar`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| CAL1 | Carregamento | Abrir a página (perfil C ou D) | Dias com esqueletos até chegar a resposta; depois os eventos (item 42) |
| CAL2 | Legenda e cores | Conferir a legenda | Amarelo **Pontual** · vermelho **Recorrente** · verde **Livre (férias / ausência)** |
| CAL3 | Reserva da noite | Reserva "Noturna" do Kit C (**D+2**, 22:00) | Aparece no dia **D+2**, não no dia seguinte (item 40) |
| CAL4 | Navegação | **Próximo mês**, **Mês anterior** e **Hoje** | Título muda ("Outubro de 2026" etc.); **Hoje** fica desabilitado no mês atual; a grade esmaece com "Carregando…" durante a troca |
| CAL5 | Detalhes da reserva | Clicar num evento pontual | "Detalhes da reserva" com Solicitante, Criado por e Horário; **Fechar** |
| CAL6 | Recorrente | Clicar numa ocorrência da `Cardio-01` | Tipo **Recorrente** e ícone de repetição no evento |
| CAL7 | Ausência | Kit C: ausência da Dra. Ana (**D+5** a **D+15**) + reserva dela em **D+10** | Reserva em verde, **Livre (férias / ausência)**; a ausência aparece em todos os dias do período |
| CAL8 | Nova reserva pelo botão | **Nova reserva** | Diálogo com a data de hoje; salvar atualiza o calendário sem recarregar a página (item 43) |
| CAL9 | Nova reserva pelo dia | Clicar no número do dia **D+3** | Diálogo com "Data da reserva" em **D+3** |
| CAL10 | Filtro por setor | Setor `Cardiologia` | Só reservas de Cardiologia; as ausências continuam (item 44) |
| CAL11 | Filtro + nova reserva | Com Setor `Cardiologia`, clicar num dia | O diálogo já vem com o setor Cardiologia |
| CAL12 | "+N mais" | Perfil D, num dia com muitos eventos · clicar **+N mais** | Lista do dia com o total no topo; cada linha com horário, sala com setor e tipo; a semana não estica (item 45) |
| CAL13 | Evento na lista do dia | Em CAL12, clicar numa linha | A lista fecha e abrem os detalhes do evento |
| CAL14 | Todas as reservas do mês | Perfil D · comparar um dia cheio com `/reservation` no mesmo período | Nenhuma reserva fica de fora (item 41) |
| CAL15 | Falha ao carregar | Parar o backend · **Próximo mês** | "Não foi possível carregar as reservas deste período." com **Tentar novamente**, uma única vez e sem aviso no canto |

---

## Ausências e férias — `http://localhost:5173/absences`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| AUS1 | Lista vazia | Perfil A | "Nenhuma ausência cadastrada" · **Nova ausência** |
| AUS2 | Sem solicitantes | Perfil A · **Nova ausência** | "Cadastre um solicitante antes de registrar ausências." com **Ir para Solicitantes**; **Salvar** desabilitado (item 27) |
| AUS3 | Criar | **Nova ausência** · Profissional `Dra. Ana Silva` · Data de início **D+5** · Data de fim **D+15** · **Salvar** | "Ausência salva com sucesso."; linha com profissional e datas |
| AUS4 | Datas invertidas | Início **D+15** · Fim **D+5** · **Salvar** | "A data de fim deve ser igual ou posterior à data de início." no fim; nada é enviado |
| AUS5 | Data inválida | Início `31/02/2027` | "Data inválida." (item 26) |
| AUS6 | Editar | **Editar ausência** da Dra. Ana · Fim **D+20** · **Salvar** | Diálogo "Editar ausência"; data de fim atualizada |
| AUS7 | Profissional excluído | Excluir a Dra. Carla em Solicitantes depois de criar uma ausência para ela · editar essa ausência | O nome dela continua no campo e a ausência pode ser salva (item 28) |
| AUS8 | Ordem da lista | Várias ausências | Ordenadas pelo início, da mais recente para a mais antiga (item 29) |
| AUS9 | Excluir | **Excluir ausência** · confirmar | "Ausência removida." |
| AUS10 | Impacto nas salas | Ausência cobrindo **D** para quem tem reserva agora · voltar a `/rooms` | A sala dessa reserva passa a contar como livre |

---

## Histórico — `http://localhost:5173/historico`

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| HIS1 | Eventos recentes | Depois dos cenários acima | Criações, edições e exclusões feitas no roteiro aparecem, com o login como "Login no sistema" |
| HIS2 | Filtros só em "Filtrar" | Ação `Criação de sala` · trocar de página sem clicar **Filtrar** | A lista não muda até **Filtrar**, que mostra "Filtrando…" (item 36) |
| HIS3 | Busca | Buscar `admin` ou o número de um registro · **Filtrar** | Só eventos daquele usuário ou registro (item 37) |
| HIS4 | Período invertido | De **D** · Até uma data anterior · **Filtrar** | "A data final deve ser igual ou posterior à data inicial." |
| HIS5 | Sem resultado | Buscar `zzz` · **Filtrar** | "Nenhum evento encontrado"; **Limpar filtros** volta à lista completa |
| HIS6 | Detalhes legíveis | Evento de reserva | Datas como `DD/MM/AAAA HH:mm`; séries como "Série #N" (item 38) |

---

## Regressão transversal

### Selects e diálogos

| # | Onde testar | Dados / ação | Resultado esperado |
|---|-------------|--------------|-------------------|
| X1 | Setor em "Nova sala", Profissional em "Nova ausência", Setor/Sala/Solicitante em "Nova reserva" | Perfil D · abrir o select · rolar com a **roda do mouse** | A lista rola; a página e o diálogo por trás não se mexem |
| X2 | Qualquer select com busca | Digitar sem acento e em maiúsculas (`AMBULATORIO`) | Encontra `Ambulatório` |
| X3 | Qualquer select com busca | Digitar `zzz` | "Nenhum resultado encontrado." |
| X4 | Qualquer select | Abrir a lista | A primeira opção ("Selecione …") aparece desabilitada (item 12) |
| X5 | Select aberto dentro de um diálogo | Pressionar **Esc** uma vez | Fecha só a lista; o diálogo continua aberto |
| X6 | Atalhos "Ir para …" nos diálogos | Perfil A · clicar o atalho | Navega para a tela certa e fecha o diálogo |
| X7 | Campos obrigatórios | Abrir qualquer formulário | Rótulos obrigatórios com "(obrigatório)" |

### Sessão, erros e navegação

| # | Cenário | Dados / ação | Resultado esperado |
|---|---------|--------------|-------------------|
| X8 | Sessão expirada | DevTools → Application → Cookies → alterar o valor de `gdsToken` · trocar de tela | Aviso de sessão expirada e volta para `/login`; depois de entrar de novo, nada da sessão anterior aparece (item 3) |
| X9 | Backend fora do ar | Parar o backend · abrir Setores, Salas e Solicitantes | Cada tela mostra erro com **Tentar novamente**, sem texto em inglês (item 21) |
| X10 | Página inexistente | Abrir `http://localhost:5173/qualquer-coisa` | "Página não encontrada" com **Voltar para o início** (item 6) |
| X11 | Andamento | Qualquer ação com o backend lento | Barra de progresso no topo; se passar de 3 segundos, aviso de servidor iniciando (itens 1 e 8) |
| X12 | Menu | Clicar em cada item do menu | Cada tela abre com título próprio e o item fica marcado |
| X13 | Console | Durante todo o roteiro | Console sem erros vermelhos |

---

## Matriz rápida por URL

| URL | Menu | Foco principal |
|-----|------|----------------|
| `http://localhost:5173/login` | — | Login |
| `http://localhost:5173/cadastro` | — | Cadastro de usuário |
| `http://localhost:5173/calendar` | Calendário | Mês com reservas e ausências, nova reserva pelo dia |
| `http://localhost:5173/sections` | Setores | Cadastro de setores |
| `http://localhost:5173/rooms` | Salas | Cadastro, resumo e filtros |
| `http://localhost:5173/requester` | Solicitante | Cadastro e busca de solicitantes |
| `http://localhost:5173/reservation` | Reservas | Listagem, nova reserva e cancelamentos |
| `http://localhost:5173/absences` | Ausências | Ausências e férias |
| `http://localhost:5173/historico` | Histórico | Auditoria com filtros |

---

## Checklist final

- [ ] Autenticação: L1–L7, cadastro C1–C9 e saída S1–S2
- [ ] Perfil A: estados vazios e atalhos "Ir para …"
- [ ] Perfil B: Kit B completo até a reserva aparecer em `/reservation` e no calendário
- [ ] Perfil C: filtros, recorrência, cancelamentos, ausência no calendário e reserva da noite no dia certo
- [ ] Perfil D: "+N mais" e rolagem com a roda do mouse nos selects dentro dos diálogos
- [ ] Sessão expirada, backend fora do ar e página inexistente
- [ ] Console limpo durante todo o roteiro
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` sem erros
