import {
	defaultReservationFilters,
	hasActiveReservationFilters,
	toReservationListFilters,
} from "./filters";

// 22h30: o horário em que o Angular, por converter para UTC, começava o período no dia seguinte.
const NOW = new Date(2026, 8, 29, 22, 30);
const DEFAULTS = defaultReservationFilters(NOW);

describe("defaultReservationFilters", () => {
	it("vai de hoje até hoje + 30 no horário local, sem outros filtros", () => {
		expect(DEFAULTS).toEqual({
			search: "",
			inicio: "2026-09-29",
			fim: "2026-10-29",
			sectionId: 0,
			type: "",
			sort: "recentes",
		});
	});
});

describe("toReservationListFilters", () => {
	it("envia só o período na ordem padrão, sem filtros desligados", () => {
		expect(toReservationListFilters(DEFAULTS, 0, 5)).toEqual({
			inicio: "2026-09-29",
			fim: "2026-10-29",
			search: "",
			page: 0,
			size: 5,
		});
	});

	it("apara a busca e converte setor, tipo e ordenação para o formato do backend", () => {
		expect(
			toReservationListFilters(
				{
					search: "  Ana ",
					inicio: "2026-10-01",
					fim: "2026-12-31",
					sectionId: 4,
					type: "recorrente",
					sort: "inicio-asc",
				},
				2,
				10,
			),
		).toEqual({
			inicio: "2026-10-01",
			fim: "2026-12-31",
			search: "Ana",
			setorId: 4,
			recorrente: true,
			sort: "horaInicio,asc",
			page: 2,
			size: 10,
		});
	});

	it("envia recorrente=false para as pontuais e as demais ordenações", () => {
		expect(toReservationListFilters({ ...DEFAULTS, type: "pontual" }, 0, 5).recorrente).toBe(false);
		expect(toReservationListFilters({ ...DEFAULTS, sort: "inicio-desc" }, 0, 5).sort).toBe(
			"horaInicio,desc",
		);
		expect(toReservationListFilters({ ...DEFAULTS, sort: "sala-asc" }, 0, 5).sort).toBe("sala,asc");
		expect(toReservationListFilters({ ...DEFAULTS, sort: "solicitante-asc" }, 0, 5).sort).toBe(
			"solicitante,asc",
		);
	});
});

describe("hasActiveReservationFilters", () => {
	it("considera busca, período diferente do padrão, setor e tipo, não a ordenação", () => {
		const active = (overrides: Partial<typeof DEFAULTS>) =>
			hasActiveReservationFilters({ ...DEFAULTS, ...overrides }, DEFAULTS);

		expect(active({})).toBe(false);
		expect(active({ sort: "sala-asc" })).toBe(false);
		expect(active({ search: "  " })).toBe(false);
		expect(active({ search: "Ana" })).toBe(true);
		expect(active({ inicio: "2026-10-01" })).toBe(true);
		expect(active({ fim: "2026-12-31" })).toBe(true);
		expect(active({ sectionId: 4 })).toBe(true);
		expect(active({ type: "pontual" })).toBe(true);
	});
});
