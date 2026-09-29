import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "@/lib/auth/token";

/** Encerra a sessão: descarta o token e os dados em cache antes de voltar ao login. */
export function useLogout() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useCallback(() => {
		clearToken();
		navigate("/login", { replace: true });
		queryClient.clear();
	}, [navigate, queryClient]);
}
