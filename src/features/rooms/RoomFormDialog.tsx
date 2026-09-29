import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FormField } from "@/components/form/FormField";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Section } from "@/features/sections/types";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { ROOM_ERROR_MESSAGES, useCreateRoom, useUpdateRoom } from "./hooks";
import {
	type RoomFormInput,
	type RoomFormValues,
	roomFormSchema,
	toRoomFormInput,
	toRoomWriteDto,
} from "./schemas";
import type { Room } from "./types";

export const ROOM_SAVED_MESSAGE = "Sala salva com sucesso.";
export const SECTIONS_LOAD_ERROR_MESSAGE = "Não foi possível carregar os setores.";

interface RoomFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Sala em edição; ausente para cadastrar uma nova. */
	room?: Room;
	sections: Section[];
	sectionsLoading: boolean;
	sectionsError: boolean;
	onRetrySections: () => void;
	isRetryingSections: boolean;
}

export function RoomFormDialog({
	open,
	onOpenChange,
	room,
	sections,
	sectionsLoading,
	sectionsError,
	onRetrySections,
	isRetryingSections,
}: RoomFormDialogProps) {
	const createRoom = useCreateRoom();
	const updateRoom = useUpdateRoom();
	const save = room ? updateRoom : createRoom;
	const isPending = createRoom.isPending || updateRoom.isPending;
	const hasSections = sections.length > 0;
	const sectionsUnavailable = sectionsError && !hasSections;

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<RoomFormInput, unknown, RoomFormValues>({
		resolver: zodResolver(roomFormSchema),
		mode: "onTouched",
		defaultValues: toRoomFormInput(room),
	});

	const resetCreate = createRoom.reset;
	const resetUpdate = updateRoom.reset;
	useEffect(() => {
		if (!open) return;
		reset(toRoomFormInput(room));
		resetCreate();
		resetUpdate();
	}, [open, room, reset, resetCreate, resetUpdate]);

	const clearSaveError = () => {
		if (save.isError) save.reset();
	};

	const onSuccess = () => {
		toast.success(ROOM_SAVED_MESSAGE);
		onOpenChange(false);
	};

	const onSubmit = handleSubmit((values) => {
		const body = toRoomWriteDto(values);
		if (room) {
			updateRoom.mutate({ id: room.id, body }, { onSuccess });
		} else {
			createRoom.mutate(body, { onSuccess });
		}
	});

	return (
		<Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{room ? "Editar sala" : "Nova sala"}</DialogTitle>
					<DialogDescription>
						Informe o nome da sala e o setor ao qual ela pertence.
					</DialogDescription>
				</DialogHeader>

				{sectionsUnavailable && (
					<FormErrorAlert
						message={SECTIONS_LOAD_ERROR_MESSAGE}
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={onRetrySections}
								disabled={isRetryingSections}
							>
								{isRetryingSections && <Loader2 className="animate-spin" aria-hidden="true" />}
								Tentar novamente
							</Button>
						}
					/>
				)}

				{!sectionsLoading && !sectionsError && !hasSections && (
					<div className="flex gap-3 rounded-lg border border-warning/20 bg-warning-soft p-3 text-sm text-warning">
						<Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<p>
							Cadastre um setor antes de criar salas.{" "}
							<Link to="/sections" className="font-semibold underline">
								Ir para Setores
							</Link>
						</p>
					</div>
				)}

				<form
					id="room-form"
					noValidate
					className="grid gap-4"
					onSubmit={onSubmit}
					onChange={clearSaveError}
				>
					<FormField label="Nome da sala" required error={errors.nome?.message}>
						<Input placeholder="Ex.: Consultório 12" autoComplete="off" {...register("nome")} />
					</FormField>

					<Controller
						control={control}
						name="setorId"
						render={({ field, fieldState }) => (
							<FormField label="Setor" required error={fieldState.error?.message}>
								<SearchableSelect
									options={sections.map((section) => ({ value: section.id, label: section.nome }))}
									value={field.value}
									onChange={(value) => {
										clearSaveError();
										field.onChange(value);
									}}
									onBlur={field.onBlur}
									placeholder={sectionsLoading ? "Carregando setores..." : "Selecione o setor"}
									searchPlaceholder="Pesquisar setor..."
									disabled={!hasSections}
								/>
							</FormField>
						)}
					/>
					{save.isError && (
						<FormErrorAlert
							message={getHttpErrorMessage(
								save.error,
								room ? ROOM_ERROR_MESSAGES.update : ROOM_ERROR_MESSAGES.create,
							)}
						/>
					)}
				</form>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={isPending}>
							Cancelar
						</Button>
					</DialogClose>
					<Button type="submit" form="room-form" disabled={isPending || !hasSections}>
						{isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
						{isPending ? "Salvando…" : "Salvar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
