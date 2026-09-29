import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Section } from "@/features/sections/types";
import { ROOM_ERROR_MESSAGES } from "./hooks";
import { ROOM_SAVED_MESSAGE, SECTIONS_LOAD_ERROR_MESSAGE } from "./RoomFormDialog";
import { ROOM_DELETED_MESSAGE } from "./RoomsPage";
import type { Room } from "./types";

const SECTIONS: Section[] = [
	{ id: 7, nome: "Cardiologia", observacoes: null },
	{ id: 8, nome: "Pediatria", observacoes: null },
];

const room = (id: number, ocupada: boolean, setorId = 7): Room => ({
	id,
	nome: `Sala ${String(id).padStart(2, "0")}`,
	ocupada,
	setorId,
	setor: SECTIONS.find((section) => section.id === setorId)?.nome ?? "",
});

/** 12 salas: ímpares ocupadas; 1 a 8 na Cardiologia, 9 a 12 na Pediatria. */
const ROOMS = Array.from({ length: 12 }, (_, index) =>
	room(index + 1, index % 2 === 0, index < 8 ? 7 : 8),
);

interface ListRequest {
	path: string;
	size: string | null;
	page: string | null;
	ocupada: string | null;
}

/**
 * Backend em memória com a mesma paginação e filtros do NestJS. Registra as requisições de
 * listagem (as de contagem do resumo usam `size=1` e ficam de fora).
 */
function mockBackend(initialRooms: Room[] = ROOMS) {
	let rooms = [...initialRooms];
	const listRequests: ListRequest[] = [];
	const writes: { method: string; url: string; body?: unknown }[] = [];

	const respond = (request: Request, sectionId: number | null) => {
		const url = new URL(request.url);
		const size = Number(url.searchParams.get("size"));
		const page = Number(url.searchParams.get("page"));
		const ocupada = url.searchParams.get("ocupada");

		if (size !== 1) {
			listRequests.push({
				path: url.pathname.replace("/api/", ""),
				size: url.searchParams.get("size"),
				page: url.searchParams.get("page"),
				ocupada,
			});
		}

		const filtered = rooms.filter(
			(item) =>
				(sectionId === null || item.setorId === sectionId) &&
				(ocupada === null || String(item.ocupada) === ocupada),
		);
		return HttpResponse.json(paged(filtered, page, size));
	};

	server.use(
		http.get(apiUrl("section"), () => HttpResponse.json(SECTIONS)),
		http.get(apiUrl("room"), ({ request }) => respond(request, null)),
		http.get(apiUrl("room/section/:id"), ({ request, params }) =>
			respond(request, Number(params.id)),
		),
		http.post(apiUrl("room"), async ({ request }) => {
			const body = (await request.json()) as { nome: string; setorId: number };
			writes.push({ method: "POST", url: request.url, body });
			rooms = [...rooms, room(100, false, body.setorId)];
			return HttpResponse.json({ id: 100, nome: body.nome, setor: "" }, { status: 201 });
		}),
		http.put(apiUrl("room/:id"), async ({ request }) => {
			writes.push({ method: "PUT", url: request.url, body: await request.json() });
			return HttpResponse.json({ id: 1, nome: "", setor: "" });
		}),
		http.delete(apiUrl("room/:id"), ({ request, params }) => {
			writes.push({ method: "DELETE", url: request.url });
			rooms = rooms.filter((item) => item.id !== Number(params.id));
			return new HttpResponse(null, { status: 204 });
		}),
	);

	return { listRequests, writes, lastList: () => listRequests.at(-1) };
}

const renderRooms = () => renderApp("/rooms", { authenticated: true });

/** Valor exibido num cartão do resumo, lido do par `<dt>`/`<dd>`. */
const summaryValue = (label: string) =>
	screen.getByText(label, { selector: "dt" }).nextElementSibling?.textContent;

async function selectOption(
	user: ReturnType<typeof renderApp>["user"],
	comboboxName: string,
	optionName: string,
) {
	await user.click(screen.getByRole("combobox", { name: comboboxName }));
	await user.click(await screen.findByRole("option", { name: optionName }));
}

describe("Salas", () => {
	it("carrega a primeira página com 5 itens, sem o parâmetro ocupada", async () => {
		const backend = mockBackend();
		renderRooms();

		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
		expect(screen.getAllByRole("row")).toHaveLength(6);
		expect(backend.listRequests).toEqual([{ path: "room", size: "5", page: "0", ocupada: null }]);

		const firstRow = screen.getByRole("cell", { name: "Sala 01" }).closest("tr") as HTMLElement;
		expect(within(firstRow).getByText("Ocupada")).toBeInTheDocument();
		expect(within(firstRow).getByText("Cardiologia")).toBeInTheDocument();
		// Acima e abaixo da tabela, como no Angular.
		expect(screen.getAllByText(/Mostrando/).map((summary) => summary.textContent)).toEqual([
			"Mostrando 1–5 de 12",
			"Mostrando 1–5 de 12",
		]);
	});

	it("mostra o resumo com total, ocupadas e livres de todas as salas", async () => {
		mockBackend();
		renderRooms();

		await waitFor(() => expect(summaryValue("Total de salas")).toBe("12"));
		await waitFor(() => expect(summaryValue("Ocupadas")).toBe("6"));
		await waitFor(() => expect(summaryValue("Livres")).toBe("6"));
	});

	it("filtra por status e volta para a primeira página", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await user.click(screen.getByRole("button", { name: "Próxima página" }));
		await waitFor(() => expect(backend.lastList()?.page).toBe("1"));

		await selectOption(user, "Status", "Livre");

		await waitFor(() =>
			expect(backend.lastList()).toEqual({ path: "room", size: "5", page: "0", ocupada: "false" }),
		);
		expect(await screen.findByRole("cell", { name: "Sala 02" })).toBeInTheDocument();
		expect(screen.queryByRole("cell", { name: "Sala 01" })).not.toBeInTheDocument();
	});

	it("filtra por setor usando room/section/{id}", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await selectOption(user, "Setor", "Pediatria");

		await waitFor(() =>
			expect(backend.lastList()).toEqual({
				path: "room/section/8",
				size: "5",
				page: "0",
				ocupada: null,
			}),
		);
		expect(await screen.findByRole("cell", { name: "Sala 09" })).toBeInTheDocument();

		// A primeira página sem filtros ainda está no cache, então volta sem nova requisição.
		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "Setor" })).toHaveTextContent("Todas");
	});

	it("abre já filtrada pelo setor informado na URL", async () => {
		const backend = mockBackend();
		renderApp("/rooms?setor=8", { authenticated: true });

		expect(await screen.findByRole("cell", { name: "Sala 09" })).toBeInTheDocument();
		expect(backend.listRequests.map((request) => request.path)).toEqual(["room/section/8"]);
		await waitFor(() =>
			expect(screen.getByRole("combobox", { name: "Setor" })).toHaveTextContent("Pediatria"),
		);
	});

	it("mantém o setor escolhido na URL e o remove ao limpar os filtros", async () => {
		mockBackend();
		const { user, location } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await selectOption(user, "Setor", "Cardiologia");
		await waitFor(() => expect(location()).toBe("/rooms?setor=7"));

		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
		await waitFor(() => expect(location()).toBe("/rooms"));
	});

	it.each([
		["não numérico", "/rooms?setor=abc"],
		["inexistente", "/rooms?setor=999"],
	])("trata setor %s na URL como Todas", async (_, route) => {
		const backend = mockBackend();
		renderApp(route, { authenticated: true });

		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
		await waitFor(() => expect(backend.lastList()?.path).toBe("room"));
		expect(screen.getByRole("combobox", { name: "Setor" })).toHaveTextContent("Todas");
	});

	it("pagina no servidor e troca a quantidade por página", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await user.click(screen.getByRole("button", { name: "Página 3" }));
		expect(await screen.findByRole("cell", { name: "Sala 11" })).toBeInTheDocument();
		expect(backend.lastList()).toMatchObject({ page: "2", size: "5" });

		await selectOption(user, "Itens por página", "10");
		await waitFor(() => expect(backend.lastList()).toMatchObject({ page: "0", size: "10" }));
		expect(await screen.findByRole("cell", { name: "Sala 10" })).toBeInTheDocument();
	});

	it("cadastra uma sala com nome aparado e setorId numérico", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await user.click(screen.getByRole("button", { name: "Nova sala" }));
		const dialog = await screen.findByRole("dialog", { name: "Nova sala" });
		await user.type(
			within(dialog).getByLabelText("Nome da sala (obrigatório)"),
			"  Consultório 12 ",
		);
		await user.click(within(dialog).getByRole("combobox", { name: "Setor (obrigatório)" }));
		await user.click(await screen.findByRole("option", { name: "Pediatria" }));
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(ROOM_SAVED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([
			{ method: "POST", url: apiUrl("room"), body: { nome: "Consultório 12", setorId: 8 } },
		]);
		await waitFor(() => expect(summaryValue("Total de salas")).toBe("13"));
	});

	it("valida nome e setor sem chamar o backend", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await user.click(screen.getByRole("button", { name: "Nova sala" }));
		const dialog = await screen.findByRole("dialog", { name: "Nova sala" });
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByText("Informe o nome da sala.")).toBeInTheDocument();
		expect(within(dialog).getByText("Selecione o setor.")).toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	it("edita uma sala enviando só nome e setorId", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();

		await user.click(await screen.findByRole("button", { name: "Editar sala Sala 03" }));
		const dialog = await screen.findByRole("dialog", { name: "Editar sala" });
		expect(within(dialog).getByRole("combobox", { name: "Setor (obrigatório)" })).toHaveTextContent(
			"Cardiologia",
		);

		const nameInput = within(dialog).getByLabelText("Nome da sala (obrigatório)");
		await user.clear(nameInput);
		await user.type(nameInput, "Sala 03A");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		await screen.findByText(ROOM_SAVED_MESSAGE);
		expect(backend.writes).toEqual([
			{ method: "PUT", url: apiUrl("room/3"), body: { nome: "Sala 03A", setorId: 7 } },
		]);
	});

	it("exclui após confirmação", async () => {
		const backend = mockBackend();
		const { user } = renderRooms();

		await user.click(await screen.findByRole("button", { name: "Excluir sala Sala 02" }));
		const confirm = await screen.findByRole("alertdialog", { name: "Excluir a sala “Sala 02”?" });
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await screen.findByText(ROOM_DELETED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "DELETE", url: apiUrl("room/2") }]);
		await waitFor(() =>
			expect(screen.queryByRole("cell", { name: "Sala 02" })).not.toBeInTheDocument(),
		);
	});

	// Regressão: no Angular, excluir o único item da última página deixava a tela vazia
	// ("Nenhuma sala cadastrada") mesmo havendo salas nas páginas anteriores.
	it("volta para a página anterior ao excluir o último item da última página", async () => {
		const backend = mockBackend(ROOMS.slice(0, 11));
		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });

		await user.click(screen.getByRole("button", { name: "Última página" }));
		await user.click(await screen.findByRole("button", { name: "Excluir sala Sala 11" }));
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await screen.findByRole("cell", { name: "Sala 10" })).toBeInTheDocument();
		expect(backend.lastList()).toMatchObject({ page: "1" });
		expect(screen.queryByText("Nenhuma sala cadastrada")).not.toBeInTheDocument();
	});

	it("mostra o erro ao salvar dentro do formulário, que continua aberto", async () => {
		const backend = mockBackend();
		server.use(
			http.put(apiUrl("room/:id"), () =>
				HttpResponse.json({ message: "Já existe uma sala com esse nome." }, { status: 409 }),
			),
		);

		const { user } = renderRooms();
		await user.click(await screen.findByRole("button", { name: "Editar sala Sala 03" }));
		const dialog = await screen.findByRole("dialog", { name: "Editar sala" });
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Já existe uma sala com esse nome.",
		);
		expect(screen.getAllByText("Já existe uma sala com esse nome.")).toHaveLength(1);
		expect(screen.queryByText(ROOM_SAVED_MESSAGE)).not.toBeInTheDocument();
		expect(backend.writes).toEqual([]);

		await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
		await user.click(await screen.findByRole("button", { name: "Editar sala Sala 04" }));
		const reopened = await screen.findByRole("dialog", { name: "Editar sala" });
		expect(within(reopened).queryByRole("alert")).not.toBeInTheDocument();
	});

	it("mostra o erro da exclusão dentro da confirmação, com o fallback da operação", async () => {
		mockBackend();
		server.use(http.delete(apiUrl("room/:id"), () => new HttpResponse(null, { status: 500 })));

		const { user } = renderRooms();
		await user.click(await screen.findByRole("button", { name: "Excluir sala Sala 02" }));
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(ROOM_ERROR_MESSAGES.remove);
		expect(screen.getAllByText(ROOM_ERROR_MESSAGES.remove)).toHaveLength(1);
		expect(screen.queryByText(ROOM_DELETED_MESSAGE)).not.toBeInTheDocument();
		expect(screen.getByRole("alertdialog")).toBeInTheDocument();
	});

	// Regressão: com a lista de setores fora do ar, o formulário pedia para cadastrar um setor.
	it("avisa quando os setores não carregam e permite tentar de novo no formulário", async () => {
		mockBackend();
		let sectionFailures = 1;
		server.use(
			http.get(apiUrl("section"), () => {
				if (sectionFailures > 0) {
					sectionFailures--;
					return HttpResponse.json({ status: 500 }, { status: 500 });
				}
				return HttpResponse.json(SECTIONS);
			}),
		);

		const { user } = renderRooms();
		await screen.findByRole("cell", { name: "Sala 01" });
		await user.click(screen.getByRole("button", { name: "Nova sala" }));
		const dialog = await screen.findByRole("dialog", { name: "Nova sala" });

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(SECTIONS_LOAD_ERROR_MESSAGE);
		expect(within(dialog).queryByText(/Cadastre um setor/)).not.toBeInTheDocument();

		await user.click(within(dialog).getByRole("button", { name: "Tentar novamente" }));

		await waitFor(() => expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument());
		expect(within(dialog).getByRole("combobox", { name: "Setor (obrigatório)" })).toBeEnabled();
	});

	it("mostra o estado vazio com ação de cadastro", async () => {
		mockBackend([]);
		renderRooms();

		expect(await screen.findByText("Nenhuma sala cadastrada")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Nova sala" })).toHaveLength(2);
	});

	it("mostra erro com opção de tentar novamente", async () => {
		const backend = mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("room"), ({ request }) => {
				const isList = new URL(request.url).searchParams.get("size") !== "1";
				if (isList && failures > 0) {
					failures--;
					return HttpResponse.json(
						{ status: 500, error: "Internal Server Error" },
						{ status: 500 },
					);
				}
				return undefined;
			}),
		);

		const { user } = renderRooms();
		await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));

		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
		expect(backend.listRequests).toHaveLength(1);
	});
});
