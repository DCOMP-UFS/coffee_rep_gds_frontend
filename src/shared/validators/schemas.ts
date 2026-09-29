import { z } from "zod";
import { onlyDigits } from "@/shared/format/br-format";
import { validateBrDate } from "./date";
import { isValidTime } from "./time";

/**
 * Blocos de esquema Zod reutilizados pelos formulários, com as mesmas mensagens do
 * frontend Angular.
 */

/** Texto obrigatório; o valor validado já sai aparado. */
export const requiredText = (message: string) => z.string().trim().min(1, message);

export const CPF_MESSAGE = "Informe um CPF válido (11 dígitos).";

/** CPF digitado com ou sem máscara; o valor validado sai só com dígitos. */
export const cpfSchema = z
	.string()
	.transform(onlyDigits)
	.refine((digits) => digits.length === 11, CPF_MESSAGE);

interface BrDateOptions {
	allowFuture?: boolean;
}

const addBrDateIssues =
	(options: BrDateOptions) =>
	(value: string, ctx: z.RefinementCtx): void => {
		const error = validateBrDate(value, options);
		if (error === "dateMask") {
			ctx.addIssue({ code: "custom", message: "Informe a data no formato DD/MM/AAAA." });
		} else if (error === "dateInvalid") {
			ctx.addIssue({ code: "custom", message: "Data inválida." });
		}
	};

/** Data `DD/MM/AAAA` obrigatória, com as mensagens do campo mascarado do Angular. */
export const brDateSchema = (label: string, options: BrDateOptions = {}) =>
	z.string().trim().min(1, `Informe ${label}.`).superRefine(addBrDateIssues(options));

/** Data `DD/MM/AAAA` opcional: vazia é aceita; preenchida, precisa ser válida. */
export const optionalBrDateSchema = (options: BrDateOptions = {}) =>
	z.string().trim().superRefine(addBrDateIssues(options));

export const TIME_FORMAT_MESSAGE = "Informe o horário no formato HH:MM.";

/** Horário `HH:MM` obrigatório, com as mensagens do campo de horário do Angular. */
export const timeSchema = (requiredMessage: string) =>
	z
		.string()
		.trim()
		.min(1, requiredMessage)
		.refine((value) => value === "" || isValidTime(value), TIME_FORMAT_MESSAGE);
