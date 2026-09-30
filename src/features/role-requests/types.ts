import type { RequestableRole } from "@/features/session/types";
import type { PageRequest } from "@/shared/types/pagination";

export type RoleRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/**
 * Pedido de acesso como o backend devolve. Perfis vêm como código (`currentRole` pode ser o
 * legado `BASIC`); datas em `AAAA-MM-DDTHH:mm:ss`, horário local; campos nulos são omitidos.
 */
export interface RoleRequest {
	id: number;
	userId: number;
	userName: string;
	userEmail?: string | null;
	currentRole: string;
	requestedRole: string;
	justification: string;
	status: RoleRequestStatus;
	reviewedBy?: number | null;
	reviewedAt?: string | null;
	reviewNote?: string | null;
	createdAt?: string | null;
}

export interface RoleRequestSummary {
	pending: number;
}

/** Corpo do `POST role-request`. */
export interface CreateRoleRequestDto {
	requestedRole: RequestableRole;
	justification: string;
}

export interface RoleRequestListParams extends PageRequest {
	/** Ausente, lista pedidos de todas as situações. */
	status?: RoleRequestStatus;
}

/** Usuário como `GET user` devolve, com os perfis no formato `{ roleId, name }` do Java. */
export interface ManagedUser {
	userId: number;
	name?: string | null;
	email?: string | null;
	cpf?: string | null;
	roles: { roleId: number; name: string }[];
	createdAt?: string | null;
}
