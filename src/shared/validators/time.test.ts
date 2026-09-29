import { isEndAfterStart, isValidTime } from "./time";

// Casos portados de `time.validators.spec.ts` do frontend Angular, mais bordas.
describe("time", () => {
	it("aceita HH:MM válido", () => {
		expect(isValidTime("08:30")).toBe(true);
		expect(isValidTime("23:59")).toBe(true);
	});

	it("rejeita horário inválido", () => {
		expect(isValidTime("25:00")).toBe(false);
		expect(isValidTime("8:30")).toBe(false);
	});

	it("exige fim posterior ao início", () => {
		expect(isEndAfterStart("10:00", "09:00")).toBe(false);
		expect(isEndAfterStart("10:00", "10:00")).toBe(false);
		expect(isEndAfterStart("10:00", "10:01")).toBe(true);
	});

	it("não compara horários mal formatados", () => {
		expect(isEndAfterStart("10:00", "9")).toBe(true);
	});
});
