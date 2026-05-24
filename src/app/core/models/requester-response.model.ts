import { PaginationModel } from "./pagination-response.model";

export interface RequesterResponseModel {
	content: Requester[];
	page: PaginationModel;
}

export interface Requester {
	id: number;
	nome: string;
	especialidade: string;
	cpf: string;
	contato: string;
}
