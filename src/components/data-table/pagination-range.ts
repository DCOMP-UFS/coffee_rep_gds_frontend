export type PaginationItem = number | "ellipsis";

/**
 * Páginas a exibir na barra de paginação (base 0, como o backend), sempre com a primeira,
 * a última e `siblings` vizinhas da atual; intervalos omitidos viram `"ellipsis"`.
 * A quantidade de itens é constante quando há omissão, para os botões não "pularem".
 */
export function paginationRange(
	current: number,
	totalPages: number,
	siblings = 1,
): PaginationItem[] {
	const range = (start: number, end: number) =>
		Array.from({ length: end - start + 1 }, (_, index) => start + index);

	const maxItems = siblings * 2 + 5;
	if (totalPages <= maxItems) return range(0, totalPages - 1);

	const last = totalPages - 1;
	const leftSibling = Math.max(current - siblings, 1);
	const rightSibling = Math.min(current + siblings, last - 1);
	const showLeftEllipsis = leftSibling > 2;
	const showRightEllipsis = rightSibling < last - 2;
	const edgeCount = siblings * 2 + 3;

	if (!showLeftEllipsis) return [...range(0, edgeCount - 1), "ellipsis", last];
	if (!showRightEllipsis) return [0, "ellipsis", ...range(totalPages - edgeCount, last)];

	return [0, "ellipsis", ...range(leftSibling, rightSibling), "ellipsis", last];
}
