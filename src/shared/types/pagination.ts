/**
 * Formato de página devolvido pelo backend (herdado do `PagedModel` do Spring):
 * a lista vem em `content` e os metadados aninhados em `page`. Página base 0.
 */
export interface PageMetadata {
	size: number;
	number: number;
	totalElements: number;
	totalPages: number;
}

export interface PagedResponse<T> {
	content: T[];
	page: PageMetadata;
}

export interface PageRequest {
	/** Índice base 0. */
	page: number;
	size: number;
}
