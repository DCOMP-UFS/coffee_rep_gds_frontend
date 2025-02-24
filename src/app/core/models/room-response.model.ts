import { PaginationModel } from "./pagination-response.model";

export interface RoomResponseModel {
	content: Room[];
	page: PaginationModel;
}

export interface Room {
	id: number;
	nome: string;
	status: string;
	tipo: string;
	setor: string;
}
