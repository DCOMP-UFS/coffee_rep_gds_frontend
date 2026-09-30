import { roleLabel } from "@/features/session/roles";
import { formatIsoDateBr, formatIsoDateTimeBr } from "@/shared/format/br-format";

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
	role: "Perfil",
	usuario: "Usuário",
	perfilAnterior: "Perfil anterior",
	perfilNovo: "Novo perfil",
	perfilAtual: "Perfil atual",
	perfilPedido: "Perfil pedido",
	motivo: "Motivo",
};

/** Chaves cujo valor é um código de perfil. */
const ROLE_KEYS = new Set(["role", "perfilAnterior", "perfilNovo", "perfilAtual", "perfilPedido"]);

/** Chaves de controle da importação, sem significado para quem lê o histórico. */
const HIDDEN_KEYS = new Set(["backfill", "backfillSource", "backfillSourceId", "actorInferred"]);

/** Chaves com o número do registro; quando o nome também veio, o número é omitido. */
const ID_KEYS: Record<string, readonly string[]> = {
	setorId: [],
	salaId: ["sala"],
	solicitanteId: ["solicitante", "solicitanteNome"],
	recorrenciaId: [],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/** As chaves vêm do backend; `Object.hasOwn` evita casar com `constructor`, `toString` etc. */
const lookup = <T>(record: Record<string, T>, key: string): T | undefined =>
	Object.hasOwn(record, key) ? record[key] : undefined;

function formatValue(key: string, value: unknown): string {
	if (typeof value === "boolean") return value ? "sim" : "não";
	if (Object.hasOwn(ID_KEYS, key)) return `#${String(value)}`;
	if (typeof value !== "string") {
		return typeof value === "object" ? JSON.stringify(value) : String(value);
	}
	if (ROLE_KEYS.has(key)) return roleLabel(value);
	if (ISO_DATE.test(value)) return formatIsoDateBr(value);
	if (ISO_DATE_TIME.test(value)) return formatIsoDateTimeBr(value);
	return value;
}

function isRedundantId(key: string, details: Record<string, unknown>): boolean {
	const nameKeys = lookup(ID_KEYS, key) ?? [];
	return nameKeys.some((nameKey) => details[nameKey] !== null && details[nameKey] !== undefined);
}

/** Resumo legível dos detalhes do evento, no formato `Rótulo: valor · Rótulo: valor`. */
export function formatAuditDetails(details: Record<string, unknown> | null | undefined): string {
	if (!details) return "";

	return Object.entries(details)
		.filter(
			([key, value]) =>
				!HIDDEN_KEYS.has(key) &&
				value !== null &&
				value !== undefined &&
				value !== "" &&
				!isRedundantId(key, details),
		)
		.map(([key, value]) => `${lookup(DETAIL_LABELS, key) ?? key}: ${formatValue(key, value)}`)
		.join(" · ");
}
