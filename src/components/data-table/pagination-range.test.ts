import { paginationRange } from "./pagination-range";

describe("paginationRange", () => {
	it("lista todas as páginas quando cabem", () => {
		expect(paginationRange(0, 1)).toEqual([0]);
		expect(paginationRange(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	it("não lista nada sem páginas", () => {
		expect(paginationRange(0, 0)).toEqual([]);
	});

	it("omite o fim quando a atual está no começo", () => {
		expect(paginationRange(1, 20)).toEqual([0, 1, 2, 3, 4, "ellipsis", 19]);
	});

	it("omite o começo quando a atual está no fim", () => {
		expect(paginationRange(18, 20)).toEqual([0, "ellipsis", 15, 16, 17, 18, 19]);
	});

	it("omite os dois lados quando a atual está no meio", () => {
		expect(paginationRange(10, 20)).toEqual([0, "ellipsis", 9, 10, 11, "ellipsis", 19]);
	});

	it("mantém sempre a mesma quantidade de itens quando há omissão", () => {
		for (let current = 0; current < 20; current++) {
			const items = paginationRange(current, 20);
			expect(items).toHaveLength(7);
			expect(items).toContain(current);
		}
	});
});
