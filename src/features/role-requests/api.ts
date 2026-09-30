import type { AssignableRole } from "@/features/session/types";
import { api } from "@/lib/api/client";
import type { PagedResponse } from "@/shared/types/pagination";
import type {
	CreateRoleRequestDto,
	ManagedUser,
	RoleRequest,
	RoleRequestListParams,
	RoleRequestSummary,
} from "./types";

export const roleRequestsApi = {
	create: (body: CreateRoleRequestDto) => api.post<RoleRequest>("role-request", body),
	/** Pedidos do usuário logado, do mais recente ao mais antigo. */
	mine: (signal?: AbortSignal) => api.get<RoleRequest[]>("role-request/me", undefined, signal),
	cancel: (id: number) => api.post<RoleRequest>(`role-request/${id}/cancel`),
	list: ({ status, page, size }: RoleRequestListParams, signal?: AbortSignal) =>
		api.get<PagedResponse<RoleRequest>>("role-request", { status, page, size }, signal),
	summary: (signal?: AbortSignal) =>
		api.get<RoleRequestSummary>("role-request/summary", undefined, signal),
	approve: (id: number) => api.post<RoleRequest>(`role-request/${id}/approve`),
	reject: (id: number, reason: string | null) =>
		api.post<RoleRequest>(`role-request/${id}/reject`, { reason }),
};

export const usersApi = {
	list: (signal?: AbortSignal) => api.get<ManagedUser[]>("user", undefined, signal),
	changeRole: (userId: number, role: AssignableRole) =>
		api.patch<ManagedUser>(`user/${userId}/role`, { role }),
};
