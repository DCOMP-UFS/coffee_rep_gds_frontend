import { buildMonthWeeks, longDayLabel, monthTitle, visibleRange } from "./month-grid";

const isoDays = (month: Date) =>
	buildMonthWeeks(month)
		.flat()
		.map((day) => day.iso);

describe("buildMonthWeeks", () => {
	it("sempre monta 6 semanas de domingo a sábado", () => {
		const weeks = buildMonthWeeks(new Date(2026, 8, 1));

		expect(weeks).toHaveLength(6);
		for (const week of weeks) {
			expect(week).toHaveLength(7);
			expect(week[0]?.date.getDay()).toBe(0);
			expect(week[6]?.date.getDay()).toBe(6);
		}
	});

	it("começa no próprio dia 1 quando o mês começa num domingo", () => {
		// Novembro de 2026 começa num domingo.
		const days = isoDays(new Date(2026, 10, 1));

		expect(days[0]).toBe("2026-11-01");
		expect(days.at(-1)).toBe("2026-12-12");
	});

	it("completa a primeira semana com o mês anterior quando o mês começa num sábado", () => {
		// Agosto de 2026 começa num sábado.
		const weeks = buildMonthWeeks(new Date(2026, 7, 15));
		const firstWeek = weeks[0] ?? [];

		expect(firstWeek.map((day) => day.iso)).toEqual([
			"2026-07-26",
			"2026-07-27",
			"2026-07-28",
			"2026-07-29",
			"2026-07-30",
			"2026-07-31",
			"2026-08-01",
		]);
		expect(firstWeek.map((day) => day.inMonth)).toEqual([
			false,
			false,
			false,
			false,
			false,
			false,
			true,
		]);
	});

	it("inclui o dia 29 em fevereiro de ano bissexto", () => {
		const days = buildMonthWeeks(new Date(2028, 1, 1)).flat();
		const february = days.filter((day) => day.inMonth).map((day) => day.iso);

		expect(february).toHaveLength(29);
		expect(february.at(-1)).toBe("2028-02-29");
	});

	it("marca só o dia de hoje", () => {
		const days = buildMonthWeeks(new Date(2026, 8, 1), new Date(2026, 8, 29, 22, 30)).flat();

		expect(days.filter((day) => day.isToday).map((day) => day.iso)).toEqual(["2026-09-29"]);
	});
});

describe("visibleRange", () => {
	it("vai do primeiro ao último dia da grade", () => {
		expect(visibleRange(new Date(2026, 8, 29))).toEqual({
			inicio: "2026-08-30",
			fim: "2026-10-10",
		});
	});
});

describe("rótulos", () => {
	it("escreve o mês e o dia em português", () => {
		expect(monthTitle(new Date(2026, 8, 1))).toBe("setembro de 2026");
		expect(longDayLabel(new Date(2026, 8, 29))).toBe("terça-feira, 29 de setembro de 2026");
	});
});
