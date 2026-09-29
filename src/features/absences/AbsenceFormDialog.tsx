import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { SearchableSelect, type SelectOption } from "@/components/form/SearchableSelect";
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
import { requesterOptionLabel } from "@/features/requesters/format";
import type { Requester } from "@/features/requesters/types";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { maskDate } from "@/shared/format/masks";
import { ABSENCE_ERROR_MESSAGES, useSaveAbsence } from "./hooks";
import {
	type AbsenceFormInput,
	type AbsenceFormValues,
	absenceFormSchema,
	toAbsenceFormInput,
	toAbsenceWriteDto,
} from "./schemas";
import type { Absence } from "./types";

export const ABSENCE_SAVED_MESSAGE = "Ausência salva com sucesso.";
export const REQUESTERS_LOAD_ERROR_MESSAGE = "Não foi possível carregar os profissionais.";

/**
 * Profissionais ativos como opções. Na edição, um profissional que deixou de estar ativo entra
 * com o nome gravado na ausência, para o campo não aparecer vazio.
 */
function buildRequesterOptions(requesters: Requester[], absence?: Absence): SelectOption<number>[] {
	const options = requesters.map((requester) => ({
		value: requester.id,
		label: requesterOptionLabel(requester),
	}));
	if (absence && !requesters.some((requester) => requester.id === absence.solicitanteId)) {
		options.unshift({ value: absence.solicitanteId, label: absence.solicitanteNome });
	}
	return options;
}

interface AbsenceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Ausência em edição; ausente para cadastrar uma nova. */
	absence?: Absence;
	requesters: Requester[];
	requestersLoading: boolean;
	requestersError: boolean;
	onRetryRequesters: () => void;
	isRetryingRequesters: boolean;
}

export function AbsenceFormDialog({
	open,
	onOpenChange,
	absence,
	requesters,
	requestersLoading,
	requestersError,
	onRetryRequesters,
	isRetryingRequesters,
}: AbsenceFormDialogProps) {
	const save = useSaveAbsence();
	const options = useMemo(() => buildRequesterOptions(requesters, absence), [requesters, absence]);
	const hasOptions = options.length > 0;
	const requestersUnavailable = requestersError && requesters.length === 0;

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AbsenceFormInput, unknown, AbsenceFormValues>({
		resolver: zodResolver(absenceFormSchema),
		mode: "onTouched",
		defaultValues: toAbsenceFormInput(absence),
	});

	const resetSave = save.reset;
	useEffect(() => {
		if (!open) return;
		reset(toAbsenceFormInput(absence));
		resetSave();
	}, [open, absence, reset, resetSave]);

	const clearSaveError = () => {
		if (save.isError) save.reset();
	};

	const onSubmit = handleSubmit((values) =>
		save.mutate(
			{ id: absence?.id, body: toAbsenceWriteDto(values) },
			{
				onSuccess: () => {
					toast.success(ABSENCE_SAVED_MESSAGE);
					onOpenChange(false);
				},
			},
		),
	);

	return (
		<Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{absence ? "Editar ausência" : "Nova ausência"}</DialogTitle>
					<DialogDescription>
						No período informado, as salas reservadas pelo profissional aparecem como livres.
					</DialogDescription>
				</DialogHeader>

				{requestersUnavailable && (
					<FormErrorAlert
						message={REQUESTERS_LOAD_ERROR_MESSAGE}
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={onRetryRequesters}
								disabled={isRetryingRequesters}
							>
								{isRetryingRequesters && <Loader2 className="animate-spin" aria-hidden="true" />}
								Tentar novamente
							</Button>
						}
					/>
				)}

				{!requestersLoading && !requestersError && !hasOptions && (
					<div className="flex gap-3 rounded-lg border border-warning/20 bg-warning-soft p-3 text-sm text-warning">
						<Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<p>
							Cadastre um solicitante antes de registrar ausências.{" "}
							<Link to="/requester" className="font-semibold underline">
								Ir para Solicitantes
							</Link>
						</p>
					</div>
				)}

				<form
					id="absence-form"
					noValidate
					className="grid gap-4 sm:grid-cols-2"
					onSubmit={onSubmit}
					onChange={clearSaveError}
				>
					<Controller
						control={control}
						name="solicitanteId"
						render={({ field, fieldState }) => (
							<FormField
								label="Profissional"
								required
								error={fieldState.error?.message}
								className="sm:col-span-2"
							>
								<SearchableSelect
									options={options}
									value={field.value}
									onChange={(value) => {
										clearSaveError();
										field.onChange(value);
									}}
									onBlur={field.onBlur}
									placeholder={
										requestersLoading ? "Carregando profissionais..." : "Selecione o profissional"
									}
									searchPlaceholder="Pesquisar profissional..."
									emptyMessage="Nenhum profissional encontrado."
									disabled={!hasOptions}
								/>
							</FormField>
						)}
					/>
					<FormField label="Data de início" required error={errors.dataInicio?.message}>
						<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("dataInicio")} />
					</FormField>
					<FormField label="Data de fim" required error={errors.dataFim?.message}>
						<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("dataFim")} />
					</FormField>
					{save.isError && (
						<FormErrorAlert
							message={getHttpErrorMessage(save.error, ABSENCE_ERROR_MESSAGES.save)}
							className="sm:col-span-2"
						/>
					)}
				</form>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={save.isPending}>
							Cancelar
						</Button>
					</DialogClose>
					<Button type="submit" form="absence-form" disabled={save.isPending || !hasOptions}>
						{save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
						{save.isPending ? "Salvando…" : "Salvar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
