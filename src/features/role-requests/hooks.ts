import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssignableRole } from "@/features/session/types";
import { roleRequestsApi, usersApi } from "./api";
import { roleRequestKeys, userKeys } from "./query-keys";
import type { RoleRequestListParams } from "./types";

/** Intervalo em que o contador de pedidos pendentes do menu é atualizado. */
export const SUMMARY_REFRESH_MS = 60_000;

/** Fallbacks das operações abaixo, cujos erros aparecem no próprio formulário ou diálogo. */
export const ROLE_REQUEST_ERROR_MESSAGES = {
	create: "Não foi possível enviar o pedido.",
	cancel: "Não foi possível cancelar o pedido.",
	approve: "Não foi possível aprovar o pedido.",
	reject: "Não foi possível recusar o pedido.",
	changeRole: "Não foi possível alterar o perfil.",
} as const;

export function useMyRoleRequests({ enabled = true }: { enabled?: boolean } = {}) {
	return useQuery({
		queryKey: roleRequestKeys.mine(),
		queryFn: ({ signal }) => roleRequestsApi.mine(signal),
		enabled,
		meta: { inlineError: true },
	});
}

export function useCreateRoleRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: roleRequestsApi.create,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: roleRequestKeys.all }),
		meta: { inlineError: true },
	});
}

export function useCancelRoleRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: roleRequestsApi.cancel,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: roleRequestKeys.all }),
		meta: { inlineError: true },
	});
}

export function useRoleRequests(params: RoleRequestListParams) {
	return useQuery({
		queryKey: roleRequestKeys.list(params),
		queryFn: ({ signal }) => roleRequestsApi.list(params, signal),
		placeholderData: keepPreviousData,
		meta: { inlineError: true },
	});
}

/** Contador do menu; só consultado por quem analisa pedidos. */
export function useRoleRequestSummary({ enabled }: { enabled: boolean }) {
	return useQuery({
		queryKey: roleRequestKeys.summary(),
		queryFn: ({ signal }) => roleRequestsApi.summary(signal),
		enabled,
		refetchInterval: SUMMARY_REFRESH_MS,
		// Sem o número, o menu só deixa de mostrar o selo; o global continua cuidando do 401.
		meta: { inlineError: true },
	});
}

/** Aprovar, recusar ou trocar um perfil muda pedidos, contador e usuários ao mesmo tempo. */
function useInvalidateAccessData() {
	const queryClient = useQueryClient();
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: roleRequestKeys.all }),
			queryClient.invalidateQueries({ queryKey: userKeys.all }),
		]);
}

export function useApproveRoleRequest() {
	const invalidate = useInvalidateAccessData();
	return useMutation({
		mutationFn: roleRequestsApi.approve,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useRejectRoleRequest() {
	const invalidate = useInvalidateAccessData();
	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string | null }) =>
			roleRequestsApi.reject(id, reason),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useUsers() {
	return useQuery({
		queryKey: userKeys.all,
		queryFn: ({ signal }) => usersApi.list(signal),
		meta: { inlineError: true },
	});
}

export function useChangeUserRole() {
	const invalidate = useInvalidateAccessData();
	return useMutation({
		mutationFn: ({ userId, role }: { userId: number; role: AssignableRole }) =>
			usersApi.changeRole(userId, role),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}
