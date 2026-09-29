import type { Absence } from "@/features/absences/types";
import type { Reservation } from "@/features/reservations/types";
import {
	datePart,
	eventDescription,
	groupEventsByDay,
	matchesEventSearch,
	reservationKind,
	reservationTimeRange,
} from "./events";

const RANGE = { inicio: "2026-08-30", fim: "2026-10-10" };

const reservation = (id: number, overrides: Partial<Reservation> = {}): Reservation => ({
	reservationId: id,
	horaInicio: "2026-09-29T08:00:00",
	horaFim: "2026-09-29T09:00:00",
	sala: `Sala ${id}`,
	setor: "Ambulatório",
	solicitante: "Ana Souza",
	salaId: id,
	solicitanteId: 1,
	...overrides,
});

const absence = (id: number, overrides: Partial<Absence> = {}): Absence => ({
	id,
	solicitanteId: 1,
	solicitanteNome: "Bruno Lima",
	dataInicio: "2026-09-28",
	dataFim: "2026-09-30",
	...overrides,
});

const keysOf = (map: Map<string, { key: string }[]>, day: string) =>
	(map.get(day) ?? []).map((event) => event.key);

describe("reservationKind", () => {
	it("segue a regra de cores do Angular", () => {
		expect(reservationKind(reservation(1))).toBe("pontual");
		expect(reservationKind(reservation(1, { recorrenciaId: 9 }))).toBe("recorrente");
		expect(reservationKind(reservation(1, { recorrenciaId: 9, profissionalAusente: true }))).toBe(
			"livre",
		);
	});
});

describe("datas e horários", () => {
	it("lê a data e o horário do texto, sem conversão de fuso", () => {
		expect(datePart("2026-09-29T22:30:00")).toBe("2026-09-29");
		expect(datePart("inválido")).toBeNull();
		expect(reservationTimeRange(reservation(1, { horaFim: "2026-09-29T09:30:00" }))).toBe(
			"08:00 às 09:30",
		);
	});

	it("descreve o evento por completo", () => {
		expect(
			eventDescription({
				type: "reservation",
				key: "r",
				kind: "recorrente",
				reservation: reservation(3, { recorrenciaId: 9 }),
			}),
		).toBe("08:00 às 09:00, Sala 3 - Ambulatório, Recorrente");
		expect(
			eventDescription({ type: "absence", key: "a", kind: "livre", absence: absence(1) }),
		).toBe("Bruno Lima: ausência/férias");
	});
});

describe("matchesEventSearch", () => {
	const reservationEvent = (overrides: Partial<Reservation> = {}) =>
		({
			type: "reservation",
			key: "r",
			kind: "pontual",
			reservation: reservation(17, {
				sala: "SALA 17",
				setor: "Clínica Médica 1",
				horaInicio: "2026-11-02T07:00:00",
				horaFim: "2026-11-02T12:00:00",
				criador: "Maria Admin",
				...overrides,
			}),
		}) as const;
	const absenceEvent = { type: "absence", key: "a", kind: "livre", absence: absence(1) } as const;

	it("aceita tudo com a busca vazia ou só com espaços", () => {
		expect(matchesEventSearch(reservationEvent(), "")).toBe(true);
		expect(matchesEventSearch(reservationEvent(), "   ")).toBe(true);
		expect(matchesEventSearch(absenceEvent, "")).toBe(true);
	});

	it.each([
		["sala", "sala 17"],
		["setor", "clínica médica"],
		["sala e setor juntos, como na lista", "sala 17 - clinica"],
		["horário", "07:00"],
		["solicitante", "ana souza"],
		["quem criou", "maria"],
		["tipo", "pontual"],
	])("encontra a reserva pelo(a) %s", (_, term) => {
		expect(matchesEventSearch(reservationEvent(), term)).toBe(true);
	});

	it("ignora acentos e maiúsculas", () => {
		expect(matchesEventSearch(reservationEvent(), "CLINICA MEDICA")).toBe(true);
	});

	it("não encontra quando nenhum campo contém o termo", () => {
		expect(matchesEventSearch(reservationEvent(), "cardiologia")).toBe(false);
	});

	it("não quebra quando a reserva não informa quem criou", () => {
		expect(matchesEventSearch(reservationEvent({ criador: null }), "maria")).toBe(false);
	});

	it("encontra a ausência pelo profissional ou pelo tipo", () => {
		expect(matchesEventSearch(absenceEvent, "bruno")).toBe(true);
		expect(matchesEventSearch(absenceEvent, "férias")).toBe(true);
		expect(matchesEventSearch(absenceEvent, "sala")).toBe(false);
	});
});

describe("groupEventsByDay", () => {
	// Regressão: no Angular, a data vinha do `toISOString`, em UTC, e a reserva das 22h ia para
	// o dia seguinte.
	it("mantém a reserva da noite no próprio dia", () => {
		const late = reservation(1, {
			horaInicio: "2026-09-29T22:00:00",
			horaFim: "2026-09-29T23:00:00",
		});

		const byDay = groupEventsByDay([late], [], RANGE);

		expect(keysOf(byDay, "2026-09-29")).toEqual(["reservation-1"]);
		expect(byDay.has("2026-09-30")).toBe(false);
	});

	it("repete a ausência em cada dia e corta o que fica fora da grade", () => {
		const long = absence(1, { dataInicio: "2026-08-25", dataFim: "2026-09-01" });

		const byDay = groupEventsByDay([], [long], RANGE);

		expect([...byDay.keys()]).toEqual(["2026-08-30", "2026-08-31", "2026-09-01"]);
		expect(keysOf(byDay, "2026-08-31")).toEqual(["absence-1-2026-08-31"]);
	});

	it("ignora ausências sem datas ou fora do período e reservas fora da grade", () => {
		const byDay = groupEventsByDay(
			[reservation(1, { horaInicio: "2026-10-11T08:00:00" })],
			[
				absence(1, { dataInicio: null }),
				absence(2, { dataInicio: "2026-11-01", dataFim: "2026-11-02" }),
			],
			RANGE,
		);

		expect(byDay.size).toBe(0);
	});

	it("põe as ausências primeiro e as reservas pelo horário", () => {
		const byDay = groupEventsByDay(
			[
				reservation(1, { horaInicio: "2026-09-29T14:00:00" }),
				reservation(10, { horaInicio: "2026-09-29T08:00:00" }),
				reservation(2, { horaInicio: "2026-09-29T08:00:00" }),
			],
			[absence(7, { solicitanteNome: "Zélia" }), absence(8, { solicitanteNome: "Ana" })],
			RANGE,
		);

		expect(keysOf(byDay, "2026-09-29")).toEqual([
			"absence-8-2026-09-29",
			"absence-7-2026-09-29",
			"reservation-2",
			"reservation-10",
			"reservation-1",
		]);
	});
});
