import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Location, MemoryRouter, useLocation } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { setToken } from "@/lib/auth/token";
import { createQueryClient } from "@/lib/query-client";

interface RenderAppOptions {
	/** Grava um token antes de montar, simulando usuário já autenticado. */
	authenticated?: boolean;
}

/**
 * Monta a aplicação real (rotas, layout, tratamento global de erros e toasts) numa rota
 * inicial, com cache novo. `location()` devolve a rota atual para verificar redirecionamentos.
 */
export function renderApp(route: string, { authenticated = false }: RenderAppOptions = {}) {
	if (authenticated) setToken("token-de-teste");

	const queryClient = createQueryClient();
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
