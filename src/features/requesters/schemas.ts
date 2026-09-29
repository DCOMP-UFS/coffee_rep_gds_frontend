import { z } from "zod";
import { onlyDigits } from "@/shared/format/br-format";
import { maskFlexiblePhone } from "@/shared/format/masks";
import { requiredText } from "@/shared/validators/schemas";
import type { Requester, RequesterWriteDto } from "./types";

export const PHONE_MESSAGE = "Informe um telefone com DDD (10 ou 11 dígitos).";

/** Opcional: vazio vira `null`; preenchido, precisa ser fixo (10) ou celular (11) com DDD. */
const optionalPhoneSchema = z
	.string()
	.transform(onlyDigits)
	.refine((digits) => digits.length === 0 || digits.length === 10 || digits.length === 11, {
		message: PHONE_MESSAGE,
	})
	.transform((digits) => digits || null);

export const requesterFormSchema = z.object({
	nome: requiredText("Informe o nome."),
	telefone: optionalPhoneSchema,
	especialidade: requiredText("Informe a especialidade."),
});

export type RequesterFormInput = z.input<typeof requesterFormSchema>;
export type RequesterFormValues = z.output<typeof requesterFormSchema>;

export const toRequesterFormInput = (requester?: Requester): RequesterFormInput => ({
	nome: requester?.nome ?? "",
	telefone: maskFlexiblePhone(requester?.contato ?? ""),
	especialidade: requester?.especialidade ?? "",
});

export const toRequesterWriteDto = (values: RequesterFormValues): RequesterWriteDto => ({
	nome: values.nome,
	telefone: values.telefone,
	especialidade: values.especialidade,
});
