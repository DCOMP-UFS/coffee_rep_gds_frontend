import {
	formatCpfBr,
	formatIsoDateBr,
	formatIsoDateTimeBr,
	formatPhoneBr,
	onlyDigits,
} from "./br-format";

// Casos portados de `br-format.util.spec.ts` do frontend Angular, mais bordas.
describe("br-format", () => {
	it("extrai apenas dígitos", () => {
		expect(onlyDigits("(11) 98765-4321")).toBe("11987654321");
		expect(onlyDigits(null)).toBe("");
	});

	it("formata CPF", () => {
		expect(formatCpfBr("52998224725")).toBe("529.982.247-25");
	});

	it("devolve CPF incompleto como veio", () => {
		expect(formatCpfBr("123")).toBe("123");
	});

	it("formata celular", () => {
		expect(formatPhoneBr("11987654321")).toBe("(11) 98765-4321");
	});

	it("formata telefone fixo", () => {
		expect(formatPhoneBr("1133334444")).toBe("(11) 3333-4444");
	});

	it("devolve vazio para telefone ausente", () => {
		expect(formatPhoneBr(null)).toBe("");
	});

	it("formata data ISO como DD/MM/AAAA", () => {
		expect(formatIsoDateBr("2026-01-05")).toBe("05/01/2026");
	});

	it.each([
		[null, ""],
		[undefined, ""],
		["", ""],
		["05/01/2026", "05/01/2026"],
		["2026-1-5", "2026-1-5"],
	])("devolve data fora do formato ISO como veio: %j", (input, expected) => {
		expect(formatIsoDateBr(input)).toBe(expected);
	});

	it.each([
		["2026-08-24T08:00:00", "24/08/2026 08:00"],
		["2026-08-24T23:30", "24/08/2026 23:30"],
		["2026-08-24 07:05:00", "24/08/2026 07:05"],
	])("formata data e hora ISO sem mudar o fuso: %s", (input, expected) => {
		expect(formatIsoDateTimeBr(input)).toBe(expected);
	});

	it.each([
		[null, ""],
		[undefined, ""],
		["2026-08-24", "2026-08-24"],
		["24/08/2026 08:00", "24/08/2026 08:00"],
	])("devolve data e hora fora do formato ISO como veio: %j", (input, expected) => {
		expect(formatIsoDateTimeBr(input)).toBe(expected);
	});
});
