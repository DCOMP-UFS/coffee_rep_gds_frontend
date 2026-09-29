import { matchesSearch, normalizeSearch } from "./search";

describe("normalizeSearch", () => {
	it("normaliza acentos e caixa", () => {
		expect(normalizeSearch("Clínica Médica")).toBe("clinica medica");
	});
});

describe("matchesSearch", () => {
	it("encontra o termo ignorando acentos e maiúsculas", () => {
		expect(matchesSearch("CLINICA", "Clínica Médica")).toBe(true);
		expect(matchesSearch("médica", "Clinica Medica")).toBe(true);
	});

	it("basta um dos textos conter o termo", () => {
		expect(matchesSearch("infantil", "Pediatria", "Ala infantil")).toBe(true);
		expect(matchesSearch("cardio", "Pediatria", null, undefined)).toBe(false);
	});

	it("aceita tudo quando o termo está vazio ou só com espaços", () => {
		expect(matchesSearch("", "Pediatria")).toBe(true);
		expect(matchesSearch("   ", null)).toBe(true);
	});

	it("ignora espaços nas pontas do termo", () => {
		expect(matchesSearch("  pedia ", "Pediatria")).toBe(true);
	});
});
