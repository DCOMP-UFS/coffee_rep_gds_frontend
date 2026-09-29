import type { AuditEvent } from "./types";

export const AUDIT_ACTION_LABELS: Record<string, string> = {
	"section.create": "Criação de setor",
	"section.update": "Edição de setor",
	"section.delete": "Exclusão de setor",
	"room.create": "Criação de sala",
	"room.update": "Edição de sala",
	"room.delete": "Exclusão de sala",
	"requester.create": "Criação de solicitante",
	"requester.update": "Edição de solicitante",
	"requester.delete": "Exclusão de solicitante",
	"absence.create": "Criação de ausência",
	"absence.update": "Edição de ausência",
	"absence.delete": "Exclusão de ausência",
	"reservation.create": "Criação de reserva",
	"reservation.cancel": "Cancelamento de reserva",
	"reservation.cancel_recurrence": "Cancelamento de série",
	"auth.register": "Cadastro de usuário",
	"auth.login": "Login no sistema",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
	section: "Setor",
	room: "Sala",
	requester: "Solicitante",
	absence: "Ausência",
	reservation: "Reserva",
	user: "Usuário",
};

export interface FilterOption {
	value: string;
	label: string;
}

const toOptions = (labels: Record<string, string>): FilterOption[] =>
	Object.entries(labels).map(([value, label]) => ({ value, label }));

export const AUDIT_ACTION_OPTIONS = toOptions(AUDIT_ACTION_LABELS);
export const AUDIT_ENTITY_OPTIONS = toOptions(AUDIT_ENTITY_LABELS);

/** Códigos desconhecidos aparecem como vieram, para eventos novos não sumirem da tela. */
const labelOrCode = (labels: Record<string, string>, code: string): string =>
	Object.hasOwn(labels, code) ? labels[code] : code;

export function auditActionLabel(action: string): string {
	return labelOrCode(AUDIT_ACTION_LABELS, action);
}

/** A série é identificada pelo `recorrenciaId`, então não é mostrada como uma reserva. */
function isSeriesEvent({ action, details }: AuditEvent): boolean {
	return action === "reservation.cancel_recurrence" || details?.recorrente === true;
}

export function auditEntityLabel(event: AuditEvent): string {
	const { entityType, entityId } = event;
	const hasId = entityId !== null && entityId !== undefined;
	if (hasId && isSeriesEvent(event)) return `Série #${entityId}`;

	const label = labelOrCode(AUDIT_ENTITY_LABELS, entityType);
	return hasId ? `${label} #${entityId}` : label;
}

/** Eventos reconstruídos a partir dos dados anteriores à auditoria. */
export function isImportedEvent({ details }: AuditEvent): boolean {
	return details?.backfill === true;
}
