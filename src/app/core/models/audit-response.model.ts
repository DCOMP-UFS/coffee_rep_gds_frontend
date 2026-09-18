import { PaginationModel } from "./pagination-response.model";

export interface AuditEvent {
	id: number;
	action: string;
	entityType: string;
	entityId: number | null;
	actorUserId: number | null;
	actorName: string;
	details: Record<string, unknown>;
	createdAt: string | null;
}

export interface AuditResponseModel {
	content: AuditEvent[];
	page: PaginationModel;
}

export interface AuditRequestParams {
	size: number;
	page: number;
	q?: string;
	action?: string;
	entityType?: string;
	createdFrom?: string;
	createdTo?: string;
}
