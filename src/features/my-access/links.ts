import type { RequestableRole } from "@/features/session/types";

export const MY_ACCESS_PATH = "/meu-acesso";

/** Parâmetro que abre o formulário de Meu acesso já com o perfil escolhido. */
export const REQUESTED_ROLE_PARAM = "perfil";

export function requestAccessPath(role: RequestableRole): string {
	return `${MY_ACCESS_PATH}?${REQUESTED_ROLE_PARAM}=${role}`;
}

/** Perfil vindo da URL, aceito só se o usuário puder pedi-lo; qualquer outro valor é ignorado. */
export function requestedRoleFrom(
	params: URLSearchParams,
	requestable: readonly RequestableRole[],
): RequestableRole | undefined {
	const value = params.get(REQUESTED_ROLE_PARAM);
	return requestable.find((role) => role === value);
}
