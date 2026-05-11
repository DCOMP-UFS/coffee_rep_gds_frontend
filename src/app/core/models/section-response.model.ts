export interface SectionResponseModel {
	content: Section[];
}

export interface Section {
	id: number;
	nome: string;
	observacoes?: string | null;
}
