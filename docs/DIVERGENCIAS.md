# Divergências em relação ao frontend Angular

A reescrita preserva o contrato HTTP com o backend e as regras de negócio das telas. Aparência
e organização foram redesenhadas livremente. Este documento lista o que **muda de
comportamento** para o usuário ou para o backend, para que cada diferença seja conhecida e
possa ser revertida se necessário.

Cada item traz o comportamento do Angular, o novo comportamento e o motivo.

---

## Geral

### 1. O aquecimento do backend não bloqueia a abertura do app

**Angular:** o `APP_INITIALIZER` chama `GET health` e só renderiza o app quando a chamada
termina, sem limite de tempo. Num cold start lento, o usuário fica com a tela em branco.

**Agora:** o `GET health` é disparado ao abrir o app, sem bloquear a renderização. A barra de
progresso e o aviso de "servidor iniciando" aparecem enquanto ele não responde. Falhas são
silenciosas, como antes.

### 2. Um único aviso de erro por falha, com a mensagem do backend primeiro

**Angular:** o interceptor mostra um aviso com a mensagem do backend (ou um texto genérico) e,
em algumas telas, o componente mostra um segundo aviso com um texto próprio, no estilo de
sucesso. Ex.: falhar ao excluir um setor mostrava dois avisos.

**Agora:** cada falha gera um único aviso, no estilo de erro: dentro do formulário ou diálogo
para envios e exclusões (item 13), no canto da tela nos demais casos. Ele mostra a mensagem do backend
quando apresentável; senão, o texto próprio da ação (ex.: "Não foi possível remover o
setor."), e só na falta dele o genérico "Não foi possível concluir a operação.". A regra de
quais mensagens do backend podem aparecer é a mesma (`getHttpErrorMessage`).

Consultas auxiliares, como as contagens do resumo de Salas e o aquecimento do backend, não
geram aviso.

### 3. Sessão expirada volta ao login sem recarregar a página

**Angular:** o 401 mostra o aviso e navega para `/login`.

**Agora:** igual, e além disso descarta os dados em cache, para nada da sessão anterior
aparecer depois de um novo login.

### 4. Sair apaga só o token

**Angular:** "Sair" e a abertura do login apagam **todos** os cookies do domínio.

**Agora:** apagam apenas o cookie `gdsToken`, que é o único que o sistema usa para a sessão.
Preferências de interface (ex.: menu recolhido) são mantidas.

### 5. Dados em cache por 30 segundos

**Angular:** toda visita a uma tela ou troca de filtro refaz a requisição.

**Agora:** o resultado de cada consulta fica em cache por 30 segundos. Voltar a uma página ou
filtro recém-visto mostra o resultado guardado, sem nova requisição. Qualquer criação,
edição ou exclusão invalida o cache correspondente e força a recarga. Não há recarga ao
voltar o foco para a janela nem retentativa automática, como antes.

### 6. Página 404

**Angular:** não havia rota coringa; um endereço desconhecido não levava a lugar nenhum.

**Agora:** endereços desconhecidos mostram uma página "Página não encontrada" com link para o
início.

### 7. Migração concluída: sem telas "em breve"

Durante a migração por etapas, as telas ainda não migradas mostravam uma página de "em breve" com
link para a mesma tela no Angular. Com todas as telas migradas, essa página e a variável
`VITE_LEGACY_APP_URL` foram removidas. Cada item do menu precisa ter sua tela em
`src/app/AppRoutes.tsx`, o que a checagem de tipos exige, e um teste em
`src/app/AppRoutes.test.tsx` abre cada uma delas.

### 8. Aviso de "servidor iniciando" também no login

**Angular:** o aviso só aparecia dentro do sistema.

**Agora:** aparece também em `/login` e `/cadastro`, onde o cold start costuma acontecer.

## Formulários

### 9. Botão de enviar habilitado; erros mostrados ao sair do campo ou ao enviar

**Angular:** os botões "Entrar", "Cadastre-se" e "Salvar" ficam desabilitados até o
formulário ser válido, sem dizer o que falta.

**Agora:** os botões ficam habilitados. Ao enviar com campos inválidos, nada é enviado ao
backend e as mensagens aparecem em cada campo (também ao sair de um campo já tocado). As
mensagens são as mesmas do Angular. Os botões ficam desabilitados apenas enquanto a
requisição está em andamento.

### 10. Cadastro: nome aparado e mensagens específicas para a data de nascimento

**Angular:** o nome era enviado como digitado, e qualquer problema na data de nascimento
mostrava "Informe a data.".

**Agora:** o nome é aparado e um nome só com espaços é recusado no próprio formulário (o
backend já recusava). A data mostra "Informe a data." quando vazia, "Informe a data no formato
DD/MM/AAAA." quando incompleta e "Data inválida." quando inexistente ou futura. A regra em si
não mudou.

### 11. Mensagem de setor obrigatório

**Angular:** "Selecione Setor.". **Agora:** "Selecione o setor.".

### 12. Campos obrigatórios sinalizados, placeholders e opção inicial desabilitada nos selects

**Angular:** nada indicava quais campos eram obrigatórios antes de enviar.

**Agora:** campos obrigatórios mostram "(obrigatório)" ao lado do rótulo e têm
`aria-required`. Todos os campos de texto têm placeholder, e todo select começa com uma opção
desabilitada ("Selecione o setor", "Selecione o status", "Itens por página"), no padrão dos
projetos conos e sost-dashboard-acidente.

### 13. Erros de envio aparecem dentro do formulário; avisos com cor de sucesso e de erro

**Angular:** falhas de login, cadastro, salvar e excluir apareciam só num aviso passageiro no
canto da tela, fácil de não ver. Avisos de sucesso e de erro tinham o mesmo visual. O cadastro
concluído avisava no canto e levava ao login sem nenhuma indicação na tela.

**Agora:**

- A falha de uma ação que o usuário está aguardando aparece em destaque vermelho dentro do
  próprio formulário ou diálogo: login ("CPF ou senha incorretos. Tente novamente.", sem dizer
  se o erro foi no CPF ou na senha), cadastro, salvar setor ou sala e confirmação de exclusão.
  A mensagem é anunciada por leitores de tela e fica visível até o usuário alterar algum campo,
  tentar de novo ou reabrir o diálogo. Nesses casos não há aviso no canto, para não duplicar.
- A sessão expirada (401) continua com aviso no canto e volta ao login, como no item 3.
- O login mostra "Cadastro realizado. Faça login com seu CPF e senha." em verde, logo abaixo
  do título, quando chega do cadastro.
- Os avisos no canto usam verde para sucesso e vermelho para erro.

## Salas

### 14. Filtros aplicados na hora

**Angular:** era preciso clicar em "Buscar" depois de escolher setor ou status.

**Agora:** a lista é atualizada ao escolher o filtro, voltando para a primeira página. Um botão
"Limpar filtros" aparece quando há filtro ativo.

### 15. Excluir o último item da última página volta para a página anterior

**Angular:** a página atual continuava a mesma e, vazia, mostrava "Nenhuma sala cadastrada",
mesmo havendo salas nas páginas anteriores.

**Agora:** se a página atual deixar de existir, a tela vai para a última página disponível.
Coberto por teste de regressão em `src/features/rooms/rooms.test.tsx`.

### 16. Faixa de resumo com total, ocupadas e livres

Nova no topo da tela. Usa parâmetros que o contrato já tem, sem mudança no backend: três
chamadas `GET room?page=0&size=1` (sem `ocupada`, com `ocupada=true` e com `ocupada=false`),
lendo `page.totalElements`. O resumo considera todas as salas, independente dos filtros da
tabela.

### 17. Aviso de sucesso ao salvar sala

**Angular:** criar ou editar sala fechava o diálogo sem aviso.

**Agora:** mostra "Sala salva com sucesso.", como já acontecia em Setores.

### 18. Estado vazio distingue filtro sem resultado

**Angular:** sempre "Nenhuma sala cadastrada".

**Agora:** sem filtros, continua "Nenhuma sala cadastrada"; com filtros, "Nenhuma sala
encontrada", com a opção de limpar os filtros.

### 19. Formulário de sala avisa quando os setores não carregam

**Angular:** se a lista de setores falhasse, o select de setor do diálogo ficava vazio.

**Agora:** o diálogo mostra "Não foi possível carregar os setores." com o botão "Tentar
novamente", em vez de pedir para cadastrar um setor. Coberto por teste de regressão em
`src/features/rooms/rooms.test.tsx`.

## Setores

### 20. Setor com salas não pode ser excluído pela tela

**Angular:** a exclusão de um setor era confirmada sem verificação. O backend aceita e
desativa em cascata todas as salas do setor, sem avisar o usuário.

**Agora:** ao abrir a confirmação, a tela consulta quantas salas o setor tem
(`GET room/section/{id}?page=0&size=1`, lendo `page.totalElements`) e mostra "Verificando se o
setor tem salas…" enquanto isso. Se houver salas, o botão "Excluir" fica desabilitado, com o
aviso "Este setor tem N salas. Exclua as salas deste setor antes de excluir o setor." e o
atalho "Ver salas do setor", que abre Salas já filtrada por aquele setor. Se a consulta falhar,
a exclusão também fica bloqueada, com o botão "Tentar novamente". O backend não mudou: a regra
vale só para a tela.

Para o atalho funcionar, o filtro de setor de Salas passou a ficar no endereço
(`/rooms?setor=ID`). Um `setor` inválido ou de um setor inexistente é ignorado e a lista mostra
todos os setores. Coberto por testes em `src/features/sections/sections.test.tsx` e
`src/features/rooms/rooms.test.tsx`.

## Idioma

### 21. Mensagens sempre em português

**Angular:** quando o backend ou a infraestrutura devolviam um texto em inglês (ex.: "Access
Denied" no 403, "Internal Server Error", páginas de erro da hospedagem), ele aparecia para o
usuário como estava.

**Agora:** textos de sistema em inglês nunca são mostrados; no lugar deles aparece o texto
próprio da ação ou o genérico do item 2. O 403 mostra "Você não tem permissão para realizar esta
ação.", a menos que o backend mande uma mensagem em português. As mensagens padrão de validação
e os textos para leitores de tela (ex.: "Fechar", "Alternar menu lateral", "Notificações")
também estão em português.

## Solicitantes

### 22. A busca só vale depois de enviada, inclusive ao paginar

**Angular:** a busca era aplicada ao pressionar Enter ou clicar em "Buscar", mas trocar de
página ou de quantidade por página usava o termo que estivesse digitado, mesmo sem ter sido
enviado.

**Agora:** a lista usa sempre o último termo enviado. O botão mostra "Buscando…" enquanto a
resposta não chega, e "Limpar busca" aparece quando há busca ativa. A busca continua sendo feita
ao enviar, não a cada tecla, para não gerar uma requisição por letra.

### 23. Validação de nome, especialidade e telefone

**Angular:** nome ou especialidade só com espaços passavam; na edição, o backend mantinha o
valor antigo sem avisar. O telefone usava sempre a máscara de celular, e um número incompleto era
enviado assim mesmo.

**Agora:** nome e especialidade são aparados, e só espaços é recusado com "Informe o nome." ou
"Informe a especialidade.". O telefone continua opcional; quando preenchido, aceita fixo
`(00) 0000-0000` ou celular `(00) 00000-0000`, e um número incompleto mostra "Informe um telefone
com DDD (10 ou 11 dígitos).". Vazio é enviado como `null`, como antes.

### 24. Edição acessível, título e aviso de sucesso

**Angular:** o ícone de editar não era um botão, então não funcionava pelo teclado. O diálogo se
chamava "Cadastro de Solicitante" também na edição, e salvar não dava aviso.

**Agora:** editar e excluir são botões com nome acessível ("Editar solicitante Ana"). O diálogo
se chama "Novo solicitante" ou "Editar solicitante", e salvar mostra "Solicitante salvo com
sucesso.".

### 25. Exclusão: cancelar sem erro e volta de página

**Angular:** cancelar a confirmação gerava um erro de execução no console. Excluir o último item
da última página deixava a tela vazia, como em Salas antes do item 15.

**Agora:** cancelar apenas fecha a confirmação. A falha aparece dentro dela (item 13), e excluir o
último item da última página volta para a página anterior. Coberto por testes em
`src/features/requesters/requesters.test.tsx`.

## Ausências

### 26. Datas digitadas no formato DD/MM/AAAA

**Angular:** as datas usavam o seletor nativo do navegador (`type="date"`), que muda de aparência
e de formato conforme o navegador.

**Agora:** as datas são digitadas com a máscara `DD/MM/AAAA`, como a data de nascimento do
cadastro, com as mesmas mensagens ("Informe a data de início.", "Informe a data no formato
DD/MM/AAAA.", "Data inválida."). O envio continua em `AAAA-MM-DD`.

### 27. Fim antes do início e falta de profissionais são avisados

**Angular:** com início depois do fim, ou sem nenhum profissional cadastrado, "Salvar" não fazia
nada e não mostrava mensagem.

**Agora:** fim antes do início mostra "A data de fim deve ser igual ou posterior à data de
início." no campo de fim, sem enviar nada. Sem profissionais, o diálogo mostra "Cadastre um
solicitante antes de registrar ausências." com o link "Ir para Solicitantes", e "Salvar" fica
desabilitado. Se a lista de profissionais falhar, aparece "Não foi possível carregar os
profissionais." com "Tentar novamente".

### 28. Profissional inativo continua visível na edição

**Angular:** ao editar a ausência de um profissional excluído (inativo), o campo aparecia vazio,
porque o select só lista os ativos.

**Agora:** o profissional da ausência entra como opção com o nome gravado nela, e a ausência pode
ser salva sem trocar de profissional.

### 29. Lista ordenada e avisos próprios

**Angular:** a lista vinha na ordem do backend, sem critério. Salvar mostrava "Registro salvo com
sucesso.".

**Agora:** a lista é ordenada pelo início, da mais recente para a mais antiga, e depois pelo nome
do profissional. Salvar mostra "Ausência salva com sucesso."; excluir continua mostrando
"Ausência removida.", e a falha aparece dentro da confirmação (item 13). Como uma ausência muda
quais salas contam como livres hoje, salvar ou excluir também recarrega os dados de Salas.
Coberto por testes em `src/features/absences/absences.test.tsx`.

## Reservas

### 30. Período padrão no horário local e aplicado só ao enviar

**Angular:** o período padrão (hoje a hoje + 30) era calculado em UTC, então depois das 21h
começava no dia seguinte. A paginação usava o período digitado mesmo sem ter sido enviado, e depois
de cancelar a lista voltava para o período e o tamanho de página fixos, ignorando o filtro do
usuário. Um período inválido fazia "Buscar" não fazer nada, sem mensagem.

**Agora:** o período padrão usa o horário local. A lista usa sempre o último período enviado,
inclusive ao paginar e ao recarregar depois de cancelar. "Buscar" mostra "Buscando…" enquanto a
resposta não chega. Datas inválidas mostram as mensagens do item 26, e fim antes do início mostra
"A data final deve ser igual ou posterior à data inicial.".

### 31. Nova reserva começa como Pontual

**Angular:** o diálogo abria com "Recorrente" marcado, e quem queria uma reserva única precisava
lembrar de trocar.

**Agora:** o tipo começa como "Pontual", que pede só "Data da reserva". "Recorrente" pede "Data de
início", "Data de fim" e os dias da semana. O campo de quem vai usar a sala se chama "Solicitante",
como a coluna da tabela, e não mais "Responsável".

### 32. Validação completa antes de enviar

**Angular:** horário de fim antes do início e recorrência sem dias eram enviados ao backend, que
respondia com erro genérico ou com "Nenhuma reserva foi criada!".

**Agora:** o formulário mostra todos os erros juntos, sem enviar nada: "O horário de fim deve ser
posterior ao início.", "A data de fim deve ser igual ou posterior à data de início.", "Selecione ao
menos um dia da semana." e "Nenhum dos dias escolhidos cai dentro do período.".

### 33. Sala carregada pelo setor, com andamento, falha e lista vazia

**Angular:** uma falha ao carregar as salas do setor aparecia como "Nenhuma sala cadastrada.".

**Agora:** a sala fica desabilitada com "Selecione o setor primeiro" até haver setor, mostra
"Carregando salas..." durante a carga e é limpa ao trocar de setor. A falha mostra "Não foi possível
carregar as salas deste setor." com "Tentar novamente"; um setor sem salas mostra "Nenhuma sala
neste setor." com o link "Ir para Salas" já filtrado pelo setor. Setores e solicitantes têm os
mesmos avisos.

### 34. Salvar mostra andamento e não envia duas vezes

**Angular:** salvar não mostrava andamento, e um clique duplo enviava a reserva duas vezes; a
segunda voltava como conflito de horário. Não havia aviso de sucesso.

**Agora:** o botão mostra "Salvando…" e um segundo clique é ignorado até a resposta. O conflito
("Já existe uma reserva para esta sala no horário solicitado!") aparece dentro do diálogo, que
continua aberto. Criar mostra "Reserva criada com sucesso." e recarrega as reservas e a ocupação
das salas.

### 35. Cancelamento pelo teclado, com uma única confirmação

**Angular:** o ícone de cancelar não funcionava pelo teclado, e fechar a confirmação simples
gerava um erro de execução. Numa reserva recorrente, a confirmação tinha três botões. Não havia
aviso de sucesso.

**Agora:** cancelar é um botão com nome acessível ("Cancelar reserva de Sala 01 em 01/10/2026
08:00"). A confirmação tem "Voltar", que só fecha, e um único botão de confirmar. Numa reserva
recorrente, ela pergunta o que cancelar: "Só esta reserva" (padrão) ou "Toda a série (inclusive
datas que já passaram)". A falha aparece dentro da confirmação (item 13), e o sucesso mostra
"Reserva cancelada." ou "Série cancelada.". Cancelar o último item da última página volta para a
página anterior, mantendo o período. Coberto por testes em
`src/features/reservations/reservations.test.tsx`.

## Histórico

### 36. Filtros aplicados só em "Filtrar", inclusive ao paginar

**Angular:** trocar de página usava os filtros digitados mesmo sem "Filtrar", e a tabela piscava
o esqueleto a cada troca de página.

**Agora:** todos os filtros valem só depois de "Filtrar", que mostra "Filtrando…". A paginação usa
sempre os filtros aplicados, e a página anterior continua na tela, esmaecida, enquanto a próxima
carrega. "Limpar filtros" aparece quando há filtro aplicado. "De" e "Até" são opcionais, digitados
como `DD/MM/AAAA`, e Até antes de De mostra "A data final deve ser igual ou posterior à data
inicial.". O histórico é sempre consultado de novo ao abrir a tela.

### 37. Busca descreve o que realmente encontra

**Angular:** o placeholder "Usuário, ação ou entidade" sugeria buscar por "Criação de sala", mas o
backend só compara o nome de quem fez a ação, os códigos internos (`room.create`) e o número do
registro.

**Agora:** o placeholder é "Ex.: Maria ou 42", com a dica "Busque pelo nome de quem fez a ação ou
pelo número do registro". Ação e entidade continuam nos selects.

### 38. Detalhes e entidade legíveis

**Angular:** os detalhes repetiam rótulos ("Sala: 5 · Sala: Consultório 5"), mostravam datas cruas
(`2026-10-05T08:00:00`) e chaves como `role`. Uma série aparecia como "Reserva #N", embora o número
fosse o da série.

**Agora:** o número é omitido quando o nome também veio e aparece como `#5` quando não veio. Datas
aparecem como `DD/MM/AAAA` ou `DD/MM/AAAA HH:mm`, e `role` vira "Perfil" (Administrador ou Básico).
Eventos de série aparecem como "Série #N". Códigos desconhecidos continuam aparecendo como vieram.

### 39. Um único aviso de erro

**Angular:** uma falha ao carregar aparecia duas vezes: no toast e no aviso da tabela.

**Agora:** uma falha ao carregar mostra só o aviso da tabela, com "Tentar novamente", sem o toast
repetindo a mesma mensagem (item 2). A sessão expirada continua levando ao login. Coberto por
testes em `src/features/audit/history.test.tsx`.

## Calendário

### 40. Reservas da noite no dia certo

**Angular:** o dia de cada reserva vinha de `toISOString`, em UTC. No horário de Brasília, uma
reserva a partir das 21h aparecia no dia seguinte.

**Agora:** o dia e o horário são lidos do texto que o backend manda, já no horário local, sem
conversão de fuso.

### 41. Nenhuma reserva fica de fora do mês

**Angular:** o calendário pedia no máximo 1000 reservas para as 6 semanas visíveis e ignorava o
restante sem avisar. Só os próximos 30 dias já chegaram a ter 883 reservas.

**Agora:** a primeira página (500 reservas) informa quantas existem, e as demais páginas são
buscadas em paralelo. O mês mostra todas as reservas do período.

### 42. Carregamento e falha visíveis

**Angular:** não havia indicação de carregamento, e uma falha deixava o calendário vazio, como se
não houvesse reservas.

**Agora:** a primeira carga mostra os dias com esqueletos no lugar dos eventos. Ao trocar de mês ou
de setor, a grade atual fica esmaecida e aparece "Carregando…" até a resposta. A falha mostra "Não
foi possível carregar as reservas deste período." ou "Não foi possível carregar as ausências.",
cada uma com "Tentar novamente"; se só as ausências falharem, as reservas continuam na tela. Como
a mensagem fica na própria tela, essas falhas não geram também o aviso no canto. A sessão
expirada continua levando ao login.

### 43. "Reserva Rápida" vira "Nova reserva", também pelo dia

**Angular:** um formulário fixo acima do calendário criava só reservas pontuais, com o campo
"Responsável". Depois de salvar, a página inteira era recarregada, e as falhas não apareciam para o
usuário.

**Agora:** o botão "Nova reserva" abre o mesmo diálogo da tela Reservas, já com a data de hoje.
Clicar no número de um dia abre o diálogo com a data daquele dia. Com um setor filtrado, ele já vem
escolhido. Valem as mesmas validações, avisos e mensagens dos itens 31 a 34. Salvar atualiza o
calendário sem recarregar a página.

### 44. Filtro por setor

**Angular:** o calendário mostrava sempre as reservas de todos os setores, cerca de 30 por dia.

**Agora:** um filtro "Setor", que começa em "Todos os setores", mostra só as reservas do setor
escolhido. As ausências continuam aparecendo sempre, porque pertencem ao solicitante e não a um
setor.

### 45. Eventos legíveis e acessíveis

**Angular:** o título do evento cortava o nome do setor em 9 caracteres ("Ambulatór..."), e o
excesso de eventos num dia era resolvido pelo FullCalendar.

**Agora:** cada dia mostra até 3 linhas. Com mais eventos, a última vira "+N mais", que abre a lista
completa do dia sem esticar a semana: o total de eventos fica no topo e cada linha traz o horário de
início e fim, a sala com o setor e o tipo. O evento mostra o horário de início e a sala, e o nome acessível e a dica trazem
tudo: horário de início e fim, sala, setor e tipo. As cores e a legenda são as mesmas, e o tipo
também aparece no texto e, nas recorrentes, num ícone, para não depender só da cor. Os detalhes
seguem o Angular: Solicitante, Criado por (em reservas) e Horário ou Período. Coberto por testes em
`src/features/calendar/`.
