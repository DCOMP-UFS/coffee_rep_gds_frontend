export interface EventDialogModel {
	id: number;
	requester: string;
	createdBy: string;
	recorrenciaId?: number;
	completeTitle: string;
	title: string;
	start: Date;
	end: Date;
	profissionalAusente?: boolean;
}
