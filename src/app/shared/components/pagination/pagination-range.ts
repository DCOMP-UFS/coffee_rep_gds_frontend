export type PageItem = number | "ellipsis";

/**
 * Clamps a page number into the valid inclusive range [1, totalPages].
 * Non-finite values fall back to 1. totalPages below 1 is treated as 1.
 */
export function clampPage(page: number, totalPages: number): number {
	const max = Math.max(1, Math.floor(totalPages) || 1);
	if (!Number.isFinite(page)) return 1;
	return Math.min(max, Math.max(1, Math.floor(page)));
}

/** Builds the shared "N label(s) — página X de Y" copy used above and below tables. */
export function formatPaginationSummary(
	total: number,
	summaryLabel: string,
	page: number,
	totalPages: number,
): string {
	const safeTotalPages = Math.max(1, Math.floor(totalPages) || 1);
	const safePage = clampPage(page, safeTotalPages);
	return `${total} ${summaryLabel} — página ${safePage} de ${safeTotalPages}`;
}

/**
 * Builds a compact list of page numbers with optional ellipsis gaps.
 * Always includes first and last when the range is truncated.
 */
export function getVisiblePages(
	page: number,
	totalPages: number,
	siblingCount = 1,
): PageItem[] {
	const total = Math.max(1, Math.floor(totalPages) || 1);
	const current = clampPage(page, total);
	const siblings = Math.max(0, Math.floor(siblingCount));

	// first + last + current + siblings on each side + two ellipsis slots
	const maxButtons = siblings * 2 + 5;

	if (total <= maxButtons) {
		return Array.from({ length: total }, (_, index) => index + 1);
	}

	const leftSibling = Math.max(current - siblings, 1);
	const rightSibling = Math.min(current + siblings, total);

	const showLeftEllipsis = leftSibling > 2;
	const showRightEllipsis = rightSibling < total - 1;

	if (!showLeftEllipsis && showRightEllipsis) {
		const leftCount = 3 + 2 * siblings;
		const leftRange = Array.from({ length: leftCount }, (_, index) => index + 1);
		return [...leftRange, "ellipsis", total];
	}

	if (showLeftEllipsis && !showRightEllipsis) {
		const rightCount = 3 + 2 * siblings;
		const rightRange = Array.from(
			{ length: rightCount },
			(_, index) => total - rightCount + index + 1,
		);
		return [1, "ellipsis", ...rightRange];
	}

	const middleRange = Array.from(
		{ length: rightSibling - leftSibling + 1 },
		(_, index) => leftSibling + index,
	);
	return [1, "ellipsis", ...middleRange, "ellipsis", total];
}

/** Derives 1-based page and totalPages from 0-based pageIndex / pageSize / total. */
export function pageFromIndex(
	pageIndex: number,
	pageSize: number,
	total: number,
): { page: number; totalPages: number } {
	const safeSize = Math.max(1, Math.floor(pageSize) || 1);
	const safeTotal = Math.max(0, Math.floor(total) || 0);
	const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize) || 1);
	const page = clampPage(Math.floor(pageIndex) + 1, totalPages);
	return { page, totalPages };
}
