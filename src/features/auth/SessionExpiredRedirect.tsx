import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onSessionExpired } from "@/lib/auth/session-events";

/**
 * Leva ao login quando o tratamento global de erros detecta um 401. O token e o toast já
 * foram tratados lá; aqui só se navega, sem recarregar a página, e se descarta o cache.
 */
export function SessionExpiredRedirect() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	useEffect(
		() =>
			onSessionExpired(() => {
				navigate("/login", { replace: true });
				queryClient.clear();
			}),
		[navigate, queryClient],
	);

	return null;
}
