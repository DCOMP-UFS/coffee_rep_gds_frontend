import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Requester } from "@/features/requesters/types";
import { roomKeys } from "@/features/rooms/query-keys";
import type { Room } from "@/features/rooms/types";
import type { Section } from "@/features/sections/types";
import { RESERVATION_CANCELLED_MESSAGE, SERIES_CANCELLED_MESSAGE } from "./CancelReservationDialog";
import { RESERVATION_ERROR_MESSAGES } from "./hooks";
import { RECURRING_RESERVATION_HINT } from "./permissions";
import { RESERVATION_CREATED_MESSAGE, RESERVATION_LOAD_ERRORS } from "./ReservationFormDialog";
import { PERIOD_END_BEFORE_START_MESSAGE, RESERVATION_MESSAGES } from "./schemas";
import type { Reservation } from "./types";

type User = ReturnType<typeof renderApp>["user"];

const pad = (value: number) => String(value).padStart(2, "0");

const reservation = (id: number, overrides: Partial<Reservation> = {}): Reservation => ({
	reservationId: id,
	horaInicio: `2026-10-${pad(id)}T08:00:00`,
	horaFim: `2026-10-${pad(id)}T09:00:00`,
	sala: `Sala ${pad(id)}`,
	setor: "Ambulatório",
	solicitante: "Ana Souza",
	criador: "Maria Admin",
	salaId: id,
	setorId: 1,
	solicitanteId: 1,
	profissionalAusente: false,
	...overrides,
});

/** A 01 é de uma série; a 02 não tem criador (o backend omite o campo). */
const RESERVATIONS = [
	reservation(1, { recorrenciaId: 50 }),
	reservation(2, { criador: undefined }),
	...Array.from({ length: 5 }, (_, index) => reservation(index + 3)),
];

const SECTIONS: Section[] = [
	{ id: 1, nome: "Ambulatório" },
	{ id: 2, nome: "Setor Vazio" },
];

const ROOMS_BY_SECTION: Record<number, Room[]> = {
	1: [
		{ id: 10, nome: "Consultório 10", setor: "Ambulatório", setorId: 1, ocupada: false },
		{ id: 11, nome: "Consultório 11", setor: "Ambulatório", setorId: 1, ocupada: true },
	],
	2: [],
};

const REQUESTERS: Requester[] = [
	{ id: 7, nome: "Ana Souza", especialidade: "Cardiologia" },
	{ id: 8, nome: "Bruno Lima" },
];

interface ListRequest {
	inicio: string | null;
	fim: string | null;
	page: string | null;
	size: string | null;
	/** Ausentes quando não enviados, para não pesarem nas comparações com `toEqual`. */
	busca?: string;
	setorId?: string;
	recorrente?: string;
	sort?: string;
}

/**
 * Backend em memória: lista paginada com busca, setor e tipo (o período não é filtrado), criação
 * e os dois tipos de cancelamento.
 */
function mockBackend({ reservations = RESERVATIONS }: { reservations?: Reservation[] } = {}) {
	let current = [...reservations];
	const listRequests: ListRequest[] = [];
	const roomRequests: string[] = [];
	const writes: { method: string; url: string; body?: unknown }[] = [];

	server.use(
		http.get(apiUrl("reservation"), ({ request }) => {
			const params = new URL(request.url).searchParams;
			const busca = params.get("busca") ?? undefined;
			const setorId = params.get("setorId") ?? undefined;
			const recorrente = params.get("recorrente") ?? undefined;
			listRequests.push({
				inicio: params.get("inicio"),
				fim: params.get("fim"),
				page: params.get("page"),
				size: params.get("size"),
				busca,
				setorId,
				recorrente,
				sort: params.get("sort") ?? undefined,
			});
			const term = busca?.toLowerCase();
			const filtered = current.filter(
				(item) =>
					(!term ||
						[item.sala, item.setor, item.solicitante, item.criador ?? ""].some((text) =>
							text.toLowerCase().includes(term),
						)) &&
					(!setorId || item.setorId === Number(setorId)) &&
					(!recorrente || Boolean(item.recorrenciaId) === (recorrente === "true")),
			);
			return HttpResponse.json(
				paged(filtered, Number(params.get("page")), Number(params.get("size"))),
			);
		}),
		http.post(apiUrl("reservation"), async ({ request }) => {
			writes.push({ method: "POST", url: request.url, body: await request.json() });
			return HttpResponse.json({ id: 100 }, { status: 201 });
		}),
		http.patch(apiUrl("reservation/:id"), ({ request, params }) => {
			writes.push({ method: "PATCH", url: request.url });
			current = current.filter((item) => item.reservationId !== Number(params.id));
			return new HttpResponse(null, { status: 204 });
		}),
		http.delete(apiUrl("reservation/recurrent/:id"), ({ request, params }) => {
			writes.push({ method: "DELETE", url: request.url });
			current = current.filter((item) => item.recorrenciaId !== Number(params.id));
			return new HttpResponse(null, { status: 204 });
		}),
		http.get(apiUrl("section"), () => HttpResponse.json(SECTIONS)),
		http.get(apiUrl("room/section/:id"), ({ request, params }) => {
			roomRequests.push(`${new URL(request.url).pathname}${new URL(request.url).search}`);
			return HttpResponse.json(ROOMS_BY_SECTION[Number(params.id)] ?? []);
		}),
		http.get(apiUrl("requester"), () => HttpResponse.json(REQUESTERS)),
	);

	return { listRequests, roomRequests, writes, lastList: () => listRequests.at(-1) };
}

const renderReservations = () => renderApp("/reservation", { authenticated: true });

const rowOf = (room: string) =>
	screen.getByRole("cell", { name: room }).closest("tr") as HTMLElement;

async function openNewReservation(user: User) {
	await screen.findByRole("cell", { name: "Sala 01" });
	await user.click(screen.getAllByRole("button", { name: "Nova reserva" })[0] as HTMLElement);
	return screen.findByRole("dialog", { name: "Nova reserva" });
}

async function selectOption(user: User, dialog: HTMLElement, field: string, option: string) {
	await user.click(within(dialog).getByRole("combobox", { name: `${field} (obrigatório)` }));
	await user.click(await screen.findByRole("option", { name: option }));
}

/** Setor, sala e solicitante escolhidos, prontos para as datas e horários. */
async function fillSelects(user: User, dialog: HTMLElement) {
	await selectOption(user, dialog, "Setor", "Ambulatório");
	await waitFor(() =>
		expect(within(dialog).getByRole("combobox", { name: "Sala (obrigatório)" })).toBeEnabled(),
	);
	await selectOption(user, dialog, "Sala", "Consultório 11");
	await selectOption(user, dialog, "Solicitante", "Ana Souza - Cardiologia");
}

async function fillTimes(user: User, dialog: HTMLElement, start: string, end: string) {
	await user.type(within(dialog).getByLabelText("Horário de início (obrigatório)"), start);
	await user.type(within(dialog).getByLabelText("Horário de fim (obrigatório)"), end);
}

async function replaceValue(user: User, input: HTMLElement, value: string) {
	await user.clear(input);
	await user.type(input, value);
}

describe("Reservas", () => {
	// A tela é carregada sob demanda; importá-la antes evita que o primeiro teste pague a
	// importação dentro do tempo de espera do `findBy` quando a suíte roda em paralelo.
	beforeAll(async () => {
		await import("./ReservationsPage");
	});

	beforeEach(() => {
		// Só o relógio é simulado, para não travar os atrasos do user-event. 22h30 é o horário em
		// que o Angular, por converter para UTC, começava o período no dia seguinte.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(2026, 8, 29, 22, 30));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// Regressão: no Angular, o período padrão podia começar amanhã, por causa do fuso.
	it("carrega de hoje a hoje + 30 no horário local, mesmo às 22h", async () => {
		const backend = mockBackend();
		renderReservations();

		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
		expect(backend.listRequests).toEqual([
			{ inicio: "2026-09-29T00:00:00", fim: "2026-10-29T23:59:59", page: "0", size: "5" },
		]);
		expect(screen.getByLabelText("De")).toHaveValue("29/09/2026");
		expect(screen.getByLabelText("Até")).toHaveValue("29/10/2026");
		// Acima e abaixo da tabela, como no Angular.
		expect(screen.getAllByText(/Mostrando/).map((summary) => summary.textContent)).toEqual([
			"Mostrando 1–5 de 7",
			"Mostrando 1–5 de 7",
		]);
	});

	it("mostra horários, criador e tipo de cada reserva", async () => {
		mockBackend();
		renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		const recurring = within(rowOf("Sala 01"));
		expect(recurring.getByText("01/10/2026 08:00")).toBeInTheDocument();
		expect(recurring.getByText("01/10/2026 09:00")).toBeInTheDocument();
		expect(recurring.getByText("Maria Admin")).toBeInTheDocument();
		expect(recurring.getByText("Recorrente")).toBeInTheDocument();

		const single = within(rowOf("Sala 02"));
		expect(single.getByText("—")).toBeInTheDocument();
		expect(single.getByText("Pontual")).toBeInTheDocument();
	});

	// Regressão: no Angular, a paginação usava um período que não estava valendo.
	it("aplica o período assim que ele fica válido e o mantém ao paginar", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();

		await replaceValue(user, screen.getByLabelText("De"), "01102026");

		await waitFor(() =>
			expect(backend.lastList()).toEqual({
				inicio: "2026-10-01T00:00:00",
				fim: "2026-10-29T23:59:59",
				page: "0",
				size: "5",
			}),
		);
		// A data incompleta, durante a digitação, não chega ao backend.
		expect(new Set(backend.listRequests.map((request) => request.inicio))).toEqual(
			new Set(["2026-09-29T00:00:00", "2026-10-01T00:00:00"]),
		);
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeEnabled();

		await user.click(await screen.findByRole("button", { name: "Próxima página" }));
		await waitFor(() =>
			expect(backend.lastList()).toEqual({
				inicio: "2026-10-01T00:00:00",
				fim: "2026-10-29T23:59:59",
				page: "1",
				size: "5",
			}),
		);
	});

	it("mostra Buscando… enquanto a lista carrega, mantendo a lista anterior", async () => {
		mockBackend();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		server.use(
			http.get(apiUrl("reservation"), async () => {
				await gate;
				return undefined;
			}),
		);
		await replaceValue(user, screen.getByLabelText("De"), "01102026");

		expect(await screen.findByText("Buscando…")).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Sala 01" })).toBeInTheDocument();

		release();
		await waitFor(() => expect(screen.queryByText("Buscando…")).not.toBeInTheDocument());
		expect(screen.getByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
	});

	// Regressão: no Angular, um período inválido fazia o "Buscar" não fazer nada, sem mensagem.
	it("avisa sobre período inválido sem consultar o backend e restaura o padrão ao limpar", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		await replaceValue(user, screen.getByLabelText("Até"), "01092026");
		await user.tab();
		expect(await screen.findByText(PERIOD_END_BEFORE_START_MESSAGE)).toBeInTheDocument();
		expect(screen.getByLabelText("Até")).toHaveAttribute("aria-invalid", "true");

		await user.clear(screen.getByLabelText("De"));
		await user.tab();
		expect(await screen.findByText("Informe a data inicial.")).toBeInTheDocument();
		expect(backend.listRequests).toHaveLength(1);
		expect(screen.getByRole("cell", { name: "Sala 01" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
		expect(screen.getByLabelText("De")).toHaveValue("29/09/2026");
		expect(screen.getByLabelText("Até")).toHaveValue("29/10/2026");
		expect(screen.queryByText(PERIOD_END_BEFORE_START_MESSAGE)).not.toBeInTheDocument();
		expect(screen.queryByText("Informe a data inicial.")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
		expect(backend.listRequests).toHaveLength(1);
	});

	it("atualiza o erro do fim quando o início muda", async () => {
		mockBackend();
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		await replaceValue(user, screen.getByLabelText("De"), "01112026");
		await user.tab();
		expect(await screen.findByText(PERIOD_END_BEFORE_START_MESSAGE)).toBeInTheDocument();

		await replaceValue(user, screen.getByLabelText("De"), "01102026");
		await waitFor(() =>
			expect(screen.queryByText(PERIOD_END_BEFORE_START_MESSAGE)).not.toBeInTheDocument(),
		);
	});

	it("busca, filtra por setor e tipo e volta à primeira página a cada mudança", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });
		await user.click(screen.getByRole("button", { name: "Próxima página" }));
		await waitFor(() => expect(backend.lastList()?.page).toBe("1"));

		await user.type(screen.getByLabelText("Buscar reserva"), " ana ");
		await waitFor(() =>
			expect(backend.lastList()).toEqual({
				inicio: "2026-09-29T00:00:00",
				fim: "2026-10-29T23:59:59",
				page: "0",
				size: "5",
				busca: "ana",
			}),
		);

		await user.click(screen.getByRole("combobox", { name: "Setor" }));
		await user.click(await screen.findByRole("option", { name: "Ambulatório" }));
		await waitFor(() => expect(backend.lastList()?.setorId).toBe("1"));

		await user.click(screen.getByRole("combobox", { name: "Tipo" }));
		await user.click(await screen.findByRole("option", { name: "Recorrente" }));
		await waitFor(() =>
			expect(backend.lastList()).toEqual({
				inicio: "2026-09-29T00:00:00",
				fim: "2026-10-29T23:59:59",
				page: "0",
				size: "5",
				busca: "ana",
				setorId: "1",
				recorrente: "true",
			}),
		);
		await waitFor(() =>
			expect(screen.queryByRole("cell", { name: "Sala 02" })).not.toBeInTheDocument(),
		);
		expect(screen.getByRole("cell", { name: "Sala 01" })).toBeInTheDocument();

		await user.click(screen.getByRole("combobox", { name: "Tipo" }));
		await user.click(await screen.findByRole("option", { name: "Pontual" }));
		await waitFor(() => expect(backend.lastList()?.recorrente).toBe("false"));
	});

	it("ordena enviando sort", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		await user.click(screen.getByRole("combobox", { name: "Ordenar por" }));
		await user.click(await screen.findByRole("option", { name: "Início mais próximo" }));

		await waitFor(() => expect(backend.lastList()?.sort).toBe("horaInicio,asc"));
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeEnabled();
	});

	it("distingue o estado vazio com filtros e restaura os padrões ao limpar", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		await replaceValue(user, screen.getByLabelText("Até"), "31122026");
		await user.type(screen.getByLabelText("Buscar reserva"), "Inexistente");

		expect(await screen.findByText("Nenhuma reserva encontrada")).toBeInTheDocument();
		expect(screen.queryByText("Nenhuma reserva no período")).not.toBeInTheDocument();

		const [, emptyStateClear] = screen.getAllByRole("button", { name: "Limpar filtros" });
		await user.click(emptyStateClear as HTMLElement);

		// A lista do período padrão volta do cache, sem precisar de outra requisição.
		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
		expect(screen.getAllByText(/Mostrando/)[0]).toHaveTextContent("Mostrando 1–5 de 7");
		expect(screen.getByLabelText("Buscar reserva")).toHaveValue("");
		expect(screen.getByLabelText("Até")).toHaveValue("29/10/2026");
		expect(screen.getAllByRole("button", { name: "Limpar filtros" })).toHaveLength(1);
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
		expect(backend.listRequests.some((request) => request.busca === "Inexistente")).toBe(true);
	});

	it("cria uma reserva pontual, com o corpo exato, aviso de sucesso e recarga", async () => {
		const backend = mockBackend();
		const { user, queryClient } = renderReservations();
		queryClient.setQueryData(roomKeys.count(null), 10);
		const dialog = await openNewReservation(user);

		// Regressão: no Angular, o diálogo começava como Recorrente.
		expect(within(dialog).getByRole("radio", { name: "Pontual" })).toBeChecked();
		await fillSelects(user, dialog);
		await user.type(within(dialog).getByLabelText("Data da reserva (obrigatório)"), "24082026");
		await fillTimes(user, dialog, "0800", "0930");
		expect(within(dialog).getByLabelText("Horário de fim (obrigatório)")).toHaveValue("09:30");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(RESERVATION_CREATED_MESSAGE)).toBeInTheDocument();
		expect(backend.roomRequests.length).toBeGreaterThan(0);
		expect(new Set(backend.roomRequests)).toEqual(new Set(["/api/room/section/1?unpaged=true"]));
		expect(backend.writes).toEqual([
			{
				method: "POST",
				url: apiUrl("reservation"),
				body: {
					salaId: 11,
					solicitanteId: 7,
					horaInicio: "2026-08-24T08:00:00",
					horaFim: "2026-08-24T09:30:00",
					fixo: false,
					observacoes: "",
				},
			},
		]);
		await waitFor(() =>
			expect(screen.queryByRole("dialog", { name: "Nova reserva" })).not.toBeInTheDocument(),
		);
		await waitFor(() => expect(backend.listRequests).toHaveLength(2));
		expect(queryClient.getQueryState(roomKeys.count(null))?.isInvalidated).toBe(true);
	});

	it("cria uma reserva recorrente com período e dias da semana", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await fillSelects(user, dialog);
		await user.click(within(dialog).getByRole("radio", { name: "Recorrente" }));
		await user.type(within(dialog).getByLabelText("Data de início (obrigatório)"), "24082026");
		await user.type(within(dialog).getByLabelText("Data de fim (obrigatório)"), "04092026");
		await fillTimes(user, dialog, "1400", "1500");
		await user.click(within(dialog).getByRole("checkbox", { name: "Quarta" }));
		await user.click(within(dialog).getByRole("checkbox", { name: "Segunda" }));
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(RESERVATION_CREATED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes[0]?.body).toEqual({
			salaId: 11,
			solicitanteId: 7,
			horaInicio: "2026-08-24T14:00:00",
			horaFim: "2026-09-04T15:00:00",
			fixo: true,
			observacoes: "",
			dias: [1, 3],
		});
	});

	it("valida os campos sem chamar o backend", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByText(RESERVATION_MESSAGES.section)).toBeInTheDocument();
		expect(within(dialog).getByText(RESERVATION_MESSAGES.room)).toBeInTheDocument();
		expect(within(dialog).getByText(RESERVATION_MESSAGES.requester)).toBeInTheDocument();
		expect(within(dialog).getByText("Informe a data da reserva.")).toBeInTheDocument();
		expect(within(dialog).getByText(RESERVATION_MESSAGES.startTime)).toBeInTheDocument();
		expect(within(dialog).getByText(RESERVATION_MESSAGES.endTime)).toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	// Regressão: no Angular, fim antes do início e recorrência sem dias não eram validados.
	it("exige fim depois do início e ao menos um dia na recorrente", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await fillSelects(user, dialog);
		await user.click(within(dialog).getByRole("radio", { name: "Recorrente" }));
		await user.type(within(dialog).getByLabelText("Data de início (obrigatório)"), "24082026");
		await user.type(within(dialog).getByLabelText("Data de fim (obrigatório)"), "20082026");
		await fillTimes(user, dialog, "1000", "0900");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(
			await within(dialog).findByText(RESERVATION_MESSAGES.endTimeBeforeStart),
		).toBeInTheDocument();
		expect(within(dialog).getByText(RESERVATION_MESSAGES.endDateBeforeStart)).toBeInTheDocument();
		expect(within(dialog).getByText(RESERVATION_MESSAGES.weekdaysRequired)).toBeInTheDocument();
		expect(within(dialog).getByRole("group", { name: /Dias da semana/ })).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(backend.writes).toEqual([]);
	});

	it("libera a sala só depois do setor, mostrando o carregamento", async () => {
		const backend = mockBackend();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		server.use(
			http.get(apiUrl("room/section/:id"), async () => {
				await gate;
				return undefined;
			}),
		);
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		const room = within(dialog).getByRole("combobox", { name: "Sala (obrigatório)" });
		expect(room).toBeDisabled();
		expect(room).toHaveTextContent("Selecione o setor primeiro");

		await selectOption(user, dialog, "Setor", "Ambulatório");
		expect(await within(dialog).findByText("Carregando salas...")).toBeInTheDocument();

		release();
		await waitFor(() => expect(room).toBeEnabled());
		expect(room).toHaveTextContent("Selecione a sala");
		expect(backend.roomRequests).toEqual(["/api/room/section/1?unpaged=true"]);
	});

	it("limpa a sala ao trocar de setor e orienta quando o setor não tem salas", async () => {
		mockBackend();
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await fillSelects(user, dialog);
		await selectOption(user, dialog, "Setor", "Setor Vazio");

		const room = within(dialog).getByRole("combobox", { name: "Sala (obrigatório)" });
		expect(await within(dialog).findByText("Nenhuma sala neste setor.")).toBeInTheDocument();
		expect(room).toBeDisabled();
		expect(room).not.toHaveTextContent("Consultório 11");
		expect(within(dialog).getByRole("link", { name: "Ir para Salas" })).toHaveAttribute(
			"href",
			"/rooms?setor=2",
		);
	});

	// Regressão: no Angular, a falha ao carregar as salas aparecia como "Nenhuma sala cadastrada.".
	it("avisa quando as salas não carregam e permite tentar de novo", async () => {
		mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("room/section/:id"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await selectOption(user, dialog, "Setor", "Ambulatório");
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			RESERVATION_LOAD_ERRORS.rooms,
		);
		expect(within(dialog).queryByText("Nenhuma sala neste setor.")).not.toBeInTheDocument();

		await user.click(within(dialog).getByRole("button", { name: "Tentar novamente" }));
		await waitFor(() =>
			expect(within(dialog).getByRole("combobox", { name: "Sala (obrigatório)" })).toBeEnabled(),
		);
		expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
	});

	it("mostra o conflito de horário dentro do diálogo, que continua aberto", async () => {
		mockBackend();
		let attempts = 0;
		server.use(
			http.post(apiUrl("reservation"), () => {
				attempts++;
				return HttpResponse.json(
					{ message: "Já existe uma reserva para esta sala no horário solicitado!" },
					{ status: 400 },
				);
			}),
		);
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await fillSelects(user, dialog);
		await user.type(within(dialog).getByLabelText("Data da reserva (obrigatório)"), "24082026");
		await fillTimes(user, dialog, "0800", "0900");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Já existe uma reserva para esta sala no horário solicitado!",
		);
		expect(screen.getByRole("dialog", { name: "Nova reserva" })).toBeInTheDocument();
		expect(screen.queryByText(RESERVATION_CREATED_MESSAGE)).not.toBeInTheDocument();

		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
		await waitFor(() => expect(attempts).toBe(2));
	});

	// Regressão: no Angular, salvar não mostrava andamento e o clique duplo gerava conflito.
	it("mostra Salvando… e bloqueia um segundo envio enquanto salva", async () => {
		const backend = mockBackend();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		server.use(
			http.post(apiUrl("reservation"), async ({ request }) => {
				backend.writes.push({ method: "POST", url: request.url });
				await gate;
				return HttpResponse.json({ id: 100 }, { status: 201 });
			}),
		);
		const { user } = renderReservations();
		const dialog = await openNewReservation(user);

		await fillSelects(user, dialog);
		await user.type(within(dialog).getByLabelText("Data da reserva (obrigatório)"), "24082026");
		await fillTimes(user, dialog, "0800", "0900");
		await user.dblClick(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByRole("button", { name: "Salvando…" })).toBeDisabled();
		release();
		expect(await screen.findByText(RESERVATION_CREATED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toHaveLength(1);
	});

	// Regressão: no Angular, o ícone de cancelar não funcionava pelo teclado.
	it("cancela uma reserva pontual pelo teclado, com aviso de sucesso", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();

		const cancelButton = await screen.findByRole("button", {
			name: "Cancelar reserva de Sala 02 em 02/10/2026 08:00",
		});
		cancelButton.focus();
		await user.keyboard("{Enter}");

		const confirm = await screen.findByRole("alertdialog", { name: "Cancelar a reserva?" });
		expect(within(confirm).getByText(/Sala 02 para Ana Souza/)).toBeInTheDocument();
		expect(within(confirm).queryByRole("radio")).not.toBeInTheDocument();
		await user.click(within(confirm).getByRole("button", { name: "Cancelar reserva" }));

		expect(await screen.findByText(RESERVATION_CANCELLED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "PATCH", url: apiUrl("reservation/2") }]);
		await waitFor(() =>
			expect(screen.queryByRole("cell", { name: "Sala 02" })).not.toBeInTheDocument(),
		);
	});

	// Regressão: no Angular, fechar a confirmação simples gerava um erro de execução.
	it("não faz nada ao voltar da confirmação", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();

		await user.click(
			await screen.findByRole("button", {
				name: "Cancelar reserva de Sala 02 em 02/10/2026 08:00",
			}),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Voltar" }));

		await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
		expect(backend.writes).toEqual([]);
		expect(screen.getByRole("cell", { name: "Sala 02" })).toBeInTheDocument();
	});

	it("numa série, cancela só a ocorrência escolhida por padrão", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();

		await user.click(
			await screen.findByRole("button", {
				name: "Cancelar reserva de Sala 01 em 01/10/2026 08:00",
			}),
		);
		const confirm = await screen.findByRole("alertdialog");
		expect(within(confirm).getByRole("radio", { name: "Só esta reserva" })).toBeChecked();
		await user.click(within(confirm).getByRole("button", { name: "Cancelar reserva" }));

		expect(await screen.findByText(RESERVATION_CANCELLED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "PATCH", url: apiUrl("reservation/1") }]);
	});

	it("numa série, cancela a série inteira quando escolhido", async () => {
		const backend = mockBackend();
		const { user } = renderReservations();

		await user.click(
			await screen.findByRole("button", {
				name: "Cancelar reserva de Sala 01 em 01/10/2026 08:00",
			}),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(
			within(confirm).getByRole("radio", {
				name: "Toda a série (inclusive datas que já passaram)",
			}),
		);
		await user.click(within(confirm).getByRole("button", { name: "Cancelar a série" }));

		expect(await screen.findByText(SERIES_CANCELLED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "DELETE", url: apiUrl("reservation/recurrent/50") }]);
	});

	it("mostra o erro do cancelamento dentro da confirmação", async () => {
		mockBackend();
		server.use(
			http.patch(apiUrl("reservation/:id"), () => new HttpResponse(null, { status: 500 })),
		);
		const { user } = renderReservations();

		await user.click(
			await screen.findByRole("button", {
				name: "Cancelar reserva de Sala 02 em 02/10/2026 08:00",
			}),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Cancelar reserva" }));

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(
			RESERVATION_ERROR_MESSAGES.cancel,
		);
		expect(screen.getAllByText(RESERVATION_ERROR_MESSAGES.cancel)).toHaveLength(1);
		expect(screen.queryByText(RESERVATION_CANCELLED_MESSAGE)).not.toBeInTheDocument();
	});

	// Regressão: no Angular, a lista voltava a um período e tamanho fixos depois de cancelar.
	it("mantém o período e volta de página ao cancelar o último item da última página", async () => {
		const backend = mockBackend({ reservations: RESERVATIONS.slice(0, 6) });
		const { user } = renderReservations();
		await screen.findByRole("cell", { name: "Sala 01" });

		await replaceValue(user, screen.getByLabelText("Até"), "31122026");
		await waitFor(() => expect(backend.lastList()?.fim).toBe("2026-12-31T23:59:59"));
		await user.click(screen.getByRole("button", { name: "Última página" }));
		await user.click(
			await screen.findByRole("button", {
				name: "Cancelar reserva de Sala 06 em 06/10/2026 08:00",
			}),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Cancelar reserva" }));

		expect(await screen.findByRole("cell", { name: "Sala 05" })).toBeInTheDocument();
		expect(backend.lastList()).toEqual({
			inicio: "2026-09-29T00:00:00",
			fim: "2026-12-31T23:59:59",
			page: "0",
			size: "5",
		});
		expect(screen.queryByText("Nenhuma reserva encontrada")).not.toBeInTheDocument();
	});

	it("mostra o estado vazio do período padrão com ação de nova reserva", async () => {
		mockBackend({ reservations: [] });
		renderReservations();

		expect(await screen.findByText("Nenhuma reserva no período")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Nova reserva" })).toHaveLength(2);
	});

	it("mostra erro com opção de tentar novamente", async () => {
		mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("reservation"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderReservations();

		await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));

		expect(await screen.findByRole("cell", { name: "Sala 01" })).toBeInTheDocument();
	});

	describe("por perfil", () => {
		it("assistente cria só reservas pontuais e cancela só as que não são de série", async () => {
			mockBackend();
			const { user } = renderApp("/reservation", { authenticated: true, role: "ASSISTANT" });
			await screen.findByRole("cell", { name: "Sala 01" });

			expect(
				within(rowOf("Sala 01")).queryByRole("button", { name: /Cancelar reserva/ }),
			).not.toBeInTheDocument();
			expect(
				within(rowOf("Sala 02")).getByRole("button", { name: /Cancelar reserva/ }),
			).toBeInTheDocument();

			const dialog = await openNewReservation(user);
			expect(within(dialog).queryByRole("radio", { name: "Recorrente" })).not.toBeInTheDocument();
			expect(within(dialog).getByText(RECURRING_RESERVATION_HINT)).toBeInTheDocument();
			expect(within(dialog).getByLabelText("Data da reserva (obrigatório)")).toBeInTheDocument();
		});

		it("visualizador só consulta: sem nova reserva e sem cancelar", async () => {
			mockBackend();
			renderApp("/reservation", { authenticated: true, role: "VIEWER" });
			await screen.findByRole("cell", { name: "Sala 01" });

			expect(screen.queryByRole("button", { name: "Nova reserva" })).not.toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /Cancelar reserva/ })).not.toBeInTheDocument();
			expect(screen.queryByRole("columnheader", { name: "Ações" })).not.toBeInTheDocument();
		});

		it("visualizador vê o estado vazio sem o atalho de nova reserva", async () => {
			mockBackend({ reservations: [] });
			renderApp("/reservation", { authenticated: true, role: "VIEWER" });

			expect(await screen.findByText("Nenhuma reserva no período")).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: "Nova reserva" })).not.toBeInTheDocument();
		});
	});
});
