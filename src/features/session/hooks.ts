import { useQuery } from "@tanstack/react-query";
import { isAuthenticated } from "@/lib/auth/token";
import { sessionApi } from "./api";
import { sessionKeys } from "./query-keys";
import type { Permission } from "./types";

/**
 * Usuário logado, com o perfil e as permissões calculadas pelo backend. As rotas protegidas
 * só renderizam depois que ele carrega, então abaixo delas `data` está sempre disponível.
 */
export function useCurrentUser() {
	return useQuery({
		queryKey: sessionKeys.me(),
		queryFn: ({ signal }) => sessionApi.me(signal),
		// Lido na hora de buscar: quando um 401 descarta o token e limpa o cache, as telas ainda
		// montadas não pedem o usuário de novo, sem token, antes de irem para o login.
		enabled: () => isAuthenticated(),
		// A rota protegida mostra o erro com "Tentar novamente"; o global só cuida do 401.
		meta: { inlineError: true },
	});
}

/**
 * Só decide o que aparece na tela: quem garante a permissão é o backend, que relê o perfil do
 * banco a cada requisição.
 */
export function usePermission(permission: Permission): boolean {
	const { data } = useCurrentUser();
	return data?.permissions.includes(permission) ?? false;
}
