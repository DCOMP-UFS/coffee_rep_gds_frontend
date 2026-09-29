import { DEFAULT_SECTION_FILTERS, filterSections, hasActiveSectionFilters } from "./filters";
import type { Section } from "./types";

/** Na ordem em que o backend devolve: da mais recente para a mais antiga. */
const SECTIONS: Section[] = [
	{ id: 3, nome: "Pediatria", observacoes: "Ala infantil" },
	{ id: 2, nome: "clínica médica", observacoes: null },
	{ id: 1, nome: "Cardiologia", observacoes: "2º andar" },
];

const ids = (sections: Section[]) => sections.map((section) => section.id);

describe("filterSections", () => {
	it("mantém a ordem do backend no padrão", () => {
		expect(ids(filterSections(SECTIONS, DEFAULT_SECTION_FILTERS))).toEqual([3, 2, 1]);
	});

	it("busca no nome ignorando acentos e maiúsculas", () => {
		expect(ids(filterSections(SECTIONS, { search: "CLINICA", sort: "recentes" }))).toEqual([2]);
	});

	it("busca também na observação", () => {
		expect(ids(filterSections(SECTIONS, { search: "infantil", sort: "recentes" }))).toEqual([3]);
	});

	it("ordena pelo nome de A a Z e de Z a A, sem diferenciar maiúsculas", () => {
		expect(ids(filterSections(SECTIONS, { search: "", sort: "nome-asc" }))).toEqual([1, 2, 3]);
		expect(ids(filterSections(SECTIONS, { search: "", sort: "nome-desc" }))).toEqual([3, 2, 1]);
	});

	it("não altera a lista original", () => {
		const original = [...SECTIONS];
		filterSections(SECTIONS, { search: "", sort: "nome-asc" });
		expect(SECTIONS).toEqual(original);
	});
});

describe("hasActiveSectionFilters", () => {
	it("considera só a busca preenchida, não a ordenação", () => {
		expect(hasActiveSectionFilters(DEFAULT_SECTION_FILTERS)).toBe(false);
		expect(hasActiveSectionFilters({ search: "   ", sort: "nome-asc" })).toBe(false);
		expect(hasActiveSectionFilters({ search: "ped", sort: "recentes" })).toBe(true);
	});
});
