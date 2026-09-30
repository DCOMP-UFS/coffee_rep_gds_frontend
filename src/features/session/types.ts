/** Mesmos códigos de `src/auth/roles.ts` do backend. */
export type Role = "VIEWER" | "ASSISTANT" | "COORDINATOR" | "ADMIN";

/** Perfis que podem ser atribuídos ou pedidos; o ADMIN é único e fica fora da hierarquia. */
export type AssignableRole = Exclude<Role, "ADMIN">;

/** Perfis que podem ser pedidos: o Visualizador nunca está acima de ninguém. */
export type RequestableRole = Exclude<AssignableRole, "VIEWER">;

/** Mesmas chaves da matriz `src/auth/permissions.ts` do backend. */
export type Permission =
	| "catalog.manage"
	| "reservation.recurring.manage"
	| "reservation.single.manage"
	| "absence.manage"
	| "audit.read"
	| "users.manage"
	| "roleRequests.review";

/** Resposta de `GET /api/auth/me`. */
export interface CurrentUser {
	id: number;
	name: string;
	email: string;
	role: Role;
	permissions: Permission[];
}
