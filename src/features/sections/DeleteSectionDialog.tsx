import { ArrowRight, Loader2, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSectionRoomCount } from "@/features/rooms/hooks";
import { roomsBySectionPath } from "@/features/rooms/search-params";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { SECTION_ERROR_MESSAGES, useDeleteSection } from "./hooks";
import type { Section } from "./types";

export const SECTION_REMOVED_MESSAGE = "Setor removido.";
export const SECTION_ROOMS_CHECKING_MESSAGE = "Verificando se o setor tem salas…";
export const SECTION_ROOMS_CHECK_ERROR_MESSAGE = "Não foi possível verificar as salas deste setor.";
export const SECTION_WITH_ROOMS_DESCRIPTION =
	"Não é possível excluir um setor que ainda tem salas.";

export const sectionWithRoomsMessage = (count: number) =>
	`Este setor tem ${count === 1 ? "1 sala" : `${count} salas`}. Exclua as salas deste setor antes de excluir o setor.`;

interface DeleteSectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Setor alvo; mantido após fechar para o conteúdo não mudar durante a animação de saída. */
	section?: Section;
}

/**
 * Excluir um setor desativa as salas dele no backend. Por isso a exclusão só é liberada
 * depois de confirmar que o setor não tem salas; se tiver, o usuário é levado a elas.
 */
export function DeleteSectionDialog({ open, onOpenChange, section }: DeleteSectionDialogProps) {
	const deleteSection = useDeleteSection();
	const roomCount = useSectionRoomCount(section?.id, { enabled: open });

	const isChecking = roomCount.isPending || roomCount.isFetching;
	const hasRooms = !isChecking && !roomCount.isError && (roomCount.data ?? 0) > 0;
	const canDelete = !isChecking && !roomCount.isError && !hasRooms;

	const changeOpen = (next: boolean) => {
		if (!next) deleteSection.reset();
		onOpenChange(next);
	};

	const confirmDelete = () => {
		if (!section || !canDelete) return;
		deleteSection.mutate(section.id, {
			onSuccess: () => {
				toast.success(SECTION_REMOVED_MESSAGE);
				changeOpen(false);
			},
		});
	};

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={changeOpen}
			title={`Excluir o setor “${section?.nome ?? ""}”?`}
			description={hasRooms ? SECTION_WITH_ROOMS_DESCRIPTION : undefined}
			isPending={deleteSection.isPending}
			confirmDisabled={!canDelete}
			error={
				deleteSection.isError
					? getHttpErrorMessage(deleteSection.error, SECTION_ERROR_MESSAGES.remove)
					: undefined
			}
			onConfirm={confirmDelete}
		>
			{isChecking && !deleteSection.isPending && (
				<p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					{SECTION_ROOMS_CHECKING_MESSAGE}
				</p>
			)}

			{!isChecking && roomCount.isError && (
				<FormErrorAlert
					message={SECTION_ROOMS_CHECK_ERROR_MESSAGE}
					action={
						<Button variant="outline" size="sm" onClick={() => roomCount.refetch()}>
							Tentar novamente
						</Button>
					}
				/>
			)}

			{hasRooms && section && (
				<Alert variant="warning">
					<TriangleAlert aria-hidden="true" />
					<AlertDescription>
						<p>{sectionWithRoomsMessage(roomCount.data ?? 0)}</p>
						<Button asChild variant="outline" size="sm">
							<Link to={roomsBySectionPath(section.id)}>
								Ver salas do setor
								<ArrowRight aria-hidden="true" />
							</Link>
						</Button>
					</AlertDescription>
				</Alert>
			)}
		</ConfirmDialog>
	);
}
