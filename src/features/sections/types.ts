/** Setor como vem das listagens. Atenção: a leitura usa `observacoes` (plural). */
export interface Section {
	id: number;
	nome: string;
	observacoes?: string | null;
}

/** Corpo de criação e edição. Atenção: a escrita usa `observacao` (singular). */
export interface SectionWriteDto {
	nome: string;
	observacao: string | null;
}
