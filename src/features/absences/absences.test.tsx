import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Requester } from "@/features/requesters/types";
import { roomKeys } from "@/features/rooms/query-keys";
import { GENERIC_ERROR_MESSAGE } from "@/lib/api/error-handler";
import { ABSENCE_SAVED_MESSAGE, REQUESTERS_LOAD_ERROR_MESSAGE } from "./AbsenceFormDialog";
import { ABSENCE_DELETED_MESSAGE } from "./AbsencesPage";
import { ABSENCE_ERROR_MESSAGES } from "./hooks";
import { END_BEFORE_START_MESSAGE } from "./schemas";
import type { Absence } from "./types";

const REQUESTERS: Requester[] = [
	{ id: 1, nome: "Ana Souza", especialidade: "Cardiologia" },
	{ id: 2, nome: "Bruno Lima", especialidade: "Pediatria" },
];

/** Fora de ordem, como o backend pode devolver; a 12 é de um profissional inativo. */
const ABSENCES: Absence[] = [
	{
		id: 10,
		solicitanteId: 1,
		solicitanteNome: "Ana Souza",
		dataInicio: "2026-01-05",
		dataFim: "2026-01-10",
	},
	{
		id: 11,
		solicitanteId: 2,
		solicitanteNome: "Bruno Lima",
		dataInicio: "2026-03-01",
		dataFim: "2026-03-15",
	},
	{
		id: 12,
		solicitanteId: 9,
		solicitanteNome: "Carla Inativa",
		dataInicio: "2025-12-20",
		dataFim: "2025-12-31",
	},
];

function mockBackend({
	absences = ABSENCES,
	requesters = REQUESTERS,
}: {
	absences?: Absence[];
	requesters?: Requester[];
} = {}) {
	let current = [...absences];
	const writes: { method: string; url: string; body?: unknown }[] = [];
	const requesterRequests: string[] = [];

	server.use(
		http.get(apiUrl("requester"), ({ request }) => {
			requesterRequests.push(new URL(request.url).search);
			return HttpResponse.json(requesters);
		}),
		http.get(apiUrl("requester-absence"), () => HttpResponse.json(current)),
		http.post(apiUrl("requester-absence"), async ({ request }) => {
			const body = (await request.json()) as Omit<Absence, "id" | "solicitanteNome">;
			writes.push({ method: "POST", url: request.url, body });
			const created = { id: 100, solicitanteNome: "Novo", ...body };
			current = [...current, created];
			return HttpResponse.json(created, { status: 201 });
		}),
		http.put(apiUrl("requester-absence/:id"), async ({ request }) => {
			const body = await request.json();
			writes.push({ method: "PUT", url: request.url, body });
			return HttpResponse.json(body);
		}),
		http.delete(apiUrl("requester-absence/:id"), ({ request, params }) => {
			writes.push({ method: "DELETE", url: request.url });
			current = current.filter((item) => item.id !== Number(params.id));
			return new HttpResponse(null, { status: 204 });
		}),
	);

	return { writes, requesterRequests };
}

const renderAbsences = () => renderApp("/absences", { authenticated: true });

const professionalColumn = () =>
	screen
		.getAllByRole("row")
		.slice(1)
		.map((row) => within(row).getAllByRole("cell")[0]?.textContent);

async function fillDates(
	user: ReturnType<typeof renderApp>["user"],
	dialog: HTMLElement,
	start: string,
	end: string,
) {
	await user.type(within(dialog).getByLabelText("Data de início (obrigatório)"), start);
	await user.type(within(dialog).getByLabelText("Data de fim (obrigatório)"), end);
}

async function openNewAbsence(user: ReturnType<typeof renderApp>["user"]) {
	await screen.findByRole("cell", { name: "Ana Souza" });
	await user.click(screen.getByRole("button", { name: "Nova ausência" }));
	return screen.findByRole("dialog", { name: "Nova ausência" });
}

describe("Ausências", () => {
	// Regressão: no Angular, a lista vinha na ordem do backend, sem critério.
	it("lista da mais recente para a mais antiga, com datas DD/MM/AAAA", async () => {
		const backend = mockBackend();
		renderAbsences();

		await screen.findByRole("cell", { name: "Ana Souza" });
		expect(professionalColumn()).toEqual(["Bruno Lima", "Ana Souza", "Carla Inativa"]);

		const firstRow = screen.getByRole("cell", { name: "Bruno Lima" }).closest("tr") as HTMLElement;
		expect(within(firstRow).getByText("01/03/2026")).toBeInTheDocument();
		expect(within(firstRow).getByText("15/03/2026")).toBeInTheDocument();
		// Acima e abaixo da tabela.
		expect(screen.getAllByText("3 ausências")).toHaveLength(2);
		expect(backend.requesterRequests).toEqual(["?unpaged=true"]);
	});

	it("cadastra com datas ISO e solicitanteId numérico", async () => {
		const backend = mockBackend();
		const { user } = renderAbsences();
		const dialog = await openNewAbsence(user);

		await user.click(within(dialog).getByRole("combobox", { name: "Profissional (obrigatório)" }));
		expect(await screen.findByRole("listbox", { name: "Sugestões" })).toBeInTheDocument();
		await user.click(await screen.findByRole("option", { name: "Bruno Lima - Pediatria" }));
		await fillDates(user, dialog, "05012026", "10012026");
		expect(within(dialog).getByLabelText("Data de início (obrigatório)")).toHaveValue("05/01/2026");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(ABSENCE_SAVED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([
			{
				method: "POST",
				url: apiUrl("requester-absence"),
				body: { solicitanteId: 2, dataInicio: "2026-01-05", dataFim: "2026-01-10" },
			},
		]);
		expect(await screen.findAllByText("4 ausências")).toHaveLength(2);
	});

	// Regressão: no Angular, início depois do fim fazia o "Salvar" não fazer nada, sem mensagem.
	it("avisa quando o fim é anterior ao início e não envia nada", async () => {
		const backend = mockBackend();
		const { user } = renderAbsences();
		const dialog = await openNewAbsence(user);

		await user.click(within(dialog).getByRole("combobox", { name: "Profissional (obrigatório)" }));
		await user.click(await screen.findByRole("option", { name: "Ana Souza - Cardiologia" }));
		await fillDates(user, dialog, "10012026", "05012026");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByText(END_BEFORE_START_MESSAGE)).toBeInTheDocument();
		expect(within(dialog).getByLabelText("Data de fim (obrigatório)")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(backend.writes).toEqual([]);
	});

	it("valida os campos obrigatórios sem chamar o backend", async () => {
		const backend = mockBackend();
		const { user } = renderAbsences();
		const dialog = await openNewAbsence(user);

		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByText("Selecione o profissional.")).toBeInTheDocument();
		expect(within(dialog).getByText("Informe a data de início.")).toBeInTheDocument();
		expect(within(dialog).getByText("Informe a data de fim.")).toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	it("edita com o formulário preenchido, via PUT", async () => {
		const backend = mockBackend();
		const { user } = renderAbsences();

		await user.click(
			await screen.findByRole("button", {
				name: "Editar ausência de Ana Souza (05/01/2026 a 10/01/2026)",
			}),
		);
		const dialog = await screen.findByRole("dialog", { name: "Editar ausência" });
		expect(
			within(dialog).getByRole("combobox", { name: "Profissional (obrigatório)" }),
		).toHaveTextContent("Ana Souza - Cardiologia");
		expect(within(dialog).getByLabelText("Data de início (obrigatório)")).toHaveValue("05/01/2026");

		const end = within(dialog).getByLabelText("Data de fim (obrigatório)");
		await user.clear(end);
		await user.type(end, "12012026");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(ABSENCE_SAVED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([
			{
				method: "PUT",
				url: apiUrl("requester-absence/10"),
				body: { solicitanteId: 1, dataInicio: "2026-01-05", dataFim: "2026-01-12" },
			},
		]);
	});

	// Regressão: no Angular, a ausência de um profissional inativo abria com o campo vazio.
	it("mantém o profissional inativo ao editar a ausência dele", async () => {
		const backend = mockBackend();
		const { user } = renderAbsences();

		await user.click(
			await screen.findByRole("button", {
				name: "Editar ausência de Carla Inativa (20/12/2025 a 31/12/2025)",
			}),
		);
		const dialog = await screen.findByRole("dialog", { name: "Editar ausência" });
		expect(
			within(dialog).getByRole("combobox", { name: "Profissional (obrigatório)" }),
		).toHaveTextContent("Carla Inativa");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		await screen.findByText(ABSENCE_SAVED_MESSAGE);
		expect(backend.writes[0]?.body).toEqual({
			solicitanteId: 9,
			dataInicio: "2025-12-20",
			dataFim: "2025-12-31",
		});
	});

	// Regressão: no Angular, sem profissionais cadastrados o "Salvar" não fazia nada.
	it("orienta a cadastrar um solicitante quando não há profissionais", async () => {
		const backend = mockBackend({ requesters: [] });
		const { user, location } = renderAbsences();
		const dialog = await openNewAbsence(user);

		expect(await within(dialog).findByText(/Cadastre um solicitante/)).toBeInTheDocument();
		expect(within(dialog).getByRole("button", { name: "Salvar" })).toBeDisabled();
		expect(
			within(dialog).getByRole("combobox", { name: "Profissional (obrigatório)" }),
		).toBeDisabled();

		await user.click(within(dialog).getByRole("link", { name: "Ir para Solicitantes" }));
		await waitFor(() => expect(location()).toBe("/requester"));
		expect(backend.writes).toEqual([]);
	});

	it("avisa quando os profissionais não carregam e permite tentar de novo", async () => {
		mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("requester"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderAbsences();
		const dialog = await openNewAbsence(user);

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			REQUESTERS_LOAD_ERROR_MESSAGE,
		);
		expect(within(dialog).queryByText(/Cadastre um solicitante/)).not.toBeInTheDocument();

		await user.click(within(dialog).getByRole("button", { name: "Tentar novamente" }));

		await waitFor(() => expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument());
		expect(
			within(dialog).getByRole("combobox", { name: "Profissional (obrigatório)" }),
		).toBeEnabled();
	});

	it("mostra o erro ao salvar dentro do formulário, que continua aberto", async () => {
		const backend = mockBackend();
		server.use(
			http.put(apiUrl("requester-absence/:id"), () =>
				HttpResponse.json({ message: "Ausência não encontrada: 10" }, { status: 404 }),
			),
		);
		const { user } = renderAbsences();

		await user.click(
			await screen.findByRole("button", {
				name: "Editar ausência de Ana Souza (05/01/2026 a 10/01/2026)",
			}),
		);
		const dialog = await screen.findByRole("dialog", { name: "Editar ausência" });
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Ausência não encontrada: 10",
		);
		expect(screen.queryByText(ABSENCE_SAVED_MESSAGE)).not.toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	it("invalida as salas depois de salvar", async () => {
		mockBackend();
		const { user, queryClient } = renderAbsences();
		queryClient.setQueryData(roomKeys.count(null), 10);

		await user.click(
			await screen.findByRole("button", {
				name: "Editar ausência de Ana Souza (05/01/2026 a 10/01/2026)",
			}),
		);
		const dialog = await screen.findByRole("dialog", { name: "Editar ausência" });
		expect(queryClient.getQueryState(roomKeys.count(null))?.isInvalidated).toBe(false);
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		await screen.findByText(ABSENCE_SAVED_MESSAGE);
		expect(queryClient.getQueryState(roomKeys.count(null))?.isInvalidated).toBe(true);
	});

	it("exclui após confirmação", async () => {
		const backend = mockBackend();
		const { user } = renderAbsences();

		await user.click(
			await screen.findByRole("button", {
				name: "Excluir ausência de Bruno Lima (01/03/2026 a 15/03/2026)",
			}),
		);
		const confirm = await screen.findByRole("alertdialog", {
			name: "Excluir a ausência de “Bruno Lima”?",
		});
		expect(within(confirm).getByText(/Período de 01\/03\/2026 a 15\/03\/2026/)).toBeInTheDocument();
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await screen.findByText(ABSENCE_DELETED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "DELETE", url: apiUrl("requester-absence/11") }]);
		expect(await screen.findAllByText("2 ausências")).toHaveLength(2);
	});

	// Regressão: no Angular, a falha na exclusão aparecia num aviso com estilo de sucesso.
	it("mostra o erro da exclusão dentro da confirmação", async () => {
		mockBackend();
		server.use(
			http.delete(apiUrl("requester-absence/:id"), () => new HttpResponse(null, { status: 500 })),
		);
		const { user } = renderAbsences();

		await user.click(
			await screen.findByRole("button", {
				name: "Excluir ausência de Bruno Lima (01/03/2026 a 15/03/2026)",
			}),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(
			ABSENCE_ERROR_MESSAGES.remove,
		);
		expect(screen.queryByText(ABSENCE_DELETED_MESSAGE)).not.toBeInTheDocument();
	});

	it("mostra o estado vazio com ação de cadastro", async () => {
		mockBackend({ absences: [] });
		renderAbsences();

		expect(await screen.findByText("Nenhuma ausência cadastrada")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Nova ausência" })).toHaveLength(2);
	});

	it("mostra erro com opção de tentar novamente", async () => {
		mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("requester-absence"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderAbsences();

		await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));
		// Nesta tela a falha continua avisada também no canto; só o Calendário dispensa esse aviso.
		expect(screen.getByText(GENERIC_ERROR_MESSAGE)).toBeInTheDocument();

		expect(await screen.findByRole("cell", { name: "Ana Souza" })).toBeInTheDocument();
	});

	describe("busca, situação e ordenação", () => {
		async function chooseOption(
			user: ReturnType<typeof renderApp>["user"],
			field: string,
			option: string,
		) {
			await user.click(screen.getByRole("combobox", { name: field }));
			await user.click(await screen.findByRole("option", { name: option }));
		}

		it("busca pelo profissional depois da digitação", async () => {
			mockBackend();
			const { user } = renderAbsences();
			await screen.findByRole("cell", { name: "Ana Souza" });

			await user.type(screen.getByRole("searchbox", { name: "Buscar profissional" }), "bruno");

			expect(await screen.findByText("Buscando…")).toBeInTheDocument();
			await waitFor(() => expect(professionalColumn()).toEqual(["Bruno Lima"]));
			expect(screen.getAllByText("1 de 3 ausências")).toHaveLength(2);
		});

		describe("com a data de hoje fixada", () => {
			beforeEach(() => {
				// Só o relógio é simulado, para não travar os atrasos do user-event.
				vi.useFakeTimers({ toFake: ["Date"] });
				vi.setSystemTime(new Date(2026, 2, 10, 23, 30));
			});

			afterEach(() => {
				vi.useRealTimers();
			});

			it("filtra pela situação em relação ao dia local", async () => {
				mockBackend({
					absences: [
						...ABSENCES,
						{
							id: 13,
							solicitanteId: 1,
							solicitanteNome: "Ana Souza",
							dataInicio: "2026-04-01",
							dataFim: "2026-04-05",
						},
					],
				});
				const { user } = renderAbsences();
				await screen.findByRole("cell", { name: "Bruno Lima" });

				await chooseOption(user, "Situação", "Em andamento");
				expect(professionalColumn()).toEqual(["Bruno Lima"]);

				await chooseOption(user, "Situação", "Próximas");
				expect(screen.getByText("01/04/2026")).toBeInTheDocument();
				expect(professionalColumn()).toEqual(["Ana Souza"]);

				await chooseOption(user, "Situação", "Encerradas");
				expect(professionalColumn()).toEqual(["Ana Souza", "Carla Inativa"]);
				expect(screen.getAllByText("2 de 4 ausências")).toHaveLength(2);
			});
		});

		it("ordena pelo início mais antigo e pelo profissional", async () => {
			mockBackend();
			const { user } = renderAbsences();
			await screen.findByRole("cell", { name: "Ana Souza" });

			await chooseOption(user, "Ordenar por", "Início mais antigo");
			expect(professionalColumn()).toEqual(["Carla Inativa", "Ana Souza", "Bruno Lima"]);

			await chooseOption(user, "Ordenar por", "Profissional Z–A");
			expect(professionalColumn()).toEqual(["Carla Inativa", "Bruno Lima", "Ana Souza"]);
		});

		it("distingue os filtros sem resultado e limpa tudo pelo estado vazio", async () => {
			mockBackend();
			const { user } = renderAbsences();
			await screen.findByRole("cell", { name: "Ana Souza" });
			expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();

			await chooseOption(user, "Ordenar por", "Profissional A–Z");
			await user.type(screen.getByRole("searchbox", { name: "Buscar profissional" }), "Daniel");

			expect(await screen.findByText("Nenhuma ausência encontrada")).toBeInTheDocument();
			expect(screen.queryByText("Nenhuma ausência cadastrada")).not.toBeInTheDocument();

			const [, emptyStateClear] = screen.getAllByRole("button", { name: "Limpar filtros" });
			await user.click(emptyStateClear as HTMLElement);

			await screen.findByRole("cell", { name: "Ana Souza" });
			expect(professionalColumn()).toEqual(["Bruno Lima", "Ana Souza", "Carla Inativa"]);
			expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
		});
	});

	describe("por perfil", () => {
		it("assistente registra, edita e remove ausências", async () => {
			mockBackend();
			renderApp("/absences", { authenticated: true, role: "ASSISTANT" });

			await screen.findByRole("cell", { name: "Ana Souza" });
			expect(screen.getByRole("button", { name: "Nova ausência" })).toBeInTheDocument();
			expect(screen.getAllByRole("button", { name: /^Editar ausência/ }).length).toBeGreaterThan(0);
			expect(screen.getAllByRole("button", { name: /^Excluir ausência/ }).length).toBeGreaterThan(
				0,
			);
		});

		it("visualizador só consulta as ausências", async () => {
			mockBackend();
			renderApp("/absences", { authenticated: true, role: "VIEWER" });

			await screen.findByRole("cell", { name: "Ana Souza" });
			expect(screen.queryByRole("button", { name: "Nova ausência" })).not.toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /^Editar ausência/ })).not.toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /^Excluir ausência/ })).not.toBeInTheDocument();
		});
	});
});
