import { Clock, type LucideIcon, Repeat, User, UserPen } from "lucide-react";
import { StatusBadge } from "@/components/status/StatusBadge";
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
import { formatIsoDateBr, formatIsoDateTimeBr } from "@/shared/format/br-format";
import { EVENT_KIND_STYLES } from "./constants";
import { type CalendarEvent, EVENT_KIND_LABELS } from "./events";

interface EventDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event?: CalendarEvent;
}

/** Detalhes somente leitura de uma reserva ou ausência do calendário. */
export function EventDetailsDialog({ open, onOpenChange, event }: EventDetailsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				{event && <EventDetails event={event} />}
				<DialogFooter>
					<DialogClose asChild>
						<Button>Fechar</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EventDetails({ event }: { event: CalendarEvent }) {
	const isAbsence = event.type === "absence";

	return (
		<>
			<DialogHeader>
				<DialogTitle>{isAbsence ? "Detalhes da ausência" : "Detalhes da reserva"}</DialogTitle>
				<div className="flex flex-wrap items-center gap-2">
					<DialogDescription className="font-medium text-foreground">
						{isAbsence
							? "Ausência / férias"
							: `${event.reservation.sala} - ${event.reservation.setor}`}
					</DialogDescription>
					<StatusBadge
						tone={EVENT_KIND_STYLES[event.kind].tone}
						icon={event.kind === "recorrente" ? Repeat : undefined}
					>
						{EVENT_KIND_LABELS[event.kind]}
					</StatusBadge>
				</div>
			</DialogHeader>

			<dl className="grid gap-3">
				{isAbsence ? (
					<>
						<DetailRow icon={User} label="Solicitante" value={event.absence.solicitanteNome} />
						<DetailRow
							icon={Clock}
							label="Período"
							value={`${formatIsoDateBr(event.absence.dataInicio)} – ${formatIsoDateBr(event.absence.dataFim)}`}
						/>
					</>
				) : (
					<>
						<DetailRow icon={User} label="Solicitante" value={event.reservation.solicitante} />
						<DetailRow icon={UserPen} label="Criado por" value={event.reservation.criador || "—"} />
						<DetailRow
							icon={Clock}
							label="Horário"
							value={`${formatIsoDateTimeBr(event.reservation.horaInicio)} – ${formatIsoDateTimeBr(event.reservation.horaFim)}`}
						/>
					</>
				)}
			</dl>
		</>
	);
}

function DetailRow({
	icon: Icon,
	label,
	value,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-start gap-3">
			<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<div className="grid gap-0.5">
				<dt className="text-xs text-muted-foreground">{label}</dt>
				<dd className="text-sm font-medium">{value}</dd>
			</div>
		</div>
	);
}
