import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRED_MESSAGE } from "@/lib/api/error-handler";
import { CREATED_TO_BEFORE_FROM_MESSAGE } from "./schemas";
import type { AuditEvent } from "./types";

type User = ReturnType<typeof renderApp>["user"];

const filler = (id: number): AuditEvent => ({
	id,
	action: "section.update",
	entityType: "section",
	entityId: id,
	actorUserId: 1,
	actorName: "Maria Admin",
	details: { nome: `Setor ${id}` },
	createdAt: `2026-09-${String(id).padStart(2, "0")}T10:00:00`,
});

/** Série criada, sala importada, código desconhecido e mais 9 eventos, para haver 2 páginas. */
const EVENTS: AuditEvent[] = [
	{
		id: 100,
		action: "reservation.create",
		entityType: "reservation",
		entityId: 50,
		actorUserId: 2,
		actorName: "João Recepção",
		details: {
			salaId: 3,
			sala: "Consultório 3",
			solicitanteId: 7,
			solicitante: "Ana Souza",
			recorrente: true,
			recorrenciaId: 50,
			ocorrencias: 4,
		},
		createdAt: "2026-09-29T14:05:00",
	},
	{
		id: 101,
		action: "room.create",
		entityType: "room",
		entityId: 10,
		actorName: "Sistema",
		details: { nome: "Consultório 10", setorId: 1, backfill: true, backfillSource: "rooms" },
		createdAt: "2026-09-28T09:00:00",
	},
	{
		id: 102,
		action: "report.export",
		entityType: "report",
		entityId: null,
		actorName: "Carla Gestão",
		details: {},
		createdAt: "2026-09-27T16:30:00",
	},
	...Array.from({ length: 9 }, (_, index) => filler(index + 1)),
];

type AuditRequest = Record<string, string>;

/** Backend em memória que pagina e busca por responsável ou número do registro; os demais filtros não reduzem a lista. */
function mockAudit(events: AuditEvent[] = EVENTS) {
	const requests: AuditRequest[] = [];
	server.use(
		http.get(apiUrl("audit"), ({ request }) => {
			const params = new URL(request.url).searchParams;
			requests.push(Object.fromEntries(params));
			const q = params.get("q")?.toLowerCase();
			const filtered = q
				? events.filter(
						(event) => event.actorName.toLowerCase().includes(q) || String(event.entityId) === q,
					)
				: events;
			return HttpResponse.json(
				paged(filtered, Number(params.get("page")), Number(params.get("size"))),
			);
		}),
	);
	return { requests, last: () => requests.at(-1) };
}

const renderHistory = () => renderApp("/historico", { authenticated: true });

const rowOf = (text: string) => screen.getByText(text).closest("tr") as HTMLElement;

async function selectFilter(user: User, field: string, option: string) {
	await user.click(screen.getByRole("combobox", { name: field }));
	await user.click(await screen.findByRole("option", { name: option }));
}

describe("Histórico", () => {
	// A tela é carregada sob demanda; importá-la antes evita que o primeiro teste pague a
	// importação dentro do tempo de espera do `findBy` quando a suíte roda em paralelo.
	beforeAll(async () => {
		await import("./HistoryPage");
	});

	it("carrega a primeira página sem filtros", async () => {
		const audit = mockAudit();
		renderHistory();

		expect(await screen.findByText("Consultório 10", { exact: false })).toBeInTheDocument();
		expect(audit.requests).toEqual([{ size: "10", page: "0" }]);
		// Acima e abaixo da tabela, como no Angular.
		expect(screen.getAllByText(/Mostrando/).map((summary) => summary.textContent)).toEqual([
			"Mostrando 1–10 de 12",
			"Mostrando 1–10 de 12",
		]);
		expect(screen.getByRole("heading", { name: "Histórico" })).toBeInTheDocument();
	});

	it("mostra data, ação, entidade, responsável e detalhes legíveis", async () => {
		mockAudit();
		renderHistory();

		const series = within(
			await screen.findByText("João Recepção").then((cell) => cell.closest("tr") as HTMLElement),
		);
		expect(series.getByText("29/09/2026 14:05")).toBeInTheDocument();
		expect(series.getByText("Criação de reserva")).toBeInTheDocument();
		expect(series.getByText("Série #50")).toBeInTheDocument();
		expect(
			series.getByText(
				"Sala: Consultório 3 · Solicitante: Ana Souza · Recorrente: sim · Série: #50 · Ocorrências: 4",
			),
		).toBeInTheDocument();

		const imported = within(rowOf("Nome: Consultório 10 · Setor: #1"));
		expect(imported.getByText("Criação de sala")).toBeInTheDocument();
		expect(imported.getByText("Importado")).toBeInTheDocument();
		expect(imported.getByText("Sala #10")).toBeInTheDocument();

		const unknown = within(rowOf("Carla Gestão"));
		expect(unknown.getByText("report.export")).toBeInTheDocument();
		expect(unknown.getByText("report")).toBeInTheDocument();
	});

	it("aplica a busca, sem espaços nas pontas, e os selects na hora", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		const searchInput = screen.getByRole("searchbox", { name: "Buscar evento" });
		expect(searchInput).toHaveAccessibleDescription(
			"Busque pelo nome de quem fez a ação ou pelo número do registro",
		);
		expect(searchInput).toHaveAttribute("placeholder", "Ex.: Maria ou 42");
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();

		await user.type(searchInput, " Maria ");
		await selectFilter(user, "Ação", "Edição de setor");
		await selectFilter(user, "Entidade", "Setor");

		await waitFor(() =>
			expect(audit.last()).toEqual({
				size: "10",
				page: "0",
				q: "Maria",
				action: "section.update",
				entityType: "section",
			}),
		);
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeEnabled();
	});

	it("aplica as datas quando estão completas", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await user.type(screen.getByLabelText("De"), "01092026");
		await user.type(screen.getByLabelText("Até"), "29092026");

		await waitFor(() =>
			expect(audit.last()).toEqual({
				size: "10",
				page: "0",
				createdFrom: "2026-09-01",
				createdTo: "2026-09-29",
			}),
		);
		// Datas incompletas, durante a digitação, não chegam ao backend.
		expect(
			audit.requests.every(
				(request) =>
					[undefined, "2026-09-01"].includes(request.createdFrom) &&
					[undefined, "2026-09-29"].includes(request.createdTo),
			),
		).toBe(true);
	});

	// Regressão: no Angular, a paginação usava filtros que não estavam valendo.
	it("mantém os filtros aplicados ao paginar", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await selectFilter(user, "Entidade", "Setor");
		await waitFor(() => expect(audit.last()).toMatchObject({ entityType: "section", page: "0" }));
		await user.click(await screen.findByRole("button", { name: "Próxima página" }));

		await waitFor(() =>
			expect(audit.last()).toEqual({ size: "10", page: "1", entityType: "section" }),
		);
	});

	it("limpa os filtros e volta a consultar sem eles", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await selectFilter(user, "Ação", "Login no sistema");
		await waitFor(() => expect(audit.last()).toMatchObject({ action: "auth.login" }));

		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

		await waitFor(() => expect(audit.last()).toEqual({ size: "10", page: "0" }));
		expect(screen.getByRole("combobox", { name: "Ação" })).toHaveTextContent("Todas");
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
	});

	it("ordena do mais antigo para o mais recente enviando sort", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await selectFilter(user, "Ordenar por", "Mais antigos");

		await waitFor(() =>
			expect(audit.last()).toEqual({ size: "10", page: "0", sort: "createdAt,asc" }),
		);
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeEnabled();
	});

	it("mostra Buscando… enquanto a busca espera e carrega, mantendo a lista anterior", async () => {
		mockAudit();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		server.use(
			http.get(apiUrl("audit"), async () => {
				await gate;
				return undefined;
			}),
		);
		await user.type(screen.getByRole("searchbox", { name: "Buscar evento" }), "Maria");

		expect(await screen.findByText("Buscando…")).toBeInTheDocument();
		expect(screen.getByText("João Recepção")).toBeInTheDocument();

		release();
		await waitFor(() => expect(screen.queryByText("Buscando…")).not.toBeInTheDocument());
		expect(screen.queryByText("João Recepção")).not.toBeInTheDocument();
	});

	it("valida as datas e só consulta o backend com um período válido", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await user.type(screen.getByLabelText("De"), "10092026");
		await waitFor(() => expect(audit.last()?.createdFrom).toBe("2026-09-10"));
		await user.type(screen.getByLabelText("Até"), "09092026");
		await user.tab();

		expect(await screen.findByText(CREATED_TO_BEFORE_FROM_MESSAGE)).toBeInTheDocument();
		expect(screen.getByLabelText("Até")).toHaveAttribute("aria-invalid", "true");

		await user.clear(screen.getByLabelText("De"));
		await user.type(screen.getByLabelText("De"), "31022026");
		await user.tab();
		expect(await screen.findByText("Data inválida.")).toBeInTheDocument();
		expect(screen.queryByText(CREATED_TO_BEFORE_FROM_MESSAGE)).not.toBeInTheDocument();

		// Com o início apagado, o fim sozinho é um filtro válido; o início inválido não é enviado.
		await waitFor(() =>
			expect(audit.last()).toEqual({ size: "10", page: "0", createdTo: "2026-09-09" }),
		);
		expect(
			audit.requests.some(
				(request) => request.createdFrom === "2026-09-10" && request.createdTo === "2026-09-09",
			),
		).toBe(false);
		expect(audit.requests.every((request) => request.createdFrom !== "2026-02-31")).toBe(true);
	});

	it("mostra o estado vazio sem filtros", async () => {
		mockAudit([]);
		renderHistory();

		expect(await screen.findByText("Nenhum evento registrado")).toBeInTheDocument();
		expect(
			screen.getByText("Ações do sistema aparecerão aqui assim que forem realizadas."),
		).toBeInTheDocument();
	});

	it("distingue a busca sem resultado e permite limpar pelo estado vazio", async () => {
		mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await user.type(screen.getByRole("searchbox", { name: "Buscar evento" }), "Inexistente");

		expect(await screen.findByText("Nenhum evento encontrado")).toBeInTheDocument();
		expect(screen.queryByText("Nenhum evento registrado")).not.toBeInTheDocument();

		const [, emptyStateClear] = screen.getAllByRole("button", { name: "Limpar filtros" });
		await user.click(emptyStateClear as HTMLElement);
		expect(await screen.findByText("João Recepção")).toBeInTheDocument();
		expect(screen.getByRole("searchbox", { name: "Buscar evento" })).toHaveValue("");
	});

	it("mostra um único aviso de erro, com opção de tentar novamente", async () => {
		mockAudit();
		let failures = 1;
		server.use(
			http.get(apiUrl("audit"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderHistory();

		await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));
		expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).not.toBeInTheDocument();

		expect(await screen.findByText("João Recepção")).toBeInTheDocument();
	});

	it("leva ao login quando a sessão expira", async () => {
		server.use(http.get(apiUrl("audit"), () => new HttpResponse(null, { status: 401 })));
		const { location } = renderHistory();

		expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(location()).toBe("/login"));
	});
});
