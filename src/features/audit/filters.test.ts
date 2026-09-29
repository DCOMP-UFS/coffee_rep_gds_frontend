import { DEFAULT_HISTORY_FILTERS, hasActiveHistoryFilters, toAuditListParams } from "./filters";

describe("toAuditListParams", () => {
	it("não envia sort na ordem padrão", () => {
		expect(toAuditListParams(DEFAULT_HISTORY_FILTERS, 0, 10)).toEqual({
			q: "",
			action: "",
			entityType: "",
			createdFrom: "",
			createdTo: "",
			page: 0,
			size: 10,
		});
	});

	it("mantém os filtros e envia a ordem do mais antigo para o mais recente", () => {
		expect(
			toAuditListParams(
				{
					q: "Maria",
					action: "section.update",
					entityType: "section",
					createdFrom: "2026-09-01",
					createdTo: "2026-09-29",
					sort: "antigos",
				},
				2,
				20,
			),
		).toEqual({
			q: "Maria",
			action: "section.update",
			entityType: "section",
			createdFrom: "2026-09-01",
			createdTo: "2026-09-29",
			sort: "createdAt,asc",
			page: 2,
			size: 20,
		});
	});
});

describe("hasActiveHistoryFilters", () => {
	it("considera busca, ação, entidade e datas, não a ordenação", () => {
		const active = (overrides: Partial<typeof DEFAULT_HISTORY_FILTERS>) =>
			hasActiveHistoryFilters({ ...DEFAULT_HISTORY_FILTERS, ...overrides });

		expect(active({})).toBe(false);
		expect(active({ sort: "antigos" })).toBe(false);
		expect(active({ q: "  " })).toBe(false);
		expect(active({ q: "42" })).toBe(true);
		expect(active({ action: "auth.login" })).toBe(true);
		expect(active({ entityType: "room" })).toBe(true);
		expect(active({ createdFrom: "2026-09-01" })).toBe(true);
		expect(active({ createdTo: "2026-09-29" })).toBe(true);
	});
});
