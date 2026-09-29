import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Absence } from "@/features/absences/types";
import type { Requester } from "@/features/requesters/types";
import { RESERVATION_CREATED_MESSAGE } from "@/features/reservations/ReservationFormDialog";
import type { Reservation, ReservationWriteDto } from "@/features/reservations/types";
import type { Room } from "@/features/rooms/types";
import type { Section } from "@/features/sections/types";
import { GENERIC_ERROR_MESSAGE } from "@/lib/api/error-handler";
import { CALENDAR_LOAD_ERRORS } from "./CalendarPage";
import { DAY_EVENTS_EMPTY_MESSAGE, DAY_EVENTS_SEARCH_LABEL } from "./DayEventsPopover";

type User = ReturnType<typeof renderApp>["user"];

const reservation = (id: number, overrides: Partial<Reservation> = {}): Reservation => ({
	reservationId: id,
	horaInicio: "2026-09-29T08:00:00",
	horaFim: "2026-09-29T09:00:00",
	sala: `Sala ${String(id).padStart(2, "0")}`,
	setor: "Ambulatório",
	solicitante: "Ana Souza",
	criador: "Maria Admin",
	salaId: id,
	setorId: 1,
	solicitanteId: 7,
	profissionalAusente: false,
	...overrides,
});

/** Cinco reservas no dia 10, para o "+N mais". */
const BUSY_DAY = Array.from({ length: 5 }, (_, index) =>
	reservation(20 + index, {
		horaInicio: `2026-09-10T${String(8 + index).padStart(2, "0")}:00:00`,
		horaFim: `2026-09-10T${String(9 + index).padStart(2, "0")}:00:00`,
	}),
);

const RESERVATIONS: Reservation[] = [
	// 22h: no Angular, aparecia no dia 30.
	reservation(1, { horaInicio: "2026-09-29T22:00:00", horaFim: "2026-09-29T23:00:00" }),
	reservation(2, { recorrenciaId: 50 }),
	reservation(3, {
		horaInicio: "2026-09-15T10:00:00",
		horaFim: "2026-09-15T11:00:00",
		profissionalAusente: true,
	}),
	reservation(4, {
		horaInicio: "2026-09-16T14:00:00",
		horaFim: "2026-09-16T15:00:00",
		sala: "Sala Cardio",
		setor: "Cardiologia",
		setorId: 2,
	}),
	...BUSY_DAY,
];

const ABSENCES: Absence[] = [
	{
		id: 1,
		solicitanteId: 8,
		solicitanteNome: "Bruno Lima",
		dataInicio: "2026-09-21",
		dataFim: "2026-09-22",
	},
];

const SECTIONS: Section[] = [
	{ id: 1, nome: "Ambulatório" },
	{ id: 2, nome: "Cardiologia" },
];

const ROOMS: Room[] = [
	{ id: 11, nome: "Consultório 11", setor: "Ambulatório", setorId: 1, ocupada: false },
];

const REQUESTERS: Requester[] = [{ id: 7, nome: "Ana Souza", especialidade: "Cardiologia" }];

interface ListRequest {
	inicio: string | null;
	fim: string | null;
	setorId: string | null;
	page: string | null;
	size: string | null;
}

/** Backend em memória: reservas paginadas (com filtro de setor), ausências e criação. */
function mockBackend() {
	let current = [...RESERVATIONS];
	let nextId = 100;
	const listRequests: ListRequest[] = [];
	const posts: unknown[] = [];

	server.use(
		http.get(apiUrl("reservation"), ({ request }) => {
			const params = new URL(request.url).searchParams;
			const setorId = params.get("setorId");
			listRequests.push({
				inicio: params.get("inicio"),
				fim: params.get("fim"),
				setorId,
				page: params.get("page"),
				size: params.get("size"),
			});
			const filtered = setorId
				? current.filter((item) => item.setorId === Number(setorId))
				: current;
			return HttpResponse.json(
				paged(filtered, Number(params.get("page")), Number(params.get("size"))),
			);
		}),
		http.post(apiUrl("reservation"), async ({ request }) => {
			const body = (await request.json()) as ReservationWriteDto;
			posts.push(body);
			current = [
				...current,
				reservation(nextId++, {
					horaInicio: body.horaInicio,
					horaFim: body.horaFim,
					sala: "Consultório 11",
					salaId: body.salaId,
				}),
			];
			return HttpResponse.json({ id: nextId }, { status: 201 });
		}),
		http.get(apiUrl("requester-absence"), () => HttpResponse.json(ABSENCES)),
		http.get(apiUrl("section"), () => HttpResponse.json(SECTIONS)),
		http.get(apiUrl("room/section/:id"), () => HttpResponse.json(ROOMS)),
		http.get(apiUrl("requester"), () => HttpResponse.json(REQUESTERS)),
	);

	return { listRequests, posts, lastList: () => listRequests.at(-1) };
}

const renderCalendar = () => renderApp("/calendar", { authenticated: true });

const day = (label: string) => screen.getByRole("group", { name: label });

const NIGHT_EVENT = "22:00 às 23:00, Sala 01 - Ambulatório, Pontual";

async function waitForEvents() {
	return screen.findByRole("button", { name: NIGHT_EVENT });
}

async function selectOption(user: User, combobox: HTMLElement, option: string) {
	await user.click(combobox);
	await user.click(await screen.findByRole("option", { name: option }));
}

describe("Calendário", () => {
	// A tela é carregada sob demanda; importá-la antes evita que o primeiro teste pague a
	// importação dentro do tempo de espera do `findBy` quando a suíte roda em paralelo.
	beforeAll(async () => {
		await import("./CalendarPage");
	});

	beforeEach(() => {
		// Só o relógio é simulado, para não travar os atrasos do user-event.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(2026, 8, 29, 22, 30));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("mostra o carregamento e depois os eventos de cada dia, no dia certo", async () => {
		const backend = mockBackend();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		server.use(
			http.get(apiUrl("reservation"), async () => {
				await gate;
				return undefined;
			}),
		);
		renderCalendar();

		expect(
			await screen.findByRole("heading", { level: 2, name: "setembro de 2026" }),
		).toBeVisible();
		expect(screen.getByRole("status")).toHaveTextContent("Carregando…");
		expect(screen.getByRole("region", { name: "Calendário de setembro de 2026" })).toHaveAttribute(
			"aria-busy",
			"true",
		);
		expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(42);

		release();

		// Regressão: no Angular, a reserva das 22h aparecia no dia seguinte.
		const tuesday = day("terça-feira, 29 de setembro de 2026");
		expect(await within(tuesday).findByRole("button", { name: NIGHT_EVENT })).toBeInTheDocument();
		expect(
			within(day("quarta-feira, 30 de setembro de 2026")).queryByRole("button", {
				name: NIGHT_EVENT,
			}),
		).not.toBeInTheDocument();
		expect(
			within(tuesday).getByRole("button", {
				name: "08:00 às 09:00, Sala 02 - Ambulatório, Recorrente",
			}),
		).toBeInTheDocument();
		expect(
			within(day("terça-feira, 15 de setembro de 2026")).getByRole("button", {
				name: "10:00 às 11:00, Sala 03 - Ambulatório, Livre (férias / ausência)",
			}),
		).toBeInTheDocument();
		for (const label of [
			"segunda-feira, 21 de setembro de 2026",
			"terça-feira, 22 de setembro de 2026",
		]) {
			expect(
				within(day(label)).getByRole("button", { name: "Bruno Lima: ausência/férias" }),
			).toBeInTheDocument();
		}

		expect(screen.getByRole("status")).toHaveTextContent("");
		expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0);
		expect(screen.getByRole("button", { name: "Nova reserva em 29/09/2026" })).toHaveAttribute(
			"aria-current",
			"date",
		);
		expect(screen.getByRole("list", { name: "Legenda" })).toHaveTextContent(
			"PontualRecorrenteLivre (férias / ausência)",
		);
		expect(backend.listRequests).toEqual([
			{
				inicio: "2026-08-30T00:00:00",
				fim: "2026-10-10T23:59:59",
				setorId: null,
				page: "0",
				size: "500",
			},
		]);
	});

	it("navega entre os meses pedindo o período visível de cada um", async () => {
		const backend = mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();
		expect(screen.getByRole("button", { name: "Hoje" })).toBeDisabled();

		await user.click(screen.getByRole("button", { name: "Próximo mês" }));
		expect(screen.getByRole("heading", { level: 2, name: "outubro de 2026" })).toBeInTheDocument();
		await waitFor(() =>
			expect(backend.lastList()).toMatchObject({
				inicio: "2026-09-27T00:00:00",
				fim: "2026-11-07T23:59:59",
			}),
		);
		expect(screen.getByRole("button", { name: "Hoje" })).toBeEnabled();

		await user.click(screen.getByRole("button", { name: "Hoje" }));
		expect(screen.getByRole("heading", { level: 2, name: "setembro de 2026" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Mês anterior" }));
		expect(screen.getByRole("heading", { level: 2, name: "agosto de 2026" })).toBeInTheDocument();
		await waitFor(() =>
			expect(backend.lastList()).toMatchObject({
				inicio: "2026-07-26T00:00:00",
				fim: "2026-09-05T23:59:59",
			}),
		);
	});

	it("salta para qualquer mês e ano pelos selects, sincronizados com as setas e o Hoje", async () => {
		const backend = mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();
		const monthSelect = screen.getByRole("combobox", { name: "Mês" });
		const yearSelect = screen.getByRole("combobox", { name: "Ano" });
		expect(monthSelect).toHaveTextContent("Setembro");
		expect(yearSelect).toHaveTextContent("2026");

		await selectOption(user, monthSelect, "Março");
		expect(screen.getByRole("heading", { level: 2, name: "março de 2026" })).toBeInTheDocument();

		await selectOption(user, yearSelect, "2028");
		expect(screen.getByRole("heading", { level: 2, name: "março de 2028" })).toBeInTheDocument();
		await waitFor(() =>
			expect(backend.lastList()).toMatchObject({
				inicio: "2028-02-27T00:00:00",
				fim: "2028-04-08T23:59:59",
			}),
		);
		expect(screen.getByRole("button", { name: "Hoje" })).toBeEnabled();

		await user.click(screen.getByRole("button", { name: "Próximo mês" }));
		expect(screen.getByRole("heading", { level: 2, name: "abril de 2028" })).toBeInTheDocument();
		expect(monthSelect).toHaveTextContent("Abril");
		expect(yearSelect).toHaveTextContent("2028");

		await user.click(screen.getByRole("button", { name: "Hoje" }));
		expect(screen.getByRole("heading", { level: 2, name: "setembro de 2026" })).toBeInTheDocument();
		expect(monthSelect).toHaveTextContent("Setembro");
		expect(yearSelect).toHaveTextContent("2026");
	});

	it("mostra o carregamento ao saltar de mês pelos selects", async () => {
		mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		server.use(
			http.get(apiUrl("reservation"), async () => {
				await gate;
				return undefined;
			}),
		);

		await selectOption(user, screen.getByRole("combobox", { name: "Ano" }), "2030");

		expect(await screen.findByText("Carregando…")).toBeInTheDocument();
		release();
		await waitFor(() => expect(screen.queryByText("Carregando…")).not.toBeInTheDocument());
	});

	it("filtra por setor e já traz o setor escolhido na nova reserva", async () => {
		const backend = mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();

		await selectOption(user, screen.getByRole("combobox", { name: "Setor" }), "Cardiologia");

		await waitFor(() => expect(backend.lastList()?.setorId).toBe("2"));
		expect(
			await screen.findByRole("button", {
				name: "14:00 às 15:00, Sala Cardio - Cardiologia, Pontual",
			}),
		).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.queryByRole("button", { name: NIGHT_EVENT })).not.toBeInTheDocument(),
		);
		// As ausências são do solicitante, não do setor, e continuam aparecendo.
		expect(screen.getAllByRole("button", { name: "Bruno Lima: ausência/férias" })).toHaveLength(2);

		await user.click(screen.getByRole("button", { name: "Nova reserva" }));
		const dialog = await screen.findByRole("dialog", { name: "Nova reserva" });
		expect(within(dialog).getByRole("combobox", { name: "Setor (obrigatório)" })).toHaveTextContent(
			"Cardiologia",
		);
		expect(within(dialog).getByLabelText("Data da reserva (obrigatório)")).toHaveValue(
			"29/09/2026",
		);
	});

	it("mostra os demais eventos do dia no +N mais", async () => {
		mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();

		const busy = day("quinta-feira, 10 de setembro de 2026");
		expect(within(busy).getAllByRole("button", { name: /Sala 2\d - Ambulatório/ })).toHaveLength(2);

		await user.click(within(busy).getByRole("button", { name: "+3 mais em 10/09/2026" }));
		const popover = await screen.findByRole("dialog", {
			name: "Eventos de quinta-feira, 10 de setembro de 2026",
		});
		expect(within(popover).getAllByRole("button")).toHaveLength(5);
		expect(within(popover).getByText("5 eventos")).toBeInTheDocument();

		const item = within(popover).getByRole("button", {
			name: "12:00 às 13:00, Sala 24 - Ambulatório, Pontual",
		});
		expect(item).toHaveTextContent("12:00 às 13:00");
		expect(item).toHaveTextContent("Sala 24 - Ambulatório");
		expect(item).toHaveTextContent("Pontual");

		await user.click(item);
		const details = await screen.findByRole("dialog", { name: "Detalhes da reserva" });
		expect(within(details).getByText("10/09/2026 12:00 – 10/09/2026 13:00")).toBeInTheDocument();
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: /Eventos de quinta-feira/ }),
			).not.toBeInTheDocument(),
		);
	});

	it("busca entre os eventos do dia no +N mais e reabre com a lista completa", async () => {
		mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();
		const busy = day("quinta-feira, 10 de setembro de 2026");
		const popoverName = "Eventos de quinta-feira, 10 de setembro de 2026";

		await user.click(within(busy).getByRole("button", { name: "+3 mais em 10/09/2026" }));
		let popover = await screen.findByRole("dialog", { name: popoverName });
		const search = within(popover).getByRole("searchbox", { name: DAY_EVENTS_SEARCH_LABEL });
		expect(search).toHaveFocus();

		await user.type(search, "sala 24");
		expect(within(popover).getAllByRole("button")).toHaveLength(1);
		expect(
			within(popover).getByRole("button", {
				name: "12:00 às 13:00, Sala 24 - Ambulatório, Pontual",
			}),
		).toBeInTheDocument();
		expect(within(popover).getByText("1 de 5 eventos")).toBeInTheDocument();

		await user.clear(search);
		await user.type(search, "cardiologia");
		expect(within(popover).queryAllByRole("button")).toHaveLength(0);
		expect(within(popover).getByText(DAY_EVENTS_EMPTY_MESSAGE)).toBeInTheDocument();
		expect(within(popover).getByText("0 de 5 eventos")).toBeInTheDocument();

		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog", { name: popoverName })).not.toBeInTheDocument(),
		);

		await user.click(within(busy).getByRole("button", { name: "+3 mais em 10/09/2026" }));
		popover = await screen.findByRole("dialog", { name: popoverName });
		expect(within(popover).getByRole("searchbox", { name: DAY_EVENTS_SEARCH_LABEL })).toHaveValue(
			"",
		);
		expect(within(popover).getAllByRole("button")).toHaveLength(5);
		expect(within(popover).getByText("5 eventos")).toBeInTheDocument();
	});

	it("mostra os detalhes da reserva e da ausência", async () => {
		mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();

		await user.click(
			screen.getByRole("button", { name: "08:00 às 09:00, Sala 02 - Ambulatório, Recorrente" }),
		);
		const reservationDialog = await screen.findByRole("dialog", { name: "Detalhes da reserva" });
		expect(within(reservationDialog).getByText("Sala 02 - Ambulatório")).toBeInTheDocument();
		expect(within(reservationDialog).getByText("Recorrente")).toBeInTheDocument();
		expect(within(reservationDialog).getByText("Ana Souza")).toBeInTheDocument();
		expect(within(reservationDialog).getByText("Maria Admin")).toBeInTheDocument();
		expect(
			within(reservationDialog).getByText("29/09/2026 08:00 – 29/09/2026 09:00"),
		).toBeInTheDocument();
		await user.click(within(reservationDialog).getByRole("button", { name: "Fechar" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

		await user.click(
			screen.getAllByRole("button", { name: "Bruno Lima: ausência/férias" })[0] as HTMLElement,
		);
		const absenceDialog = await screen.findByRole("dialog", { name: "Detalhes da ausência" });
		expect(within(absenceDialog).getByText("Ausência / férias")).toBeInTheDocument();
		expect(within(absenceDialog).getByText("Bruno Lima")).toBeInTheDocument();
		expect(within(absenceDialog).getByText("21/09/2026 – 22/09/2026")).toBeInTheDocument();
		expect(within(absenceDialog).queryByText("Criado por")).not.toBeInTheDocument();
	});

	it("cria uma reserva pelo dia clicado e atualiza a grade sem recarregar a página", async () => {
		const backend = mockBackend();
		const { user } = renderCalendar();
		await waitForEvents();

		await user.click(screen.getByRole("button", { name: "Nova reserva em 01/10/2026" }));
		const dialog = await screen.findByRole("dialog", { name: "Nova reserva" });
		expect(within(dialog).getByLabelText("Data da reserva (obrigatório)")).toHaveValue(
			"01/10/2026",
		);
		expect(within(dialog).getByRole("combobox", { name: "Setor (obrigatório)" })).toHaveTextContent(
			"Selecione o setor",
		);

		await selectOption(
			user,
			within(dialog).getByRole("combobox", { name: "Setor (obrigatório)" }),
			"Ambulatório",
		);
		const room = within(dialog).getByRole("combobox", { name: "Sala (obrigatório)" });
		await waitFor(() => expect(room).toBeEnabled());
		await selectOption(user, room, "Consultório 11");
		await selectOption(
			user,
			within(dialog).getByRole("combobox", { name: "Solicitante (obrigatório)" }),
			"Ana Souza - Cardiologia",
		);
		await user.type(within(dialog).getByLabelText("Horário de início (obrigatório)"), "0800");
		await user.type(within(dialog).getByLabelText("Horário de fim (obrigatório)"), "0900");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(RESERVATION_CREATED_MESSAGE)).toBeInTheDocument();
		expect(backend.posts).toEqual([
			{
				salaId: 11,
				solicitanteId: 7,
				horaInicio: "2026-10-01T08:00:00",
				horaFim: "2026-10-01T09:00:00",
				fixo: false,
				observacoes: "",
			},
		]);
		expect(
			await within(day("quinta-feira, 1 de outubro de 2026")).findByRole("button", {
				name: "08:00 às 09:00, Consultório 11 - Ambulatório, Pontual",
			}),
		).toBeInTheDocument();
		expect(backend.listRequests).toHaveLength(2);
	});

	it("avisa quando as reservas não carregam e permite tentar de novo", async () => {
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
		const { user } = renderCalendar();

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent(CALENDAR_LOAD_ERRORS.reservations);
		// O erro aparece uma única vez, na própria tela.
		expect(screen.getAllByText(CALENDAR_LOAD_ERRORS.reservations)).toHaveLength(1);

		await user.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

		expect(await waitForEvents()).toBeInTheDocument();
		expect(screen.queryByText(CALENDAR_LOAD_ERRORS.reservations)).not.toBeInTheDocument();
	});

	it("mostra as reservas mesmo quando as ausências não carregam", async () => {
		mockBackend();
		server.use(
			http.get(apiUrl("requester-absence"), () => new HttpResponse(null, { status: 500 })),
		);
		renderCalendar();

		expect(await waitForEvents()).toBeInTheDocument();
		expect(await screen.findByText(CALENDAR_LOAD_ERRORS.absences)).toBeInTheDocument();
		// O erro aparece uma única vez, na própria tela, sem o aviso no canto.
		expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Bruno Lima: ausência/férias" }),
		).not.toBeInTheDocument();
	});

	it("leva ao login quando a sessão expira", async () => {
		mockBackend();
		server.use(http.get(apiUrl("reservation"), () => new HttpResponse(null, { status: 401 })));
		const { location } = renderCalendar();

		await waitFor(() => expect(location()).toBe("/login"));
	});
});
