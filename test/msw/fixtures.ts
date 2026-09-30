import type { RoleRequest } from "@/features/role-requests/types";
import type { CurrentUser, Permission, Role } from "@/features/session/types";
import type { PagedResponse } from "@/shared/types/pagination";

/** Mesma matriz de `src/auth/permissions.ts` do backend, perfil a perfil. */
const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
	VIEWER: [],
	ASSISTANT: ["reservation.single.manage", "absence.manage"],
	COORDINATOR: [
		"catalog.manage",
		"reservation.recurring.manage",
		"reservation.single.manage",
		"absence.manage",
	],
	ADMIN: [
		"catalog.manage",
		"reservation.recurring.manage",
		"reservation.single.manage",
		"absence.manage",
		"users.manage",
		"roleRequests.review",
	],
};

/** Resposta de `auth/me` para um usuário com o perfil dado. */
export function currentUser(role: Role, overrides: Partial<CurrentUser> = {}): CurrentUser {
	return {
		id: 42,
		name: "Usuária de Teste",
		email: "teste@hu.ufs.br",
		role,
		permissions: PERMISSIONS_BY_ROLE[role],
		...overrides,
	};
}

/** Pedido de acesso do usuário de `currentUser`; por padrão, visualizador pedindo Assistente. */
export function roleRequest(id: number, overrides: Partial<RoleRequest> = {}): RoleRequest {
	return {
		id,
		userId: 42,
		userName: "Usuária de Teste",
		userEmail: "teste@hu.ufs.br",
		currentRole: "VIEWER",
		requestedRole: "ASSISTANT",
		justification: "Preciso marcar reservas da secretaria.",
		status: "PENDING",
		createdAt: "2026-09-28T14:30:00",
		...overrides,
	};
}

/** Pagina uma lista como o backend: página base 0, metadados em `page`. */
export function paged<T>(all: readonly T[], page: number, size: number): PagedResponse<T> {
	const start = page * size;
	return {
		content: all.slice(start, start + size),
		page: {
			size,
			number: page,
			totalElements: all.length,
			totalPages: Math.ceil(all.length / size),
		},
	};
}
