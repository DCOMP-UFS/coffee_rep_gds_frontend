import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { FieldsetField } from "@/components/form/FieldsetField";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";
import { RESERVATION_ERROR_MESSAGES, useCancelReservation } from "./hooks";
import type { CancelScope, Reservation } from "./types";

export const RESERVATION_CANCELLED_MESSAGE = "Reserva cancelada.";
export const SERIES_CANCELLED_MESSAGE = "Série cancelada.";

const SCOPE_OPTIONS: { value: CancelScope; label: string }[] = [
	{ value: "one", label: "Só esta reserva" },
	{ value: "series", label: "Toda a série (inclusive datas que já passaram)" },
];

interface CancelReservationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Mantida após fechar, para o texto não mudar durante a animação de saída. */
	reservation?: Reservation;
}

/** Confirma o cancelamento; numa reserva recorrente, pergunta se vale só para ela ou para a série. */
export function CancelReservationDialog({
	open,
	onOpenChange,
	reservation,
}: CancelReservationDialogProps) {
	const cancel = useCancelReservation();
	const [scope, setScope] = useState<CancelScope>("one");
	const recurring = Boolean(reservation?.recorrenciaId);

	const resetCancel = cancel.reset;
	useEffect(() => {
		if (!open) return;
		setScope("one");
		resetCancel();
	}, [open, resetCancel]);

	const confirm = () => {
		if (!reservation) return;
		const effectiveScope = recurring ? scope : "one";
		cancel.mutate(
			{
				reservationId: reservation.reservationId,
				recorrenciaId: reservation.recorrenciaId,
				scope: effectiveScope,
			},
			{
				onSuccess: () => {
					toast.success(
						effectiveScope === "series" ? SERIES_CANCELLED_MESSAGE : RESERVATION_CANCELLED_MESSAGE,
					);
					onOpenChange(false);
				},
			},
		);
	};

	const description = reservation
		? `${reservation.sala} para ${reservation.solicitante}, de ${formatIsoDateTimeBr(reservation.horaInicio)} a ${formatIsoDateTimeBr(reservation.horaFim)}. Essa ação será irreversível.`
		: undefined;

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Cancelar a reserva?"
			description={description}
			confirmLabel={recurring && scope === "series" ? "Cancelar a série" : "Cancelar reserva"}
			cancelLabel="Voltar"
			isPending={cancel.isPending}
			error={
				cancel.isError
					? getHttpErrorMessage(cancel.error, RESERVATION_ERROR_MESSAGES.cancel)
					: undefined
			}
			onConfirm={confirm}
		>
			{recurring && (
				<FieldsetField legend="Esta reserva faz parte de uma série. O que deseja cancelar?">
					<RadioGroup
						value={scope}
						onValueChange={(value) => {
							if (cancel.isError) cancel.reset();
							setScope(value as CancelScope);
						}}
						disabled={cancel.isPending}
					>
						{SCOPE_OPTIONS.map((option) => (
							<div key={option.value} className="flex items-center gap-2">
								<RadioGroupItem value={option.value} id={`cancel-scope-${option.value}`} />
								<Label htmlFor={`cancel-scope-${option.value}`} className="font-normal">
									{option.label}
								</Label>
							</div>
						))}
					</RadioGroup>
				</FieldsetField>
			)}
		</ConfirmDialog>
	);
}
