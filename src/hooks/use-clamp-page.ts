import { useEffect } from "react";
import type { PageMetadata } from "@/shared/types/pagination";

interface ClampPageOptions {
	page: number;
	/** Metadados da última resposta; ausente antes da primeira carga. */
	pageInfo: PageMetadata | undefined;
	/** Enquanto a tela mostra a página anterior, os metadados ainda não são da página atual. */
	isPlaceholderData: boolean;
	setPage: (page: number) => void;
}

/**
 * Excluir o último item da última página deixa a página atual fora do intervalo: volta para
 * a última página existente em vez de mostrar a tabela vazia.
 */
export function useClampPage({ page, pageInfo, isPlaceholderData, setPage }: ClampPageOptions) {
	useEffect(() => {
		if (isPlaceholderData || !pageInfo) return;
		const lastPage = Math.max(pageInfo.totalPages - 1, 0);
		if (page > lastPage) setPage(lastPage);
	}, [isPlaceholderData, pageInfo, page, setPage]);
}
