import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { type ErrorHandlingMeta, handleGlobalApiError } from "@/lib/api/error-handler";

declare module "@tanstack/react-query" {
	interface Register {
		queryMeta: ErrorHandlingMeta;
		mutationMeta: ErrorHandlingMeta;
	}
}

/**
 * Fábrica em vez de instância única para que cada teste tenha um cache isolado.
 *
 * Sem retentativas e sem refetch ao focar a janela: o frontend Angular não fazia nenhum dos
 * dois, e o backend serverless paga por invocação.
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => handleGlobalApiError(error, query.meta),
		}),
		mutationCache: new MutationCache({
			onError: (error, _variables, _context, mutation) =>
				handleGlobalApiError(error, mutation.meta),
		}),
		defaultOptions: {
			queries: {
				retry: false,
				refetchOnWindowFocus: false,
				staleTime: 30_000,
			},
			mutations: {
				retry: false,
			},
		},
	});
}
