import { ROLE_LABELS } from "./roles";
import type { Permission, RequestableRole } from "./types";

/** Menor perfil que tem a permissão e se ele pode ser pedido em Meu acesso. */
export type AccessRequirement =
	| RequestableRequirement
	| { minimumRole: "ADMIN"; requestable: false };

export interface RequestableRequirement {
	minimumRole: RequestableRole;
	requestable: true;
}

/**
 * Único ponto em que o frontend repete a matriz do backend (`src/auth/permissions.ts`): o
 * `auth/me` diz o que o usuário pode, mas não qual perfil ele precisaria para o resto. Um teste
 * mantém esta tabela coerente com as permissões de cada perfil.
 */
export const PERMISSION_REQUIREMENTS: Record<Permission, AccessRequirement> = {
	"reservation.single.manage": { minimumRole: "ASSISTANT", requestable: true },
	"absence.manage": { minimumRole: "ASSISTANT", requestable: true },
	"reservation.recurring.manage": { minimumRole: "COORDINATOR", requestable: true },
	"catalog.manage": { minimumRole: "COORDINATOR", requestable: true },
	"users.manage": { minimumRole: "ADMIN", requestable: false },
	"roleRequests.review": { minimumRole: "ADMIN", requestable: false },
};

export const ADMIN_ONLY_REASON = "Exclusivo do administrador de tecnologia";

/** Texto curto do tooltip de uma ação bloqueada. */
export function lockedReason(requirement: AccessRequirement): string {
	return requirement.requestable
		? `Disponível a partir de ${ROLE_LABELS[requirement.minimumRole]}`
		: ADMIN_ONLY_REASON;
}

/**
 * Frase que abre a explicação. `feature` começa com verbo no infinitivo ("Cadastrar setores"),
 * o que mantém a concordância nos dois casos.
 */
export function accessSummary(feature: string, requirement: AccessRequirement): string {
	return requirement.requestable
		? `${feature} exige o perfil ${ROLE_LABELS[requirement.minimumRole]} ou superior.`
		: `${feature} é exclusivo do administrador de tecnologia.`;
}
