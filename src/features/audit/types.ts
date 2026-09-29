export interface AuditEvent {
	id: number;
	/** Código da ação, ex.: `reservation.cancel`. */
	action: string;
	/** Código da entidade, ex.: `reservation`. */
	entityType: string;
	entityId?: number | null;
	actorUserId?: number | null;
	actorName: string;
	details?: Record<string, unknown> | null;
	/** `AAAA-MM-DDTHH:mm:ss` no horário local do servidor. */
	createdAt?: string | null;
}

/** Filtros aplicados; texto vazio significa "sem filtro". Datas em `AAAA-MM-DD`. */
export interface AuditFilters {
	q: string;
	action: string;
	entityType: string;
	createdFrom: string;
	createdTo: string;
}

export interface AuditListParams extends AuditFilters {
	page: number;
	size: number;
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
	q: "",
	action: "",
	entityType: "",
	createdFrom: "",
	createdTo: "",
};
