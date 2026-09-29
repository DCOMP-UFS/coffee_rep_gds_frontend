import {
	defaultReservationPeriod,
	emptyReservationForm,
	PERIOD_END_BEFORE_START_MESSAGE,
	RESERVATION_MESSAGES,
	type ReservationFormInput,
	reservationFormSchema,
	reservationPeriodSchema,
	toReservationWriteDto,
} from "./schemas";

const issuesByPath = (result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
	Object.fromEntries(
		(result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]),
	);

const pontual = (overrides: Partial<ReservationFormInput> = {}): ReservationFormInput => ({
	...emptyReservationForm(),
	setorId: 1,
	salaId: 10,
	solicitanteId: 7,
	dataInicio: "24/08/2026",
	horaInicio: "08:00",
	horaFim: "09:30",
	...overrides,
});

// 24/08/2026 é uma segunda-feira.
const recorrente = (overrides: Partial<ReservationFormInput> = {}): ReservationFormInput =>
	pontual({ tipo: "recorrente", dataFim: "04/09/2026", dias: [3, 1], ...overrides });

describe("defaultReservationPeriod", () => {
	it("usa a data local de hoje e daqui a 30 dias", () => {
		expect(defaultReservationPeriod(new Date(2026, 8, 29, 22, 30))).toEqual({
			inicio: "29/09/2026",
			fim: "29/10/2026",
		});
	});
});

describe("reservationPeriodSchema", () => {
	it("aceita um período válido", () => {
		expect(
			reservationPeriodSchema.safeParse({ inicio: "01/09/2026", fim: "01/09/2026" }).success,
		).toBe(true);
	});

	it("exige as duas datas", () => {
		expect(issuesByPath(reservationPeriodSchema.safeParse({ inicio: "", fim: "" }))).toEqual({
			inicio: "Informe a data inicial.",
			fim: "Informe a data final.",
		});
	});

	it("acusa data final antes da inicial", () => {
		expect(
			issuesByPath(reservationPeriodSchema.safeParse({ inicio: "10/09/2026", fim: "01/09/2026" })),
		).toEqual({ fim: PERIOD_END_BEFORE_START_MESSAGE });
	});
});

describe("reservationFormSchema", () => {
	it("mostra todos os erros juntos no formulário vazio", () => {
		expect(issuesByPath(reservationFormSchema.safeParse(emptyReservationForm()))).toEqual({
			setorId: RESERVATION_MESSAGES.section,
			salaId: RESERVATION_MESSAGES.room,
			solicitanteId: RESERVATION_MESSAGES.requester,
			horaInicio: RESERVATION_MESSAGES.startTime,
			horaFim: RESERVATION_MESSAGES.endTime,
			dataInicio: "Informe a data da reserva.",
		});
	});

	it("exige fim depois do início, no campo de fim", () => {
		expect(
			issuesByPath(
				reservationFormSchema.safeParse(pontual({ horaInicio: "10:00", horaFim: "10:00" })),
			),
		).toEqual({ horaFim: RESERVATION_MESSAGES.endTimeBeforeStart });
	});

	it("acusa data em formato incompleto e inexistente", () => {
		expect(issuesByPath(reservationFormSchema.safeParse(pontual({ dataInicio: "24/08" })))).toEqual(
			{
				dataInicio: "Informe a data no formato DD/MM/AAAA.",
			},
		);
		expect(
			issuesByPath(reservationFormSchema.safeParse(pontual({ dataInicio: "31/02/2026" }))),
		).toEqual({ dataInicio: "Data inválida." });
	});

	it("na recorrente exige início, fim e ao menos um dia", () => {
		expect(
			issuesByPath(
				reservationFormSchema.safeParse(recorrente({ dataInicio: "", dataFim: "", dias: [] })),
			),
		).toEqual({
			dataInicio: "Informe a data de início.",
			dataFim: "Informe a data de fim.",
			dias: RESERVATION_MESSAGES.weekdaysRequired,
		});
	});

	it("na recorrente acusa fim antes do início", () => {
		expect(
			issuesByPath(reservationFormSchema.safeParse(recorrente({ dataFim: "20/08/2026" }))),
		).toEqual({ dataFim: RESERVATION_MESSAGES.endDateBeforeStart });
	});

	it("acusa quando nenhum dia escolhido cai no período", () => {
		// Segunda 24/08 a quarta 26/08: não há sexta.
		expect(
			issuesByPath(
				reservationFormSchema.safeParse(recorrente({ dataFim: "26/08/2026", dias: [5] })),
			),
		).toEqual({ dias: RESERVATION_MESSAGES.weekdaysOutsidePeriod });
	});

	it("aceita recorrente com algum dia dentro do período", () => {
		expect(
			reservationFormSchema.safeParse(recorrente({ dataFim: "26/08/2026", dias: [5, 3] })).success,
		).toBe(true);
	});

	it("ignora data de fim e dias na reserva pontual", () => {
		expect(reservationFormSchema.safeParse(pontual({ dataFim: "xx", dias: [] })).success).toBe(
			true,
		);
	});
});

describe("toReservationWriteDto", () => {
	it("monta a reserva pontual no mesmo dia, sem dias", () => {
		expect(toReservationWriteDto(reservationFormSchema.parse(pontual()))).toEqual({
			salaId: 10,
			solicitanteId: 7,
			horaInicio: "2026-08-24T08:00:00",
			horaFim: "2026-08-24T09:30:00",
			fixo: false,
			observacoes: "",
		});
	});

	it("monta a recorrente com o período e os dias em ordem", () => {
		expect(toReservationWriteDto(reservationFormSchema.parse(recorrente()))).toEqual({
			salaId: 10,
			solicitanteId: 7,
			horaInicio: "2026-08-24T08:00:00",
			horaFim: "2026-09-04T09:30:00",
			fixo: true,
			observacoes: "",
			dias: [1, 3],
		});
	});
});
