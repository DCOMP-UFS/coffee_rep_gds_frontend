import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FormField } from "@/components/form/FormField";
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
import { Textarea } from "@/components/ui/textarea";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { SECTION_ERROR_MESSAGES, useSaveSection } from "./hooks";
import {
	type SectionFormInput,
	type SectionFormValues,
	sectionFormSchema,
	toSectionFormInput,
	toSectionWriteDto,
} from "./schemas";
import type { Section } from "./types";

export const SECTION_SAVED_MESSAGE = "Setor salvo com sucesso.";

interface SectionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Setor em edição; ausente para criar um novo. */
	section?: Section;
}

export function SectionFormDialog({ open, onOpenChange, section }: SectionFormDialogProps) {
	const save = useSaveSection();
	const isEditing = section !== undefined;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<SectionFormInput, unknown, SectionFormValues>({
		resolver: zodResolver(sectionFormSchema),
		mode: "onTouched",
		defaultValues: toSectionFormInput(section),
	});

	const resetSave = save.reset;
	useEffect(() => {
		if (!open) return;
		reset(toSectionFormInput(section));
		resetSave();
	}, [open, section, reset, resetSave]);

	const clearSaveError = () => {
		if (save.isError) save.reset();
	};

	const onSubmit = handleSubmit((values) =>
		save.mutate(
			{ id: section?.id, body: toSectionWriteDto(values) },
			{
				onSuccess: () => {
					toast.success(SECTION_SAVED_MESSAGE);
					onOpenChange(false);
				},
			},
		),
	);

	return (
		<Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Editar setor" : "Novo setor"}</DialogTitle>
					<DialogDescription>
						Setores agrupam as salas e aparecem nos filtros do sistema.
					</DialogDescription>
				</DialogHeader>

				<form
					id="section-form"
					noValidate
					className="grid gap-4"
					onSubmit={onSubmit}
					onChange={clearSaveError}
				>
					<FormField label="Nome do setor" required error={errors.nome?.message}>
						<Input placeholder="Ex.: Clínica Médica" autoComplete="off" {...register("nome")} />
					</FormField>
					<FormField label="Observação">
						<Textarea
							rows={3}
							placeholder="Ex.: Atendimento no 2º andar, ala B"
							{...register("observacao")}
						/>
					</FormField>
					{save.isError && (
						<FormErrorAlert
							message={getHttpErrorMessage(save.error, SECTION_ERROR_MESSAGES.save)}
						/>
					)}
				</form>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={save.isPending}>
							Cancelar
						</Button>
					</DialogClose>
					<Button type="submit" form="section-form" disabled={save.isPending}>
						{save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
