import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/**
 * Acorda o backend serverless assim que o app abre, como o `APP_INITIALIZER` do Angular,
 * mas sem bloquear a renderização. Falhas são silenciosas: é só um aquecimento.
 */
export function ServerWarmUp() {
	useQuery({
		queryKey: ["health"],
		queryFn: ({ signal }) => api.get<unknown>("health", undefined, signal),
		staleTime: Number.POSITIVE_INFINITY,
		meta: { silentError: true },
	});

	return null;
}
