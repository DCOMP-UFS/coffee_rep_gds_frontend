import { HttpErrorResponse } from "@angular/common/http";

const TECHNICAL_MESSAGE_PATTERN = /^\d{3}\s+[A-Z_]+$/;

function collectErrorMessages(error: HttpErrorResponse): string[] {
	const payload = error.error;
	const messages: string[] = [];

	if (typeof payload === "string") {
		messages.push(payload);
	} else if (payload && typeof payload === "object") {
		if (typeof payload.message === "string") {
			messages.push(payload.message);
		}
		if (typeof payload.error === "string") {
			messages.push(payload.error);
		}
	}

	return messages.map((message) => message.trim()).filter(Boolean);
}

function isTechnicalHttpMessage(message: string): boolean {
	return TECHNICAL_MESSAGE_PATTERN.test(message);
}

function isSensitiveTechnicalMessage(message: string): boolean {
	const normalized = message.toLowerCase();

	return (
		normalized.includes("could not execute statement") ||
		normalized.includes("insert into ") ||
		normalized.includes("update ") ||
		normalized.includes("delete from ") ||
		normalized.includes("duplicate key") ||
		normalized.includes("unique constraint") ||
		normalized.includes("violates foreign key") ||
		normalized.includes("character varying") ||
		normalized.includes("constraint [") ||
		normalized.includes("sql [") ||
		normalized.includes("jdbc") ||
		normalized.includes("sqlstate") ||
		normalized.includes("detalhe:") ||
		normalized.includes("detail:")
	);
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

function isUserFacingMessage(message: string): boolean {
	return (
		!isTechnicalHttpMessage(message) && !isSensitiveTechnicalMessage(message)
	);
}

export function getHttpErrorMessage(
	error: HttpErrorResponse,
	fallback: string,
): string {
	for (const message of collectErrorMessages(error)) {
		const mappedConflict = mapKnownPersistenceConflict(message);
		if (mappedConflict) {
			return mappedConflict;
		}

		if (isUserFacingMessage(message)) {
			return message;
		}
	}

	return fallback;
}

export function getSignUpErrorMessage(error: HttpErrorResponse): string {
	const fallback = "Não foi possível concluir o cadastro. Verifique os dados.";

	for (const message of collectErrorMessages(error)) {
		if (message.includes("422") && message.includes("UNPROCESSABLE")) {
			return "Este CPF já está cadastrado.";
		}
	}

	return getHttpErrorMessage(error, fallback);
}
