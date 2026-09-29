import type { PagedResponse } from "@/shared/types/pagination";

/** Pagina uma lista como o backend: página base 0, metadados em `page`. */
export function paged<T>(all: readonly T[], page: number, size: number): PagedResponse<T> {
	const start = page * size;
	return {
		content: all.slice(start, start + size),
		page: {
			size,
			number: page,
			totalElements: all.length,
			totalPages: Math.ceil(all.length / size),
		},
	};
}
