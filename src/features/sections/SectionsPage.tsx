import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { actionsColumn, RowActions } from "@/components/data-table/RowActions";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePermission } from "@/features/session/hooks";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { DeleteSectionDialog } from "./DeleteSectionDialog";
import {
	DEFAULT_SECTION_FILTERS,
	filterSections,
	hasActiveSectionFilters,
	SECTION_SORT_OPTIONS,
	type SectionSort,
} from "./filters";
import { useSections } from "./hooks";
import { SectionFormDialog } from "./SectionFormDialog";
import type { Section } from "./types";

const countLabel = (count: number) => (count === 1 ? "1 setor" : `${count} setores`);

export function SectionsPage() {
	const sections = useSections();
	const canManage = usePermission("catalog.manage");

	const [searchInput, setSearchInput] = useState(DEFAULT_SECTION_FILTERS.search);
	const [sort, setSort] = useState<SectionSort>(DEFAULT_SECTION_FILTERS.sort);
	const search = useDebouncedSearch(searchInput);

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Section>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Section>();

	const openForm = useCallback((section?: Section) => {
		setEditing(section);
		setFormOpen(true);
	}, []);

	const askDelete = useCallback((section: Section) => {
		setDeleting(section);
		setConfirmOpen(true);
	}, []);

	const clearFilters = () => {
		setSearchInput(DEFAULT_SECTION_FILTERS.search);
		setSort(DEFAULT_SECTION_FILTERS.sort);
	};

	const columns = useMemo<ColumnDef<Section>[]>(
		() => [
			{
				accessorKey: "nome",
				header: "Nome",
				cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
			},
			{
				id: "observacoes",
				header: "Observação",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.observacoes || "—"}</span>
				),
			},
			...actionsColumn<Section>(canManage, (section) => (
				<RowActions
					editLabel={`Editar setor ${section.nome}`}
					deleteLabel={`Excluir setor ${section.nome}`}
					onEdit={() => openForm(section)}
					onDelete={() => askDelete(section)}
				/>
			)),
		],
		[canManage, openForm, askDelete],
	);

	const allCount = sections.data?.length ?? 0;
	const isFiltered = hasActiveSectionFilters({ search: search.applied, sort });
	const data = useMemo(
		() => filterSections(sections.data ?? [], { search: search.applied, sort }),
		[sections.data, search.applied, sort],
	);
	const total = isFiltered ? `${data.length} de ${countLabel(allCount)}` : countLabel(allCount);
	const canClear = searchInput.trim() !== "" || sort !== DEFAULT_SECTION_FILTERS.sort;

	const newSectionButton = canManage && (
		<Button onClick={() => openForm()}>
			<Plus aria-hidden="true" />
			Novo setor
		</Button>
	);

	return (
		<>
			<PageHeader
				icon={Building2}
				title="Setores"
				description="Organize os setores usados no cadastro de salas e nos filtros."
				actions={newSectionButton}
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<FilterBar
					label="Filtros dos setores"
					search={
						<FormField label="Buscar setor" hint="Busque pelo nome ou pela observação">
							<SearchInput
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Ex.: Pediatria ou 2º andar"
								isBusy={search.isPending}
							/>
						</FormField>
					}
					onClear={clearFilters}
					canClear={canClear}
				>
					<FormField label="Ordenar por" className="w-full sm:w-48">
						<FilterSelect value={sort} onChange={setSort} options={SECTION_SORT_OPTIONS} />
					</FormField>
				</FilterBar>

				<DataTable
					caption="Setores cadastrados"
					columns={columns}
					data={data}
					getRowId={(section) => String(section.id)}
					isLoading={sections.isPending}
					isError={sections.isError}
					onRetry={() => sections.refetch()}
					isRetrying={sections.isFetching}
					emptyState={
						isFiltered && allCount > 0 ? (
							<EmptyState
								title="Nenhum setor encontrado"
								description="Nenhum setor corresponde à busca. Ajuste a busca ou cadastre um novo setor."
								action={<ClearFiltersButton onClick={clearFilters} />}
							/>
						) : (
							<EmptyState
								title="Nenhum setor cadastrado"
								description="Os setores são usados ao cadastrar salas e filtros."
								action={newSectionButton}
							/>
						)
					}
					header={data.length > 0 && <p>{total}</p>}
					footer={
						data.length > 0 && (
							<p className="border-t px-4 py-3 text-sm text-muted-foreground">{total}</p>
						)
					}
				/>
			</Card>

			<SectionFormDialog open={formOpen} onOpenChange={setFormOpen} section={editing} />

			<DeleteSectionDialog open={confirmOpen} onOpenChange={setConfirmOpen} section={deleting} />
		</>
	);
}
