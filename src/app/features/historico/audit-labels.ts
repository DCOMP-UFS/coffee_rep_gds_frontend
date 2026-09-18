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
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
	section: "Setor",
	room: "Sala",
	requester: "Solicitante",
	absence: "Ausência",
	reservation: "Reserva",
	user: "Usuário",
};

export const AUDIT_ACTION_FILTER_OPTIONS = [
	{ value: "", label: "Todas" },
	...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
		value,
		label,
	})),
];

export const AUDIT_ENTITY_FILTER_OPTIONS = [
	{ value: "", label: "Todas" },
	...Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
		value,
		label,
	})),
];

const DETAIL_LABELS: Record<string, string> = {
	nome: "Nome",
	setorId: "Setor",
	salaId: "Sala",
	sala: "Sala",
	solicitanteId: "Solicitante",
	solicitante: "Solicitante",
	solicitanteNome: "Solicitante",
	horaInicio: "Início",
	horaFim: "Fim",
	dataInicio: "Início",
	dataFim: "Fim",
	recorrente: "Recorrente",
	recorrenciaId: "Série",
	ocorrencias: "Ocorrências",
	reativado: "Reativado",
	email: "E-mail",
	cancelada: "Cancelada",
};

const HIDDEN_DETAIL_KEYS = new Set([
	"backfill",
	"backfillSource",
	"backfillSourceId",
	"actorInferred",
]);

export function auditActionLabel(action: string): string {
	return AUDIT_ACTION_LABELS[action] ?? action;
}

export function auditEntityLabel(
	entityType: string,
	entityId: number | null,
): string {
	const type = AUDIT_ENTITY_LABELS[entityType] ?? entityType;
	return entityId != null ? `${type} #${entityId}` : type;
}

export function isBackfillEvent(details: Record<string, unknown> | null | undefined): boolean {
	return details?.['backfill'] === true;
}

export function formatAuditDetails(
	details: Record<string, unknown> | null | undefined,
): string {
	if (!details) return "";
	const parts: string[] = [];
	for (const [key, value] of Object.entries(details)) {
		if (HIDDEN_DETAIL_KEYS.has(key) || value == null || value === "") {
			continue;
		}
		const label = DETAIL_LABELS[key] ?? key;
		const display =
			typeof value === "boolean" ? (value ? "sim" : "não") : String(value);
		parts.push(`${label}: ${display}`);
	}
	return parts.join(" · ");
}
