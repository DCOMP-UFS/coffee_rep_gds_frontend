import {
	auditFiltersFormSchema,
	CREATED_TO_BEFORE_FROM_MESSAGE,
	EMPTY_AUDIT_FILTERS_FORM,
	toAuditFilters,
} from "./schemas";

const parse = (overrides: Partial<typeof EMPTY_AUDIT_FILTERS_FORM>) =>
	auditFiltersFormSchema.safeParse({ ...EMPTY_AUDIT_FILTERS_FORM, ...overrides });

describe("auditFiltersFormSchema", () => {
	it("aceita todos os filtros vazios", () => {
		expect(parse({}).success).toBe(true);
	});

	it("valida as datas preenchidas", () => {
		expect(parse({ createdFrom: "31/02/2026" }).error?.issues[0]).toMatchObject({
			path: ["createdFrom"],
			message: "Data inválida.",
		});
	});

	it("exige Até igual ou posterior a De", () => {
		expect(parse({ createdFrom: "10/09/2026", createdTo: "09/09/2026" }).error?.issues).toEqual([
			expect.objectContaining({ path: ["createdTo"], message: CREATED_TO_BEFORE_FROM_MESSAGE }),
		]);
		expect(parse({ createdFrom: "10/09/2026", createdTo: "10/09/2026" }).success).toBe(true);
	});
});

describe("toAuditFilters", () => {
	it("apara a busca e converte as datas para AAAA-MM-DD", () => {
		const values = auditFiltersFormSchema.parse({
			q: "  Maria ",
			action: "room.create",
			entityType: "room",
			createdFrom: "01/09/2026",
			createdTo: "",
		});
		expect(toAuditFilters(values)).toEqual({
			q: "Maria",
			action: "room.create",
			entityType: "room",
			createdFrom: "2026-09-01",
			createdTo: "",
		});
	});
});
