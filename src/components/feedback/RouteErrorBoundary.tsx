import { Component, type ReactNode } from "react";
import { reloadPage } from "@/lib/reload-page";
import { ErrorState } from "./ErrorState";

interface RouteErrorBoundaryProps {
	children: ReactNode;
}

interface RouteErrorBoundaryState {
	hasError: boolean;
}

/**
 * Evita a tela em branco quando uma tela falha ao abrir, por exemplo quando o arquivo dela
 * não existe mais porque uma nova versão foi publicada com a aba ainda aberta.
 * Use com `key` da rota para que trocar de tela limpe o erro.
 */
export class RouteErrorBoundary extends Component<
	RouteErrorBoundaryProps,
	RouteErrorBoundaryState
> {
	state: RouteErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): RouteErrorBoundaryState {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return (
				<ErrorState
					title="Não foi possível abrir esta tela."
					description="Uma nova versão do sistema pode ter sido publicada. Recarregue a página."
					onRetry={reloadPage}
					retryLabel="Recarregar página"
				/>
			);
		}
		return this.props.children;
	}
}
