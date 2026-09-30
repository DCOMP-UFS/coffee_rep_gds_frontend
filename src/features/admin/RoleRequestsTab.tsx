import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Check, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	ROLE_REQUEST_ERROR_MESSAGES,
	useApproveRoleRequest,
	useRejectRoleRequest,
	useRoleRequests,
} from "@/features/role-requests/hooks";
import { ROLE_REQUEST_STATUS_OPTIONS } from "@/features/role-requests/labels";
import { RoleRequestStatusBadge } from "@/features/role-requests/RoleRequestStatusBadge";
import type { RoleRequest, RoleRequestStatus } from "@/features/role-requests/types";
import { roleLabel } from "@/features/session/roles";
import { useClampPage } from "@/hooks/use-clamp-page";
import { useFilteredPage } from "@/hooks/use-filtered-page";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";

export const ROLE_REQUEST_APPROVED_MESSAGE = "Pedido aprovado. O novo perfil já vale.";
export const ROLE_REQUEST_REJECTED_MESSAGE = "Pedido recusado.";
const REVIEW_NOTE_MAX_LENGTH = 500;
const PAGE_SIZE_OPTIONS = [10, 20] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
const DEFAULT_STATUS: RoleRequestStatus = "PENDING";

type Review = { kind: "approve" | "reject"; request: RoleRequest };

export function RoleRequestsTab() {
	const [status, setStatus] = useState<RoleRequestStatus | "">(DEFAULT_STATUS);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const [page, setPage] = useFilteredPage({ status });
	const requests = useRoleRequests({ status: status || undefined, page, size });
	const approve = useApproveRoleRequest();
	const reject = useRejectRoleRequest();

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [review, setReview] = useState<Review>();
	const [reviewOpen, setReviewOpen] = useState(false);
	const [reason, setReason] = useState("");

	const pageInfo = requests.data?.page;
	const data = requests.data?.content ?? [];
	useClampPage({ page, pageInfo, isPlaceholderData: requests.isPlaceholderData, setPage });

	const resetApprove = approve.reset;
	const resetReject = reject.reset;
	const openReview = useCallback(
		(kind: Review["kind"], request: RoleRequest) => {
			resetApprove();
			resetReject();
			setReason("");
			setReview({ kind, request });
			setReviewOpen(true);
		},
		[resetApprove, resetReject],
	);

	const confirmReview = () => {
		if (!review) return;
		const close = (message: string) => () => {
			toast.success(message);
			setReviewOpen(false);
		};
		if (review.kind === "approve") {
			approve.mutate(review.request.id, { onSuccess: close(ROLE_REQUEST_APPROVED_MESSAGE) });
		} else {
			reject.mutate(
				{ id: review.request.id, reason: reason.trim() || null },
				{ onSuccess: close(ROLE_REQUEST_REJECTED_MESSAGE) },
			);
		}
	};

	const columns = useMemo<ColumnDef<RoleRequest>[]>(
		() => [
			{
				id: "createdAt",
				header: "Data",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => formatIsoDateTimeBr(row.original.createdAt) || "—",
			},
			{
				id: "user",
				header: "Usuário",
				cell: ({ row }) => (
					<div className="grid">
						<span className="font-medium">{row.original.userName}</span>
						{row.original.userEmail && (
							<span className="text-xs text-muted-foreground">{row.original.userEmail}</span>
						)}
					</div>
				),
			},
			{
				id: "roles",
				header: "Perfil",
				cell: ({ row }) => (
					<span className="inline-flex flex-wrap items-center gap-1.5">
						<span className="text-muted-foreground">{roleLabel(row.original.currentRole)}</span>
						<ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
						<span className="sr-only">para</span>
						<span className="font-medium">{roleLabel(row.original.requestedRole)}</span>
					</span>
				),
			},
			{
				id: "justification",
				header: "Justificativa",
				meta: { className: "min-w-56" },
				cell: ({ row }) => (
					<span className="whitespace-pre-line">{row.original.justification}</span>
				),
			},
			{
				id: "status",
				header: "Situação",
				cell: ({ row }) => (
					<div className="grid justify-items-start gap-1">
						<RoleRequestStatusBadge status={row.original.status} />
						{row.original.reviewNote && (
							<span className="text-xs text-muted-foreground">{row.original.reviewNote}</span>
						)}
					</div>
				),
			},
			{
				id: "actions",
				header: () => <span className="sr-only md:not-sr-only">Ações</span>,
				meta: { className: "text-right" },
				cell: ({ row }) =>
					row.original.status === "PENDING" && (
						<div className="flex justify-end gap-2">
							<Button
								size="sm"
								onClick={() => openReview("approve", row.original)}
								aria-label={`Aprovar pedido de ${row.original.userName}`}
							>
								<Check aria-hidden="true" />
								Aprovar
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => openReview("reject", row.original)}
								aria-label={`Recusar pedido de ${row.original.userName}`}
							>
								<X aria-hidden="true" />
								Recusar
							</Button>
						</div>
					),
			},
		],
		[openReview],
	);

	const isApprove = review?.kind === "approve";
	const reviewMutation = isApprove ? approve : reject;
	const target = review?.request;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="flex flex-wrap items-end gap-4 border-b p-4">
				<FormField label="Situação" className="w-full sm:w-48">
					<FilterSelect
						value={status}
						onChange={setStatus}
						options={ROLE_REQUEST_STATUS_OPTIONS}
						allOptionLabel="Todas"
					/>
				</FormField>
			</div>

			<DataTable
				caption="Pedidos de acesso"
				columns={columns}
				data={data}
				getRowId={(request) => String(request.id)}
				isLoading={requests.isPending}
				isError={requests.isError}
				onRetry={() => requests.refetch()}
				isRetrying={requests.isFetching}
				isPlaceholderData={requests.isPlaceholderData}
				skeletonRows={4}
				emptyState={
					status === "PENDING" ? (
						<EmptyState
							title="Nenhum pedido pendente"
							description="Quando alguém pedir mais acesso, o pedido aparece aqui e um e-mail avisa você."
						/>
					) : (
						<EmptyState
							title="Nenhum pedido encontrado"
							description="Nenhum pedido corresponde à situação escolhida."
						/>
					)
				}
				header={pageInfo && data.length > 0 && <PaginationSummary page={pageInfo} />}
				footer={
					pageInfo &&
					data.length > 0 && (
						<PaginationBar
							page={pageInfo}
							pageSizeOptions={PAGE_SIZE_OPTIONS}
							onPageChange={setPage}
							onPageSizeChange={(value) => {
								setSize(value);
								setPage(0);
							}}
							disabled={requests.isPlaceholderData}
						/>
					)
				}
			/>

			<ConfirmDialog
				open={reviewOpen}
				onOpenChange={setReviewOpen}
				tone={isApprove ? "default" : "destructive"}
				title={
					isApprove
						? `Aprovar o pedido de ${target?.userName ?? ""}?`
						: `Recusar o pedido de ${target?.userName ?? ""}?`
				}
				description={
					target &&
					(isApprove
						? `O perfil passa de ${roleLabel(target.currentRole)} para ${roleLabel(target.requestedRole)} na hora, sem precisar entrar de novo.`
						: `O perfil continua ${roleLabel(target.currentRole)}. O motivo, se informado, aparece para o usuário em “Meu acesso”.`)
				}
				confirmLabel={isApprove ? "Aprovar" : "Recusar"}
				cancelLabel="Voltar"
				isPending={reviewMutation.isPending}
				error={
					reviewMutation.isError
						? getHttpErrorMessage(
								reviewMutation.error,
								isApprove
									? ROLE_REQUEST_ERROR_MESSAGES.approve
									: ROLE_REQUEST_ERROR_MESSAGES.reject,
							)
						: undefined
				}
				onConfirm={confirmReview}
			>
				{!isApprove && (
					<FormField
						label="Motivo (opcional)"
						hint={`${reason.trim().length}/${REVIEW_NOTE_MAX_LENGTH}`}
					>
						<Textarea
							rows={3}
							maxLength={REVIEW_NOTE_MAX_LENGTH}
							value={reason}
							onChange={(event) => {
								if (reject.isError) reject.reset();
								setReason(event.target.value);
							}}
							disabled={reject.isPending}
							placeholder="Ex.: Esse acesso é só para a secretaria do ambulatório."
						/>
					</FormField>
				)}
			</ConfirmDialog>
		</Card>
	);
}
