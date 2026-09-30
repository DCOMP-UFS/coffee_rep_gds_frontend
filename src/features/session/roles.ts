import type { AssignableRole, RequestableRole, Role } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
	VIEWER: "Visualizador",
	ASSISTANT: "Assistente administrativo",
	COORDINATOR: "Coordenação",
	ADMIN: "Administrador do sistema",
};

/** Perfil anterior à hierarquia; o backend o trata como Coordenação até a migração. */
const LEGACY_ROLE_LABELS: Record<string, string> = {
	BASIC: "Básico (legado)",
};

/** Rótulo de um código vindo do backend; códigos desconhecidos aparecem como vieram. */
export function roleLabel(code: string): string {
	if (Object.hasOwn(ROLE_LABELS, code)) return ROLE_LABELS[code as Role];
	return Object.hasOwn(LEGACY_ROLE_LABELS, code) ? LEGACY_ROLE_LABELS[code] : code;
}

export interface RoleDescription {
	role: Role;
	summary: string;
	capabilities: readonly string[];
}

/** Hierarquia operacional, do menor para o maior nível. */
export const ROLE_HIERARCHY: readonly RoleDescription[] = [
	{
		role: "VIEWER",
		summary: "Consulta o sistema, sem alterar nada. É o perfil de toda conta nova.",
		capabilities: [
			"Ver calendário, salas, setores, solicitantes, reservas e ausências",
			"Consultar o histórico de alterações",
		],
	},
	{
		role: "ASSISTANT",
		summary: "Cuida do dia a dia das reservas pontuais e das ausências.",
		capabilities: [
			"Tudo o que o Visualizador faz",
			"Criar e cancelar reservas pontuais, inclusive de outras pessoas",
			"Registrar, editar e remover ausências",
		],
	},
	{
		role: "COORDINATOR",
		summary: "Organiza a estrutura do ambulatório e as reservas recorrentes.",
		capabilities: [
			"Tudo o que o Assistente administrativo faz",
			"Criar e cancelar reservas recorrentes",
			"Cadastrar setores, salas e solicitantes",
		],
	},
];

export const ADMIN_DESCRIPTION: RoleDescription = {
	role: "ADMIN",
	summary: "Responsável técnico pelo sistema. Aprova pedidos de acesso e gerencia perfis.",
	capabilities: ["Todas as permissões", "Aprovar ou recusar pedidos de acesso", "Alterar perfis"],
};

const ROLE_RANK: Record<Role, number> = { VIEWER: 0, ASSISTANT: 1, COORDINATOR: 2, ADMIN: 3 };

export const ASSIGNABLE_ROLES: readonly AssignableRole[] = ["VIEWER", "ASSISTANT", "COORDINATOR"];

const REQUESTABLE_ROLES: readonly RequestableRole[] = ["ASSISTANT", "COORDINATOR"];

/** Mesma equivalência do backend para o perfil anterior à hierarquia. */
const LEGACY_ROLE_ALIASES: Record<string, Role> = { BASIC: "COORDINATOR" };

function toRole(code: string): Role | undefined {
	if (Object.hasOwn(ROLE_RANK, code)) return code as Role;
	return Object.hasOwn(LEGACY_ROLE_ALIASES, code) ? LEGACY_ROLE_ALIASES[code] : undefined;
}

/** Perfil efetivo de uma lista de códigos, como o backend calcula: o maior reconhecido. */
export function resolveRole(codes: readonly string[]): Role {
	let resolved: Role = "VIEWER";
	for (const code of codes) {
		const role = toRole(code);
		if (role && ROLE_RANK[role] > ROLE_RANK[resolved]) resolved = role;
	}
	return resolved;
}

/** Perfis que o usuário pode pedir: só os acima do atual, e nunca o de administrador. */
export function requestableRoles(current: Role): RequestableRole[] {
	return REQUESTABLE_ROLES.filter((role) => ROLE_RANK[role] > ROLE_RANK[current]);
}
