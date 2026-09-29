import { brDateToIsoDate, parseBrDateParts, validateBrDate } from "./date";

const formatBr = (date: Date) =>
	`${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

// Casos portados de `date-mask.validators.spec.ts` do frontend Angular, mais bordas.
describe("validateBrDate", () => {
	it("aceita data futura completa quando allowFuture é o padrão", () => {
		expect(validateBrDate("31/12/2099")).toBeNull();
	});

	it("rejeita entrada incompleta", () => {
		expect(validateBrDate("010120")).toBe("dateMask");
	});

	it("rejeita data inexistente no calendário", () => {
		expect(validateBrDate("31/02/2024")).toBe("dateInvalid");
	});

	it("aceita 29/02 em ano bissexto", () => {
		expect(validateBrDate("29/02/2024")).toBeNull();
	});

	it("rejeita data futura quando allowFuture é false", () => {
		const future = new Date();
		future.setFullYear(future.getFullYear() + 2);
		expect(validateBrDate(formatBr(future), { allowFuture: false })).toBe("dateInvalid");
	});

	it("aceita hoje quando allowFuture é false", () => {
		expect(validateBrDate(formatBr(new Date()), { allowFuture: false })).toBeNull();
	});

	it("não acusa erro em valor vazio", () => {
		expect(validateBrDate("  ")).toBeNull();
	});
});

describe("parseBrDateParts", () => {
	it("lê dia, mês e ano", () => {
		expect(parseBrDateParts("05/03/1990")).toEqual({ day: 5, month: 3, year: 1990 });
	});
});

describe("brDateToIsoDate", () => {
	it("converte para o formato do backend", () => {
		expect(brDateToIsoDate("05/03/1990")).toBe("1990-03-05");
	});

	it("devolve valores fora do formato como vieram", () => {
		expect(brDateToIsoDate("abc")).toBe("abc");
	});
});
