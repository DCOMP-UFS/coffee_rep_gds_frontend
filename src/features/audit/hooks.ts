import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditApi } from "./api";
import { auditKeys } from "./query-keys";
import type { AuditListParams } from "./types";

export function useAuditEvents(params: AuditListParams) {
	return useQuery({
		queryKey: auditKeys.list(params),
		queryFn: ({ signal }) => auditApi.list(params, signal),
		placeholderData: keepPreviousData,
		// Qualquer operação em outra tela gera eventos, então o histórico é sempre recarregado.
		staleTime: 0,
		// A própria tabela mostra o erro com "Tentar novamente"; o global só cuida do 401.
		meta: { inlineError: true },
	});
}
