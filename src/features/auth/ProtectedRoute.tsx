import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageSkeleton } from "@/components/feedback/PageSkeleton";
import { AppFooter } from "@/components/layout/AppFooter";
import { ColdStartBanner } from "@/components/layout/ColdStartBanner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/session/hooks";
import { isAuthenticated } from "@/lib/auth/token";
import { useLogout } from "./hooks/use-logout";

export const SESSION_LOAD_ERROR_TITLE = "Não foi possível carregar sua sessão.";

function SessionFrame({ children }: { children: ReactNode }) {
	return (
		<main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
			<ColdStartBanner />
			{children}
			<AppFooter className="mt-auto" />
		</main>
	);
}

/**
 * Exige o cookie do token, como o `AuthGuard` do Angular, e espera o perfil do usuário: menu e
 * ações da tela dependem das permissões dele.
 */
export function ProtectedRoute() {
	return isAuthenticated() ? <SessionGate /> : <Navigate to="/login" replace />;
}

function SessionGate() {
	const currentUser = useCurrentUser();
	const logout = useLogout();

	if (currentUser.isPending) {
		return (
			<SessionFrame>
				<PageSkeleton />
			</SessionFrame>
		);
	}

	if (currentUser.isError) {
		return (
			<SessionFrame>
				<ErrorState
					title={SESSION_LOAD_ERROR_TITLE}
					onRetry={() => currentUser.refetch()}
					isRetrying={currentUser.isFetching}
				/>
				<Button variant="ghost" className="self-center" onClick={logout}>
					<LogOut aria-hidden="true" />
					Sair
				</Button>
			</SessionFrame>
		);
	}

	return <Outlet />;
}
