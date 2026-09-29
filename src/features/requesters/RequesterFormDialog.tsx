import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
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
import { getHttpErrorMessage } from "@/lib/api/errors";
import { maskFlexiblePhone } from "@/shared/format/masks";
import { REQUESTER_ERROR_MESSAGES, useSaveRequester } from "./hooks";
import {
	type RequesterFormInput,
	type RequesterFormValues,
	requesterFormSchema,
	toRequesterFormInput,
	toRequesterWriteDto,
} from "./schemas";
import type { Requester } from "./types";

export const REQUESTER_SAVED_MESSAGE = "Solicitante salvo com sucesso.";

interface RequesterFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Solicitante em edição; ausente para cadastrar um novo. */
	requester?: Requester;
}

export function RequesterFormDialog({ open, onOpenChange, requester }: RequesterFormDialogProps) {
	const save = useSaveRequester();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<RequesterFormInput, unknown, RequesterFormValues>({
		resolver: zodResolver(requesterFormSchema),
		mode: "onTouched",
		defaultValues: toRequesterFormInput(requester),
	});

	const resetSave = save.reset;
	useEffect(() => {
		if (!open) return;
		reset(toRequesterFormInput(requester));
		resetSave();
	}, [open, requester, reset, resetSave]);

	const clearSaveError = () => {
		if (save.isError) save.reset();
	};

	const onSubmit = handleSubmit((values) =>
		save.mutate(
			{ id: requester?.id, body: toRequesterWriteDto(values) },
			{
				onSuccess: () => {
					toast.success(REQUESTER_SAVED_MESSAGE);
					onOpenChange(false);
				},
			},
		),
	);

	return (
		<Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{requester ? "Editar solicitante" : "Novo solicitante"}</DialogTitle>
					<DialogDescription>
						Profissionais cadastrados aqui podem reservar salas e ter ausências registradas.
					</DialogDescription>
				</DialogHeader>

				<form
					id="requester-form"
					noValidate
					className="grid gap-4"
					onSubmit={onSubmit}
					onChange={clearSaveError}
				>
					<FormField label="Nome" required error={errors.nome?.message}>
						<Input placeholder="Nome completo" autoComplete="off" {...register("nome")} />
					</FormField>
					<FormField label="Telefone" error={errors.telefone?.message}>
						<MaskedInput
							mask={maskFlexiblePhone}
							type="tel"
							placeholder="(00) 00000-0000"
							autoComplete="off"
							{...register("telefone")}
						/>
					</FormField>
					<FormField label="Especialidade" required error={errors.especialidade?.message}>
						<Input
							placeholder="Ex.: Cardiologia"
							autoComplete="off"
							{...register("especialidade")}
						/>
					</FormField>
					{save.isError && (
						<FormErrorAlert
							message={getHttpErrorMessage(save.error, REQUESTER_ERROR_MESSAGES.save)}
						/>
					)}
				</form>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={save.isPending}>
							Cancelar
						</Button>
					</DialogClose>
					<Button type="submit" form="requester-form" disabled={save.isPending}>
						{save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
						{save.isPending ? "Salvando…" : "Salvar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
