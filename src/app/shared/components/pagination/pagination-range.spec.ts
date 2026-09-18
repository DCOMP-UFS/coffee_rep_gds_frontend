import {
	clampPage,
	formatPaginationSummary,
	getVisiblePages,
	pageFromIndex,
} from "./pagination-range";

describe("clampPage", () => {
	it("keeps a page inside the valid range", () => {
		expect(clampPage(3, 10)).toBe(3);
	});

	it("clamps below 1 to 1", () => {
		expect(clampPage(0, 10)).toBe(1);
		expect(clampPage(-5, 10)).toBe(1);
	});

	it("clamps above totalPages to totalPages", () => {
		expect(clampPage(99, 10)).toBe(10);
	});

	it("treats totalPages below 1 as 1", () => {
		expect(clampPage(5, 0)).toBe(1);
		expect(clampPage(5, -2)).toBe(1);
	});

	it("floors fractional pages", () => {
		expect(clampPage(3.9, 10)).toBe(3);
	});

	it("falls back to 1 for non-finite values", () => {
		expect(clampPage(Number.NaN, 10)).toBe(1);
		expect(clampPage(Number.POSITIVE_INFINITY, 10)).toBe(1);
	});
});

describe("getVisiblePages", () => {
	it("returns a single page when totalPages is 1", () => {
		expect(getVisiblePages(1, 1)).toEqual([1]);
	});

	it("returns all pages when the total fits without ellipsis", () => {
		expect(getVisiblePages(3, 5)).toEqual([1, 2, 3, 4, 5]);
	});

	it("shows right ellipsis near the start", () => {
		expect(getVisiblePages(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
	});

	it("shows left ellipsis near the end", () => {
		expect(getVisiblePages(20, 20)).toEqual([
			1,
			"ellipsis",
			16,
			17,
			18,
			19,
			20,
		]);
	});

	it("shows both ellipses in the middle", () => {
		expect(getVisiblePages(8, 20)).toEqual([
			1,
			"ellipsis",
			7,
			8,
			9,
			"ellipsis",
			20,
		]);
	});

	it("clamps the current page before building the range", () => {
		expect(getVisiblePages(0, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
		expect(getVisiblePages(99, 20)).toEqual([
			1,
			"ellipsis",
			16,
			17,
			18,
			19,
			20,
		]);
	});

	it("respects siblingCount", () => {
		expect(getVisiblePages(10, 20, 2)).toEqual([
			1,
			"ellipsis",
			8,
			9,
			10,
			11,
			12,
			"ellipsis",
			20,
		]);
	});
});

describe("formatPaginationSummary", () => {
	it("formats the shared summary copy", () => {
		expect(formatPaginationSummary(371, "registro(s)", 1, 25)).toBe(
			"371 registro(s) — página 1 de 25",
		);
	});

	it("clamps page and totalPages in the summary text", () => {
		expect(formatPaginationSummary(10, "usuário(s)", 0, 0)).toBe(
			"10 usuário(s) — página 1 de 1",
		);
	});
});

describe("pageFromIndex", () => {
	it("derives 1-based page and totalPages from 0-based index", () => {
		expect(pageFromIndex(0, 10, 371)).toEqual({ page: 1, totalPages: 38 });
		expect(pageFromIndex(2, 10, 371)).toEqual({ page: 3, totalPages: 38 });
	});
});
