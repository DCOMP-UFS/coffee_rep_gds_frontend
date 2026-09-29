import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { History } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Card } from "@/components/ui/card";
import { useClampPage } from "@/hooks/use-clamp-page";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { useFilteredPage } from "@/hooks/use-filtered-page";
import { useValidFilterValues } from "@/hooks/use-valid-filter-values";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";
import { maskDate } from "@/shared/format/masks";
import {
	AUDIT_SORT_OPTIONS,
	type AuditSort,
	DEFAULT_HISTORY_FILTERS,
	type HistoryFilters,
	hasActiveHistoryFilters,
	toAuditListParams,
} from "./filters";
import { formatAuditDetails } from "./format-details";
import { useAuditEvents } from "./hooks";
import {
	AUDIT_ACTION_OPTIONS,
	AUDIT_ENTITY_OPTIONS,
	auditActionLabel,
	auditEntityLabel,
	isImportedEvent,
} from "./labels";
import {
	type AuditFiltersFormInput,
	type AuditFiltersFormValues,
	auditFiltersFormSchema,
	EMPTY_AUDIT_FILTERS_FORM,
	toAuditFilters,
} from "./schemas";
import type { AuditEvent } from "./types";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const columns: ColumnDef<AuditEvent>[] = [
	{
		id: "createdAt",
		header: "Data",
		meta: { className: "whitespace-nowrap" },
		cell: ({ row }) => formatIsoDateTimeBr(row.original.createdAt) || "—",
	},
	{
		id: "action",
		header: "Ação",
		cell: ({ row }) => (
			<div className="flex flex-wrap items-center gap-2">
				<span className="font-medium">{auditActionLabel(row.original.action)}</span>
				{isImportedEvent(row.original) && <StatusBadge tone="neutral">Importado</StatusBadge>}
			</div>
		),
	},
	{
		id: "entity",
		header: "Entidade",
		meta: { className: "whitespace-nowrap" },
		cell: ({ row }) => auditEntityLabel(row.original),
	},
	{ accessorKey: "actorName", header: "Responsável" },
	{
		id: "details",
		header: "Detalhes",
		meta: { className: "min-w-64" },
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{formatAuditDetails(row.original.details)}
			</span>
		),
	},
];

export function HistoryPage() {
	const [sort, setSort] = useState<AuditSort>(DEFAULT_HISTORY_FILTERS.sort);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);

	const {
		register,
		control,
		reset,
		formState: { errors, isDirty },
	} = useForm<AuditFiltersFormInput, unknown, AuditFiltersFormValues>({
		resolver: zodResolver(auditFiltersFormSchema),
		defaultValues: EMPTY_AUDIT_FILTERS_FORM,
		// O erro aparece ao sair do campo e, depois, a cada mudança, já que não há botão de enviar.
		mode: "onTouched",
	});
	// Selects e datas valem assim que o formulário é válido; a busca espera o fim da digitação,
	// mesmo que alguma data esteja inválida.
	const valid = useValidFilterValues(control, auditFiltersFormSchema);
	const search = useDebouncedSearch(useWatch({ control, name: "q" }));

	const filters: HistoryFilters = { ...toAuditFilters(valid), q: search.applied, sort };
	const [page, setPage] = useFilteredPage(filters);
	const events = useAuditEvents(toAuditListParams(filters, page, size));

	const pageInfo = events.data?.page;
	const data = useMemo(() => events.data?.content ?? [], [events.data]);
	const hasFilters = hasActiveHistoryFilters(filters);
	const canClear = isDirty || sort !== DEFAULT_HISTORY_FILTERS.sort;

	useClampPage({ page, pageInfo, isPlaceholderData: events.isPlaceholderData, setPage });

	const clearFilters = () => {
		reset(EMPTY_AUDIT_FILTERS_FORM);
		setSort(DEFAULT_HISTORY_FILTERS.sort);
	};

	return (
		<>
			<PageHeader
				icon={History}
				title="Histórico"
				description="Quem fez o quê no sistema e quando."
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<FilterBar
					label="Filtros do histórico"
					search={
						<FormField
							label="Buscar evento"
							hint="Busque pelo nome de quem fez a ação ou pelo número do registro"
						>
							<SearchInput
								placeholder="Ex.: Maria ou 42"
								isBusy={search.isPending || events.isPlaceholderData}
								{...register("q")}
							/>
						</FormField>
					}
					onClear={clearFilters}
					canClear={canClear}
				>
					<Controller
						control={control}
						name="action"
						render={({ field }) => (
							<FormField label="Ação" className="w-full sm:w-56">
								<FilterSelect
									value={field.value}
									onChange={field.onChange}
									options={AUDIT_ACTION_OPTIONS}
									allOptionLabel="Todas"
								/>
							</FormField>
						)}
					/>
					<Controller
						control={control}
						name="entityType"
						render={({ field }) => (
							<FormField label="Entidade" className="w-full sm:w-44">
								<FilterSelect
									value={field.value}
									onChange={field.onChange}
									options={AUDIT_ENTITY_OPTIONS}
									allOptionLabel="Todas"
								/>
							</FormField>
						)}
					/>
					<FormField label="De" error={errors.createdFrom?.message} className="w-full sm:w-36">
						<MaskedInput
							mask={maskDate}
							placeholder="DD/MM/AAAA"
							{...register("createdFrom", { deps: "createdTo" })}
						/>
					</FormField>
					<FormField label="Até" error={errors.createdTo?.message} className="w-full sm:w-36">
						<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("createdTo")} />
					</FormField>
					<FormField label="Ordenar por" className="w-full sm:w-44">
						<FilterSelect value={sort} onChange={setSort} options={AUDIT_SORT_OPTIONS} />
					</FormField>
				</FilterBar>

				<DataTable
					caption="Eventos do histórico"
					columns={columns}
					data={data}
					getRowId={(event) => String(event.id)}
					isLoading={events.isPending}
					isError={events.isError}
					onRetry={() => events.refetch()}
					isRetrying={events.isFetching}
					isPlaceholderData={events.isPlaceholderData}
					skeletonRows={6}
					emptyState={
						hasFilters ? (
							<EmptyState
								title="Nenhum evento encontrado"
								description="Nenhum evento corresponde aos filtros escolhidos. Ajuste os filtros para ver outros eventos."
								action={<ClearFiltersButton onClick={clearFilters} />}
							/>
						) : (
							<EmptyState
								title="Nenhum evento registrado"
								description="Ações do sistema aparecerão aqui assim que forem realizadas."
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
								disabled={events.isPlaceholderData}
							/>
						)
					}
				/>
			</Card>
		</>
	);
}
