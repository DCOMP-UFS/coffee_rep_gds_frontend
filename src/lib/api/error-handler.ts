import { toast } from "sonner";
import { notifySessionExpired } from "@/lib/auth/session-events";
import { clearToken } from "@/lib/auth/token";
import { ApiError, getHttpErrorMessage } from "./errors";

export const SESSION_EXPIRED_MESSAGE =
	"Credenciais expiradas, por favor, realize o login novamente.";
export const GENERIC_ERROR_MESSAGE = "Não foi possível concluir a operação.";

export interface ErrorHandlingMeta {
	/** Fallback específico da operação, quando o backend não traz mensagem apresentável. */
	errorFallback?: string;
	/** A própria tela trata o erro; o tratamento global não mostra nada. */
	silentError?: boolean;
	/** A tela mostra o erro onde o usuário está; o tratamento global só cuida do 401. */
	inlineError?: boolean;
}

/** Endpoints de autenticação têm mensagens próprias e nunca disparam o fluxo de sessão expirada. */
function isAuthEndpoint(error: unknown): boolean {
	return (
		error instanceof ApiError &&
		(error.path.includes("auth/login") || error.path.includes("auth/register"))
	);
}

/**
 * Equivalente ao `credentialsInterceptor` do Angular, aplicado a toda query e mutation:
 * - 401: avisa que a sessão expirou, descarta o token e leva ao login;
 * - demais erros: mostra a mensagem do backend ou um fallback.
 */
export function handleGlobalApiError(error: unknown, meta?: ErrorHandlingMeta): void {
	if (meta?.silentError || isAuthEndpoint(error)) return;

	if (error instanceof ApiError && error.status === 401) {
		toast.error(getHttpErrorMessage(error, SESSION_EXPIRED_MESSAGE));
		clearToken();
		notifySessionExpired();
		return;
	}

	if (meta?.inlineError) return;

	toast.error(getHttpErrorMessage(error, meta?.errorFallback ?? GENERIC_ERROR_MESSAGE));
}
