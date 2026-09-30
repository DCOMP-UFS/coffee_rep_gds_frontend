import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Location, MemoryRouter, useLocation } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { sessionKeys } from "@/features/session/query-keys";
import type { Role } from "@/features/session/types";
import { setToken } from "@/lib/auth/token";
import { createQueryClient } from "@/lib/query-client";
import { currentUser } from "./msw/fixtures";

interface RenderAppOptions {
	/** Grava um token antes de montar, simulando usuário já autenticado. */
	authenticated?: boolean;
	/**
	 * Perfil do usuário autenticado, já no cache como se `auth/me` tivesse respondido. `null`
	 * deixa o cache vazio para o próprio teste declarar o handler de `auth/me`.
	 */
	role?: Role | null;
}

/**
 * Monta a aplicação real (rotas, layout, tratamento global de erros e toasts) numa rota
 * inicial, com cache novo. `location()` devolve a rota atual para verificar redirecionamentos.
 */
export function renderApp(
	route: string,
	{ authenticated = false, role = "COORDINATOR" }: RenderAppOptions = {},
) {
	const queryClient = createQueryClient();
	if (authenticated) {
		setToken("token-de-teste");
		if (role) queryClient.setQueryData(sessionKeys.me(), currentUser(role));
	}

	const current: { location?: Location } = {};

	function LocationProbe() {
		current.location = useLocation();
		return null;
	}

	const user = userEvent.setup();
	const view = render(
		<MemoryRouter initialEntries={[route]}>
			<AppShell queryClient={queryClient}>
				<LocationProbe />
			</AppShell>
		</MemoryRouter>,
	);

	const location = () => {
		if (!current.location) throw new Error("Rota ainda não renderizada.");
		return `${current.location.pathname}${current.location.search}`;
	};

	return { ...view, user, queryClient, location };
}
