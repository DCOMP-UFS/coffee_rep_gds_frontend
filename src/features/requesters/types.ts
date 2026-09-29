/** Solicitante como vem da leitura. O backend pode omitir os campos vazios. */
export interface Requester {
	id: number;
	nome: string;
	especialidade?: string | null;
	/** Telefone só com dígitos. Na escrita o mesmo campo se chama `telefone`. */
	contato?: string | null;
}

export interface RequesterWriteDto {
	nome: string;
	/** Só dígitos; `null` apaga o telefone. */
	telefone: string | null;
	especialidade: string;
}

export interface RequesterListFilters {
	/** Termo já enviado pelo usuário; vazio lista todos. */
	search: string;
	/** Base 0. */
	page: number;
	size: number;
}
