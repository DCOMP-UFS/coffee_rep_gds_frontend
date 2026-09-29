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

function mockAudit(events: AuditEvent[] = EVENTS) {
	const requests: AuditRequest[] = [];
	server.use(
		http.get(apiUrl("audit"), ({ request }) => {
			const params = new URL(request.url).searchParams;
			requests.push(Object.fromEntries(params));
			return HttpResponse.json(
				paged(events, Number(params.get("page")), Number(params.get("size"))),
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
		expect(screen.getByText(/Mostrando/)).toHaveTextContent("Mostrando 1–10 de 12");
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

	// Regressão: no Angular, a paginação usava os filtros digitados e ainda não aplicados.
	it("aplica todos os filtros só ao clicar em Filtrar, inclusive ao paginar", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		expect(screen.getByLabelText("Buscar")).toHaveAccessibleDescription(
			"Busque pelo nome de quem fez a ação ou pelo número do registro",
		);
		expect(screen.getByLabelText("Buscar")).toHaveAttribute("placeholder", "Ex.: Maria ou 42");

		await user.type(screen.getByLabelText("Buscar"), " Maria ");
		await selectFilter(user, "Ação", "Edição de setor");
		await selectFilter(user, "Entidade", "Setor");
		await user.type(screen.getByLabelText("De"), "01092026");
		await user.type(screen.getByLabelText("Até"), "29092026");

		await user.click(screen.getByRole("button", { name: "Próxima página" }));
		await waitFor(() => expect(audit.last()).toEqual({ size: "10", page: "1" }));
		expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Filtrar" }));
		await waitFor(() =>
			expect(audit.last()).toEqual({
				size: "10",
				page: "0",
				q: "Maria",
				action: "section.update",
				entityType: "section",
				createdFrom: "2026-09-01",
				createdTo: "2026-09-29",
			}),
		);
	});

	it("limpa os filtros aplicados e volta a consultar sem eles", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await selectFilter(user, "Ação", "Login no sistema");
		await user.click(screen.getByRole("button", { name: "Filtrar" }));
		await waitFor(() => expect(audit.last()).toMatchObject({ action: "auth.login" }));

		await user.click(await screen.findByRole("button", { name: "Limpar filtros" }));

		await waitFor(() => expect(audit.last()).toEqual({ size: "10", page: "0" }));
		expect(screen.getByRole("combobox", { name: "Ação" })).toHaveTextContent("Todas");
		expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
	});

	it("recarrega ao filtrar de novo com os mesmos filtros", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await user.click(screen.getByRole("button", { name: "Filtrar" }));

		await waitFor(() => expect(audit.requests).toHaveLength(2));
	});

	it("mostra Filtrando… enquanto a consulta carrega, mantendo a lista anterior", async () => {
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
		await user.type(screen.getByLabelText("Buscar"), "Maria");
		await user.click(screen.getByRole("button", { name: "Filtrar" }));

		expect(await screen.findByRole("button", { name: "Filtrando…" })).toBeDisabled();
		expect(screen.getByText("João Recepção")).toBeInTheDocument();

		release();
		expect(await screen.findByRole("button", { name: "Filtrar" })).toBeEnabled();
	});

	it("valida as datas sem consultar o backend", async () => {
		const audit = mockAudit();
		const { user } = renderHistory();
		await screen.findByText("João Recepção");

		await user.type(screen.getByLabelText("De"), "10092026");
		await user.type(screen.getByLabelText("Até"), "09092026");
		await user.click(screen.getByRole("button", { name: "Filtrar" }));

		expect(await screen.findByText(CREATED_TO_BEFORE_FROM_MESSAGE)).toBeInTheDocument();
		expect(screen.getByLabelText("Até")).toHaveAttribute("aria-invalid", "true");

		await user.clear(screen.getByLabelText("De"));
		await user.type(screen.getByLabelText("De"), "31022026");
		await user.click(screen.getByRole("button", { name: "Filtrar" }));
		expect(await screen.findByText("Data inválida.")).toBeInTheDocument();
		expect(audit.requests).toHaveLength(1);
	});

	it("mostra o estado vazio", async () => {
		mockAudit([]);
		renderHistory();

		expect(await screen.findByText("Nenhum evento encontrado")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Ações do sistema aparecerão aqui. Ajuste os filtros ou aguarde novas operações.",
			),
		).toBeInTheDocument();
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
