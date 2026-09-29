import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GlobalProgress } from "@/components/layout/GlobalProgress";
import { Toaster } from "@/components/ui/sonner";
import { SessionExpiredRedirect } from "@/features/auth/SessionExpiredRedirect";
import { AppRoutes } from "./AppRoutes";

/**
 * Tudo o que o app precisa abaixo do roteador. Separado de `App` para os testes montarem a
 * aplicação real dentro de um `MemoryRouter`, com um cache novo a cada teste.
 */
export function AppShell({
	queryClient,
	children,
}: {
	queryClient: QueryClient;
	children?: ReactNode;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<GlobalProgress />
			<SessionExpiredRedirect />
			{children}
			<AppRoutes />
			<Toaster position="top-right" closeButton richColors />
		</QueryClientProvider>
	);
}
