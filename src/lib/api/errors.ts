/**
 * Erro de resposta HTTP não bem-sucedida. Guarda o caminho chamado para que o tratamento
 * global possa reconhecer endpoints com regras próprias, como os de autenticação.
 */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly path: string,
		readonly payload: unknown,
	) {
		super(`Erro ${status} em ${path}`);
		this.name = "ApiError";
	}
}

/*
 * A partir daqui, porte fiel de `http-error-message.util.ts` do frontend Angular: decide se a
 * mensagem do backend pode ser mostrada ao usuário ou se é técnica demais e cai no fallback.
 */

const TECHNICAL_MESSAGE_PATTERN = /^\d{3}\s+[A-Z_]+$/;

const SENSITIVE_FRAGMENTS = [
	"could not execute statement",
	"insert into ",
	"update ",
	"delete from ",
	"duplicate key",
	"unique constraint",
	"violates foreign key",
	"character varying",
	"constraint [",
	"sql [",
	"jdbc",
	"sqlstate",
	"detalhe:",
	"detail:",
];

function collectErrorMessages(error: unknown): string[] {
	if (!(error instanceof ApiError)) return [];

	const { payload } = error;
	const messages: string[] = [];

	if (typeof payload === "string") {
		messages.push(payload);
	} else if (payload && typeof payload === "object") {
		const { message, error: errorField } = payload as { message?: unknown; error?: unknown };
		if (typeof message === "string") messages.push(message);
		if (typeof errorField === "string") messages.push(errorField);
	}

	return messages.map((message) => message.trim()).filter(Boolean);
}

function isTechnicalHttpMessage(message: string): boolean {
	return TECHNICAL_MESSAGE_PATTERN.test(message);
}

function isSensitiveTechnicalMessage(message: string): boolean {
	const normalized = message.toLowerCase();
	return SENSITIVE_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function mapKnownPersistenceConflict(message: string): string | null {
	const normalized = message.toLowerCase();

	if (normalized.includes("unique_email") || normalized.includes("(email)=")) {
		return "Este e-mail já está cadastrado.";
	}

	if (normalized.includes("unique_cpf") || normalized.includes("(cpf)=")) {
		return "Este CPF já está cadastrado.";
	}

	if (normalized.includes("value too long") && normalized.includes("cpf")) {
		return "Informe um CPF válido (11 dígitos).";
	}

	return null;
}

/*
 * Textos de sistema em inglês que podem chegar numa resposta de erro. O usuário só vê
 * português: nesses casos vale o fallback da operação.
 */

/** O campo `error` do backend é sempre uma destas, em inglês. */
const HTTP_REASON_PHRASES = new Set(
	[
		"Bad Request",
		"Unauthorized",
		"Payment Required",
		"Forbidden",
		"Not Found",
		"Method Not Allowed",
		"Not Acceptable",
		"Request Timeout",
		"Conflict",
		"Gone",
		"Payload Too Large",
		"Content Too Large",
		"Unsupported Media Type",
		"Unprocessable Entity",
		"Unprocessable Content",
		"Too Many Requests",
		"Internal Server Error",
		"Not Implemented",
		"Bad Gateway",
		"Service Unavailable",
		"Gateway Timeout",
	].map((phrase) => phrase.toLowerCase()),
);

const ENGLISH_SYSTEM_MESSAGE_PATTERNS = [
	/^access denied\.?$/i,
	/** Rota inexistente no NestJS. */
	/^cannot (get|post|put|patch|delete|head|options) /i,
	/** Corpo JSON malformado. */
	/unexpected token|is not valid json|in json at position/i,
	/request entity too large/i,
	/** Páginas de erro da Vercel (timeout, deploy indisponível). */
	/function_invocation|deployment_not_found|an error occurred with your deployment/i,
	/** Resposta em HTML, de proxy ou gateway. */
	/^\s*</,
];

function isEnglishSystemMessage(message: string): boolean {
	return (
		HTTP_REASON_PHRASES.has(message.toLowerCase()) ||
		ENGLISH_SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
	);
}

function isUserFacingMessage(message: string): boolean {
	return (
		!isTechnicalHttpMessage(message) &&
		!isSensitiveTechnicalMessage(message) &&
		!isEnglishSystemMessage(message)
	);
}

export const PERMISSION_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";

/** Mensagem do backend quando apresentável; do contrário, o fallback informado. */
export function getHttpErrorMessage(error: unknown, fallback: string): string {
	for (const message of collectErrorMessages(error)) {
		const mappedConflict = mapKnownPersistenceConflict(message);
		if (mappedConflict) return mappedConflict;
		if (isUserFacingMessage(message)) return message;
	}

	if (error instanceof ApiError && error.status === 403) return PERMISSION_DENIED_MESSAGE;

	return fallback;
}

export const SIGN_UP_ERROR_FALLBACK = "Não foi possível concluir o cadastro. Verifique os dados.";

export function getSignUpErrorMessage(error: unknown): string {
	for (const message of collectErrorMessages(error)) {
		if (message.includes("422") && message.includes("UNPROCESSABLE")) {
			return "Este CPF já está cadastrado.";
		}
	}

	return getHttpErrorMessage(error, SIGN_UP_ERROR_FALLBACK);
}
