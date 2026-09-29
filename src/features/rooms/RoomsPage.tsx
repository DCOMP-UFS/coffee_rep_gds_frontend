import type { ColumnDef } from "@tanstack/react-table";
import { DoorClosed, DoorOpen, FilterX, Plus } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { RowActions } from "@/components/data-table/RowActions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { SelectPlaceholderItem } from "@/components/form/SelectPlaceholderItem";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSections } from "@/features/sections/hooks";
import { useClampPage } from "@/hooks/use-clamp-page";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { ROOM_ERROR_MESSAGES, useDeleteRoom, useRooms } from "./hooks";
import { RoomFormDialog } from "./RoomFormDialog";
import { RoomsSummary } from "./RoomsSummary";
import { parseSectionParam, ROOM_SECTION_PARAM } from "./search-params";
import { ALL_SECTIONS, ROOM_STATUS_FILTERS, type Room, type RoomStatusFilter } from "./types";

export const ROOM_DELETED_MESSAGE = "Sala excluída com sucesso.";
export const PAGE_SIZE_OPTIONS = [5, 10] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export function RoomsPage() {
	const sectionFilterId = useId();
	const statusFilterId = useId();

	const [searchParams, setSearchParams] = useSearchParams();
	const [status, setStatus] = useState<RoomStatusFilter>("Todas");
	const [page, setPage] = useState(0);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);

	const sections = useSections();
	// O setor vem da URL para o filtro poder ser aberto por link; setor inexistente vira "Todas".
	const requestedSectionId = parseSectionParam(searchParams.get(ROOM_SECTION_PARAM));
	const isUnknownSection =
		requestedSectionId !== ALL_SECTIONS &&
		sections.data !== undefined &&
		!sections.data.some((section) => section.id === requestedSectionId);
	const sectionId = isUnknownSection ? ALL_SECTIONS : requestedSectionId;

	const rooms = useRooms({ sectionId, status, page, size });
	const deleteRoom = useDeleteRoom();

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Room>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Room>();

	const pageInfo = rooms.data?.page;
	const data = rooms.data?.content ?? [];
	const hasFilters = sectionId !== ALL_SECTIONS || status !== "Todas";

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

	const changeSection = (value: number) => {
		setSectionParam(value);
		setPage(0);
	};

	const changeStatus = (value: RoomStatusFilter) => {
		setStatus(value);
		setPage(0);
	};

	const clearFilters = () => {
		setSectionParam(ALL_SECTIONS);
		setStatus("Todas");
		setPage(0);
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
			{
				id: "actions",
				header: () => <span className="sr-only md:not-sr-only">Ações</span>,
				meta: { className: "w-28 text-right" },
				cell: ({ row }) => (
					<RowActions
						editLabel={`Editar sala ${row.original.nome}`}
						deleteLabel={`Excluir sala ${row.original.nome}`}
						onEdit={() => openForm(row.original)}
						onDelete={() => askDelete(row.original)}
					/>
				),
			},
		],
		[openForm, askDelete],
	);

	const sectionOptions = useMemo(
		() => [
			{ value: ALL_SECTIONS, label: "Todas" },
			...(sections.data ?? []).map((section) => ({ value: section.id, label: section.nome })),
		],
		[sections.data],
	);

	const newRoomButton = (
		<Button onClick={() => openForm()}>
			<Plus aria-hidden="true" />
			Nova sala
		</Button>
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
				<div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-end">
					<div className="grid gap-1.5 sm:w-64">
						<Label htmlFor={sectionFilterId}>Setor</Label>
						<SearchableSelect
							id={sectionFilterId}
							options={sectionOptions}
							value={sectionId}
							onChange={changeSection}
							placeholder="Selecione o setor"
							searchPlaceholder="Pesquisar setor..."
						/>
					</div>
					<div className="grid gap-1.5 sm:w-44">
						<Label htmlFor={statusFilterId}>Status</Label>
						<Select
							value={status}
							onValueChange={(value) => changeStatus(value as RoomStatusFilter)}
						>
							<SelectTrigger id={statusFilterId} className="w-full">
								<SelectValue placeholder="Selecione o status" />
							</SelectTrigger>
							<SelectContent>
								<SelectPlaceholderItem>Selecione o status</SelectPlaceholderItem>
								{ROOM_STATUS_FILTERS.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{hasFilters && (
						<Button variant="ghost" onClick={clearFilters} className="sm:ml-auto">
							<FilterX aria-hidden="true" />
							Limpar filtros
						</Button>
					)}
				</div>

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
								action={
									<Button variant="outline" onClick={clearFilters}>
										<FilterX aria-hidden="true" />
										Limpar filtros
									</Button>
								}
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
