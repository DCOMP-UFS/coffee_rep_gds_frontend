import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FormErrorAlert } from "@/components/feedback/FormErrorAlert";
import { LoadErrorAlert } from "@/components/feedback/LoadErrorAlert";
import { FieldsetField } from "@/components/form/FieldsetField";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { requesterOptionLabel } from "@/features/requesters/format";
import { useAllRequesters } from "@/features/requesters/hooks";
import { useSectionRooms } from "@/features/rooms/hooks";
import { roomsBySectionPath } from "@/features/rooms/search-params";
import { useSections } from "@/features/sections/hooks";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { maskDate, maskTime } from "@/shared/format/masks";
import { RESERVATION_ERROR_MESSAGES, useCreateReservation } from "./hooks";
import {
	emptyReservationForm,
	type ReservationFormInput,
	type ReservationFormValues,
	type ReservationType,
	reservationFormSchema,
	toReservationWriteDto,
	WEEKDAYS,
} from "./schemas";

export const RESERVATION_CREATED_MESSAGE = "Reserva criada com sucesso.";
export const RESERVATION_LOAD_ERRORS = {
	sections: "Não foi possível carregar os setores.",
	rooms: "Não foi possível carregar as salas deste setor.",
	requesters: "Não foi possível carregar os solicitantes.",
} as const;

const FORM_ID = "reservation-form";

const RESERVATION_TYPES: { value: ReservationType; label: string }[] = [
	{ value: "pontual", label: "Pontual" },
	{ value: "recorrente", label: "Recorrente" },
];

interface ReservationFormDefaults {
	/** Data já preenchida, em `DD/MM/AAAA`. */
	initialDate?: string;
	/** Setor já escolhido; as salas dele carregam ao abrir. */
	initialSectionId?: number | null;
}

interface ReservationFormDialogProps extends ReservationFormDefaults {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Cadastro de reserva; o backend não permite editar uma reserva existente. */
export function ReservationFormDialog({
	open,
	onOpenChange,
	initialDate,
	initialSectionId,
}: ReservationFormDialogProps) {
	const create = useCreateReservation();

	const resetCreate = create.reset;
	useEffect(() => {
		if (open) resetCreate();
	}, [open, resetCreate]);

	return (
		<Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Nova reserva</DialogTitle>
					<DialogDescription>
						Comece pelo setor; as salas dele são carregadas em seguida.
					</DialogDescription>
				</DialogHeader>
				{/* Montado só com o diálogo aberto: as listas carregam ao abrir e o formulário começa limpo. */}
				<ReservationForm
					create={create}
					initialDate={initialDate}
					initialSectionId={initialSectionId}
					onCreated={() => {
						toast.success(RESERVATION_CREATED_MESSAGE);
						onOpenChange(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

interface ReservationFormProps extends ReservationFormDefaults {
	create: ReturnType<typeof useCreateReservation>;
	onCreated: () => void;
}

function ReservationForm({
	create,
	onCreated,
	initialDate,
	initialSectionId,
}: ReservationFormProps) {
	const sections = useSections();
	const requesters = useAllRequesters();

	const {
		control,
		register,
		handleSubmit,
		setValue,
		getValues,
		clearErrors,
		formState: { errors },
	} = useForm<ReservationFormInput, unknown, ReservationFormValues>({
		resolver: zodResolver(reservationFormSchema),
		mode: "onTouched",
		defaultValues: {
			...emptyReservationForm(),
			setorId: initialSectionId ?? null,
			dataInicio: initialDate ?? "",
		},
	});

	const sectionId = useWatch({ control, name: "setorId" });
	const type = useWatch({ control, name: "tipo" });
	const recurring = type === "recorrente";
	const rooms = useSectionRooms(sectionId);

	const sectionOptions = useMemo(
		() => (sections.data ?? []).map((section) => ({ value: section.id, label: section.nome })),
		[sections.data],
	);
	const roomOptions = useMemo(
		() => (rooms.data ?? []).map((room) => ({ value: room.id, label: room.nome })),
		[rooms.data],
	);
	const requesterOptions = useMemo(
		() =>
			(requesters.data ?? []).map((requester) => ({
				value: requester.id,
				label: requesterOptionLabel(requester),
			})),
		[requesters.data],
	);

	const noSections = sections.isSuccess && sectionOptions.length === 0;
	const noRequesters = requesters.isSuccess && requesterOptions.length === 0;
	const noRooms = rooms.isSuccess && roomOptions.length === 0;
	const isPending = create.isPending;

	const clearSaveError = () => {
		if (create.isError) create.reset();
	};

	// O botão só fica desabilitado no próximo render; sem a trava, um clique duplo validaria e
	// enviaria duas vezes, e a segunda reserva voltaria como conflito de horário.
	const submitLock = useRef(false);
	const onSubmit = handleSubmit((values) => {
		if (submitLock.current) return;
		submitLock.current = true;
		create.mutate(toReservationWriteDto(values), {
			onSuccess: onCreated,
			onSettled: () => {
				submitLock.current = false;
			},
		});
	});

	return (
		<>
			{sections.isError && sectionOptions.length === 0 && (
				<LoadErrorAlert
					message={RESERVATION_LOAD_ERRORS.sections}
					onRetry={() => sections.refetch()}
					isRetrying={sections.isFetching}
				/>
			)}
			{requesters.isError && requesterOptions.length === 0 && (
				<LoadErrorAlert
					message={RESERVATION_LOAD_ERRORS.requesters}
					onRetry={() => requesters.refetch()}
					isRetrying={requesters.isFetching}
				/>
			)}
			{noSections && (
				<SetupHint to="/sections" linkLabel="Ir para Setores">
					Cadastre um setor antes de reservar salas.
				</SetupHint>
			)}
			{noRequesters && (
				<SetupHint to="/requester" linkLabel="Ir para Solicitantes">
					Cadastre um solicitante antes de reservar salas.
				</SetupHint>
			)}

			<form
				id={FORM_ID}
				noValidate
				className="grid gap-4 sm:grid-cols-2"
				onSubmit={onSubmit}
				onChange={clearSaveError}
			>
				<Controller
					control={control}
					name="setorId"
					render={({ field, fieldState }) => (
						<FormField
							label="Setor"
							required
							error={fieldState.error?.message}
							className="sm:col-span-2"
						>
							<SearchableSelect
								options={sectionOptions}
								value={field.value}
								onChange={(value) => {
									clearSaveError();
									if (value !== field.value) setValue("salaId", null);
									field.onChange(value);
								}}
								onBlur={field.onBlur}
								placeholder={sections.isPending ? "Carregando setores..." : "Selecione o setor"}
								searchPlaceholder="Pesquisar setor..."
								emptyMessage="Nenhum setor encontrado."
								disabled={sectionOptions.length === 0}
							/>
						</FormField>
					)}
				/>

				<Controller
					control={control}
					name="salaId"
					render={({ field, fieldState }) => (
						<FormField
							label="Sala"
							required
							error={fieldState.error?.message}
							className="sm:col-span-2"
						>
							<SearchableSelect
								options={roomOptions}
								value={field.value}
								onChange={(value) => {
									clearSaveError();
									field.onChange(value);
								}}
								onBlur={field.onBlur}
								placeholder={
									sectionId === null
										? "Selecione o setor primeiro"
										: rooms.isPending
											? "Carregando salas..."
											: "Selecione a sala"
								}
								searchPlaceholder="Pesquisar sala..."
								emptyMessage="Nenhuma sala encontrada."
								disabled={roomOptions.length === 0}
							/>
						</FormField>
					)}
				/>
				{sectionId !== null && rooms.isError && (
					<LoadErrorAlert
						message={RESERVATION_LOAD_ERRORS.rooms}
						onRetry={() => rooms.refetch()}
						isRetrying={rooms.isFetching}
						className="sm:col-span-2"
					/>
				)}
				{sectionId !== null && noRooms && (
					<SetupHint
						to={roomsBySectionPath(sectionId)}
						linkLabel="Ir para Salas"
						className="sm:col-span-2"
					>
						Nenhuma sala neste setor.
					</SetupHint>
				)}

				<Controller
					control={control}
					name="solicitanteId"
					render={({ field, fieldState }) => (
						<FormField
							label="Solicitante"
							required
							error={fieldState.error?.message}
							className="sm:col-span-2"
						>
							<SearchableSelect
								options={requesterOptions}
								value={field.value}
								onChange={(value) => {
									clearSaveError();
									field.onChange(value);
								}}
								onBlur={field.onBlur}
								placeholder={
									requesters.isPending ? "Carregando solicitantes..." : "Selecione o solicitante"
								}
								searchPlaceholder="Pesquisar solicitante..."
								emptyMessage="Nenhum solicitante encontrado."
								disabled={requesterOptions.length === 0}
							/>
						</FormField>
					)}
				/>

				<Controller
					control={control}
					name="tipo"
					render={({ field }) => (
						<FieldsetField legend="Tipo de reserva" className="sm:col-span-2">
							<RadioGroup
								value={field.value}
								onValueChange={(value) => {
									clearSaveError();
									// Os campos de data mudam de rótulo; erros antigos deixariam de fazer sentido.
									clearErrors(["dataInicio", "dataFim", "dias"]);
									field.onChange(value as ReservationType);
								}}
								className="flex flex-wrap gap-6"
							>
								{RESERVATION_TYPES.map((option) => (
									<div key={option.value} className="flex items-center gap-2">
										<RadioGroupItem value={option.value} id={`reservation-type-${option.value}`} />
										<Label htmlFor={`reservation-type-${option.value}`} className="font-normal">
											{option.label}
										</Label>
									</div>
								))}
							</RadioGroup>
						</FieldsetField>
					)}
				/>

				<FormField
					label={recurring ? "Data de início" : "Data da reserva"}
					required
					error={errors.dataInicio?.message}
					className={recurring ? undefined : "sm:col-span-2"}
				>
					<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("dataInicio")} />
				</FormField>
				{recurring && (
					<FormField label="Data de fim" required error={errors.dataFim?.message}>
						<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("dataFim")} />
					</FormField>
				)}

				<FormField label="Horário de início" required error={errors.horaInicio?.message}>
					<MaskedInput
						mask={maskTime}
						placeholder="00:00"
						maxLength={5}
						{...register("horaInicio")}
					/>
				</FormField>
				<FormField label="Horário de fim" required error={errors.horaFim?.message}>
					<MaskedInput mask={maskTime} placeholder="00:00" maxLength={5} {...register("horaFim")} />
				</FormField>

				{recurring && (
					<Controller
						control={control}
						name="dias"
						render={({ field, fieldState }) => (
							<FieldsetField
								legend="Dias da semana"
								required
								error={fieldState.error?.message}
								className="sm:col-span-2"
							>
								<div className="flex flex-wrap gap-x-5 gap-y-3">
									{WEEKDAYS.map((weekday) => {
										const id = `reservation-weekday-${weekday.value}`;
										return (
											<div key={weekday.value} className="flex items-center gap-2">
												<Checkbox
													id={id}
													checked={field.value.includes(weekday.value)}
													onCheckedChange={(checked) => {
														clearSaveError();
														// Lido na hora, e não do render, para dois cliques seguidos não se sobrescreverem.
														const current = getValues("dias");
														field.onChange(
															checked === true
																? [...current, weekday.value]
																: current.filter((day) => day !== weekday.value),
														);
													}}
													onBlur={field.onBlur}
												/>
												<Label htmlFor={id} className="font-normal">
													{weekday.label}
												</Label>
											</div>
										);
									})}
								</div>
							</FieldsetField>
						)}
					/>
				)}

				{create.isError && (
					<FormErrorAlert
						message={getHttpErrorMessage(create.error, RESERVATION_ERROR_MESSAGES.create)}
						className="sm:col-span-2"
					/>
				)}
			</form>

			<DialogFooter>
				<DialogClose asChild>
					<Button variant="outline" disabled={isPending}>
						Cancelar
					</Button>
				</DialogClose>
				<Button type="submit" form={FORM_ID} disabled={isPending || noSections || noRequesters}>
					{isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
					{isPending ? "Salvando…" : "Salvar"}
				</Button>
			</DialogFooter>
		</>
	);
}

interface SetupHintProps {
	to: string;
	linkLabel: string;
	className?: string;
	children: ReactNode;
}

/** Aviso de cadastro que falta, com atalho para a tela onde ele é feito. */
function SetupHint({ to, linkLabel, className, children }: SetupHintProps) {
	return (
		<div
			className={cn(
				"flex gap-3 rounded-lg border border-warning/20 bg-warning-soft p-3 text-sm text-warning",
				className,
			)}
		>
			<Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<p>
				{children}{" "}
				<Link to={to} className="font-semibold underline">
					{linkLabel}
				</Link>
			</p>
		</div>
	);
}
