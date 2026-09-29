import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Filter, FilterX, History, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useClampPage } from "@/hooks/use-clamp-page";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";
import { maskDate } from "@/shared/format/masks";
import { formatAuditDetails } from "./format-details";
import { useAuditEvents } from "./hooks";
import {
	AUDIT_ACTION_OPTIONS,
	AUDIT_ENTITY_OPTIONS,
	auditActionLabel,
	auditEntityLabel,
	type FilterOption,
	isImportedEvent,
} from "./labels";
import {
	type AuditFiltersFormInput,
	type AuditFiltersFormValues,
	auditFiltersFormSchema,
	EMPTY_AUDIT_FILTERS_FORM,
	toAuditFilters,
} from "./schemas";
import { type AuditEvent, type AuditFilters, EMPTY_AUDIT_FILTERS } from "./types";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

/** O Radix Select não aceita item com valor vazio; no formulário, "Todas" continua sendo `""`. */
const ALL_OPTIONS_VALUE = "__todas__";

interface FilterSelectProps {
	id?: string;
	"aria-describedby"?: string;
	value: string;
	onChange: (value: string) => void;
	options: FilterOption[];
}

function FilterSelect({ value, onChange, options, ...triggerProps }: FilterSelectProps) {
	return (
		<Select
			value={value || ALL_OPTIONS_VALUE}
			onValueChange={(next) => onChange(next === ALL_OPTIONS_VALUE ? "" : next)}
		>
			<SelectTrigger className="w-full" {...triggerProps}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL_OPTIONS_VALUE}>Todas</SelectItem>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

const hasActiveFilters = (filters: AuditFilters) => Object.values(filters).some(Boolean);

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
	// Os filtros digitados só valem depois de "Filtrar": a paginação usa sempre os aplicados.
	const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
	const [page, setPage] = useState(0);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);

	const events = useAuditEvents({ ...filters, page, size });

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AuditFiltersFormInput, unknown, AuditFiltersFormValues>({
		resolver: zodResolver(auditFiltersFormSchema),
		defaultValues: EMPTY_AUDIT_FILTERS_FORM,
	});

	const pageInfo = events.data?.page;
	const data = useMemo(() => events.data?.content ?? [], [events.data]);
	const isFiltering = events.isFetching && !events.isPending;

	useClampPage({ page, pageInfo, isPlaceholderData: events.isPlaceholderData, setPage });

	const applyFilters = (next: AuditFilters) => {
		const unchanged = JSON.stringify(next) === JSON.stringify(filters);
		if (unchanged && page === 0) {
			events.refetch();
			return;
		}
		setFilters(next);
		setPage(0);
	};

	const submitFilters = handleSubmit((values) => applyFilters(toAuditFilters(values)));

	const clearFilters = () => {
		reset(EMPTY_AUDIT_FILTERS_FORM);
		applyFilters(EMPTY_AUDIT_FILTERS);
	};

	return (
		<>
			<PageHeader
				icon={History}
				title="Histórico"
				description="Quem fez o quê no sistema, do evento mais recente ao mais antigo."
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<search className="border-b p-4">
					<form
						noValidate
						aria-label="Filtros do histórico"
						className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-start"
						onSubmit={submitFilters}
					>
						<FormField
							label="Buscar"
							hint="Busque pelo nome de quem fez a ação ou pelo número do registro"
							className="sm:col-span-2"
						>
							<Input placeholder="Ex.: Maria ou 42" {...register("q")} />
						</FormField>
						<Controller
							control={control}
							name="action"
							render={({ field }) => (
								<FormField label="Ação">
									<FilterSelect
										value={field.value}
										onChange={field.onChange}
										options={AUDIT_ACTION_OPTIONS}
									/>
								</FormField>
							)}
						/>
						<Controller
							control={control}
							name="entityType"
							render={({ field }) => (
								<FormField label="Entidade">
									<FilterSelect
										value={field.value}
										onChange={field.onChange}
										options={AUDIT_ENTITY_OPTIONS}
									/>
								</FormField>
							)}
						/>
						<FormField label="De" error={errors.createdFrom?.message}>
							<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("createdFrom")} />
						</FormField>
						<FormField label="Até" error={errors.createdTo?.message}>
							<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("createdTo")} />
						</FormField>
						<div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-6">
							<Button type="submit" disabled={isFiltering}>
								{isFiltering ? (
									<Loader2 className="animate-spin" aria-hidden="true" />
								) : (
									<Filter aria-hidden="true" />
								)}
								{isFiltering ? "Filtrando…" : "Filtrar"}
							</Button>
							{hasActiveFilters(filters) && (
								<Button type="button" variant="ghost" onClick={clearFilters}>
									<FilterX aria-hidden="true" />
									Limpar filtros
								</Button>
							)}
						</div>
					</form>
				</search>

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
						<EmptyState
							title="Nenhum evento encontrado"
							description="Ações do sistema aparecerão aqui. Ajuste os filtros ou aguarde novas operações."
						/>
					}
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
