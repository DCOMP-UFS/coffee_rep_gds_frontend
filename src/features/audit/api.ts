import { api } from "@/lib/api/client";
import type { PagedResponse } from "@/shared/types/pagination";
import type { AuditEvent, AuditListParams } from "./types";

const filledOrUndefined = (value: string) => value.trim() || undefined;

export const auditApi = {
	/** Eventos do mais recente ao mais antigo, salvo outra ordem; filtros vazios não são enviados. */
	list: (
		{ q, action, entityType, createdFrom, createdTo, sort, page, size }: AuditListParams,
		signal?: AbortSignal,
	) =>
		api.get<PagedResponse<AuditEvent>>(
			"audit",
			{
				size,
				page,
				q: filledOrUndefined(q),
				action: filledOrUndefined(action),
				entityType: filledOrUndefined(entityType),
				createdFrom: filledOrUndefined(createdFrom),
				createdTo: filledOrUndefined(createdTo),
				sort,
			},
			signal,
		),
};
