import {
	buildMonthWeeks,
	longDayLabel,
	MONTH_OPTIONS,
	monthTitle,
	visibleRange,
	withMonth,
	withYear,
	yearOptions,
} from "./month-grid";

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

describe("MONTH_OPTIONS", () => {
	it("lista os 12 meses em português, com o índice do Date como valor", () => {
		expect(MONTH_OPTIONS).toHaveLength(12);
		expect(MONTH_OPTIONS[0]).toEqual({ value: "0", label: "Janeiro" });
		expect(MONTH_OPTIONS[2]).toEqual({ value: "2", label: "Março" });
		expect(MONTH_OPTIONS[11]).toEqual({ value: "11", label: "Dezembro" });
	});
});

describe("yearOptions", () => {
	const years = (options: { value: string }[]) => options.map((option) => option.value);

	it("vai de 5 anos antes a 5 anos depois do ano atual", () => {
		expect(years(yearOptions(2026, 2026))).toEqual([
			"2021",
			"2022",
			"2023",
			"2024",
			"2025",
			"2026",
			"2027",
			"2028",
			"2029",
			"2030",
			"2031",
		]);
	});

	it("inclui o ano exibido quando as setas passam do fim do intervalo", () => {
		const options = years(yearOptions(2033, 2026));

		expect(options[0]).toBe("2021");
		expect(options.at(-1)).toBe("2033");
		expect(options).toHaveLength(13);
	});

	it("inclui o ano exibido quando as setas passam do início do intervalo", () => {
		const options = years(yearOptions(2018, 2026));

		expect(options[0]).toBe("2018");
		expect(options.at(-1)).toBe("2031");
	});

	it("usa o próprio ano como rótulo", () => {
		expect(yearOptions(2026, 2026)[0]).toEqual({ value: "2021", label: "2021" });
	});
});

describe("withMonth e withYear", () => {
	it("troca o mês mantendo o ano, sempre no dia 1", () => {
		expect(withMonth(new Date(2026, 8, 1), 2)).toEqual(new Date(2026, 2, 1));
	});

	it("troca o ano mantendo o mês, sempre no dia 1", () => {
		expect(withYear(new Date(2026, 8, 1), 2028)).toEqual(new Date(2028, 8, 1));
	});

	it("não pula de mês quando a data de entrada está no fim de um mês longo", () => {
		// 31 de janeiro com mês de fevereiro não pode virar março.
		expect(withMonth(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 1));
		// 29 de fevereiro de ano bissexto em ano comum continua em fevereiro.
		expect(withYear(new Date(2028, 1, 29), 2026)).toEqual(new Date(2026, 1, 1));
	});
});
