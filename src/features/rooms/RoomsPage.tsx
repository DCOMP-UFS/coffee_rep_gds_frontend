import type { ColumnDef } from "@tanstack/react-table";
import { DoorClosed, DoorOpen, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LockableButton } from "@/components/actions/LockableButton";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { actionsColumn, RowActions } from "@/components/data-table/RowActions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Card } from "@/components/ui/card";
import { useSections } from "@/features/sections/hooks";
import { useAccess } from "@/features/session/access-dialog/useAccess";
import { useClampPage } from "@/hooks/use-clamp-page";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { useFilteredPage } from "@/hooks/use-filtered-page";
import { getHttpErrorMessage } from "@/lib/api/errors";
import {
	DEFAULT_ROOM_FILTERS,
	hasActiveRoomFilters,
	ROOM_SORT_OPTIONS,
	type RoomFilters,
	type RoomSort,
	toRoomListFilters,
} from "./filters";
import { ROOM_ERROR_MESSAGES, useDeleteRoom, useRooms } from "./hooks";
import { RoomFormDialog } from "./RoomFormDialog";
import { RoomsSummary } from "./RoomsSummary";
import { parseSectionParam, ROOM_SECTION_PARAM } from "./search-params";
import { ALL_SECTIONS, ROOM_STATUS_FILTERS, type Room, type RoomStatusFilter } from "./types";

export const ROOM_DELETED_MESSAGE = "Sala excluída com sucesso.";
export const PAGE_SIZE_OPTIONS = [5, 10] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const STATUS_OPTIONS = ROOM_STATUS_FILTERS.map((option) => ({ value: option, label: option }));

export function RoomsPage() {
	const { lock } = useAccess("catalog.manage", "Cadastrar, editar e excluir salas");
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchInput, setSearchInput] = useState(DEFAULT_ROOM_FILTERS.search);
	const [status, setStatus] = useState<RoomStatusFilter>(DEFAULT_ROOM_FILTERS.status);
	const [sort, setSort] = useState<RoomSort>(DEFAULT_ROOM_FILTERS.sort);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const search = useDebouncedSearch(searchInput);

	const sections = useSections();
	// O setor vem da URL para o filtro poder ser aberto por link; setor inexistente vira "Todas".
	const requestedSectionId = parseSectionParam(searchParams.get(ROOM_SECTION_PARAM));
	const isUnknownSection =
		requestedSectionId !== ALL_SECTIONS &&
		sections.data !== undefined &&
		!sections.data.some((section) => section.id === requestedSectionId);
	const sectionId = isUnknownSection ? ALL_SECTIONS : requestedSectionId;

	const filters: RoomFilters = { search: search.applied, sectionId, status, sort };
	const [page, setPage] = useFilteredPage(filters);
	const rooms = useRooms(toRoomListFilters(filters, page, size));
	const deleteRoom = useDeleteRoom();

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Room>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Room>();

	const pageInfo = rooms.data?.page;
	const data = rooms.data?.content ?? [];
	const hasFilters = hasActiveRoomFilters(filters);
	const canClear =
		hasActiveRoomFilters({ ...filters, search: searchInput }) || sort !== DEFAULT_ROOM_FILTERS.sort;

	useClampPage({ page, pageInfo, isPlaceholderData: rooms.isPlaceholderData, setPage });

	const setSectionParam = (value: number) =>
		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				if (value === ALL_SECTIONS) {
					next.delete(ROOM_SECTION_PARAM);
				} else {
					next.set(ROOM_SECTION_PARAM, String(value));
				}
				return next;
			},
			{ replace: true },
		);

	const clearFilters = () => {
		setSearchInput(DEFAULT_ROOM_FILTERS.search);
		setSectionParam(DEFAULT_ROOM_FILTERS.sectionId);
		setStatus(DEFAULT_ROOM_FILTERS.status);
		setSort(DEFAULT_ROOM_FILTERS.sort);
	};

	const openForm = useCallback((room?: Room) => {
		setEditing(room);
		setFormOpen(true);
	}, []);

	const resetDelete = deleteRoom.reset;
	const askDelete = useCallback(
		(room: Room) => {
			resetDelete();
			setDeleting(room);
			setConfirmOpen(true);
		},
		[resetDelete],
	);

	const confirmDelete = () => {
		if (!deleting) return;
		deleteRoom.mutate(deleting.id, {
			onSuccess: () => {
				toast.success(ROOM_DELETED_MESSAGE);
				setConfirmOpen(false);
			},
		});
	};

	const columns = useMemo<ColumnDef<Room>[]>(
		() => [
			{
				accessorKey: "nome",
				header: "Sala",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
			},
			{
				accessorKey: "setor",
				header: "Setor",
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.setor}</span>,
			},
			{
				id: "status",
				header: "Status atual",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) =>
					row.original.ocupada ? (
						<StatusBadge tone="danger" icon={DoorClosed}>
							Ocupada
						</StatusBadge>
					) : (
						<StatusBadge tone="success" icon={DoorOpen}>
							Livre
						</StatusBadge>
					),
			},
			...actionsColumn<Room>((room) => (
				<RowActions
					editLabel={`Editar sala ${room.nome}`}
					deleteLabel={`Excluir sala ${room.nome}`}
					lock={lock}
					onEdit={() => openForm(room)}
					onDelete={() => askDelete(room)}
				/>
			)),
		],
		[lock, openForm, askDelete],
	);

	const sectionOptions = useMemo(
		() => [
			{ value: ALL_SECTIONS, label: "Todas" },
			...(sections.data ?? []).map((section) => ({ value: section.id, label: section.nome })),
		],
		[sections.data],
	);

	const newRoomButton = (
		<LockableButton icon={Plus} label="Nova sala" lock={lock} onClick={() => openForm()} />
	);

	return (
		<>
			<PageHeader
				icon={DoorOpen}
				title="Salas"
				description="Acompanhe a ocupação e mantenha o cadastro de salas por setor."
				actions={newRoomButton}
			/>

			<RoomsSummary />

			<Card className="gap-0 overflow-hidden py-0">
				<FilterBar
					label="Filtros das salas"
					search={
						<FormField label="Buscar sala" hint="Busque pelo nome da sala">
							<SearchInput
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Ex.: Consultório 3"
								isBusy={search.isPending || rooms.isPlaceholderData}
							/>
						</FormField>
					}
					onClear={clearFilters}
					canClear={canClear}
				>
					<FormField label="Setor" className="w-full sm:w-64">
						<SearchableSelect
							options={sectionOptions}
							value={sectionId}
							onChange={setSectionParam}
							placeholder="Selecione o setor"
							searchPlaceholder="Pesquisar setor..."
						/>
					</FormField>
					<FormField label="Status" className="w-full sm:w-40">
						<FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
					</FormField>
					<FormField label="Ordenar por" className="w-full sm:w-44">
						<FilterSelect value={sort} onChange={setSort} options={ROOM_SORT_OPTIONS} />
					</FormField>
				</FilterBar>

				<DataTable
					caption="Salas cadastradas"
					columns={columns}
					data={data}
					getRowId={(room) => String(room.id)}
					isLoading={rooms.isPending}
					isError={rooms.isError}
					onRetry={() => rooms.refetch()}
					isRetrying={rooms.isFetching}
					isPlaceholderData={rooms.isPlaceholderData}
					skeletonRows={size}
					emptyState={
						hasFilters ? (
							<EmptyState
								title="Nenhuma sala encontrada"
								description="Nenhuma sala corresponde aos filtros escolhidos. Ajuste os filtros ou cadastre uma nova sala."
								action={<ClearFiltersButton onClick={clearFilters} />}
							/>
						) : (
							<EmptyState
								title="Nenhuma sala cadastrada"
								description="Cadastre salas por setor ou ajuste os filtros acima."
								action={newRoomButton}
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
								disabled={rooms.isPlaceholderData}
							/>
						)
					}
				/>
			</Card>

			<RoomFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				room={editing}
				sections={sections.data ?? []}
				sectionsLoading={sections.isPending}
				sectionsError={sections.isError}
				onRetrySections={() => sections.refetch()}
				isRetryingSections={sections.isFetching}
			/>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={`Excluir a sala “${deleting?.nome ?? ""}”?`}
				isPending={deleteRoom.isPending}
				error={
					deleteRoom.isError
						? getHttpErrorMessage(deleteRoom.error, ROOM_ERROR_MESSAGES.remove)
						: undefined
				}
				onConfirm={confirmDelete}
			/>
		</>
	);
}
