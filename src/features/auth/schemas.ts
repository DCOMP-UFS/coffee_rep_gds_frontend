import { z } from "zod";
import { onlyDigits } from "@/shared/format/br-format";
import { brDateToIsoDate } from "@/shared/validators/date";
import { brDateSchema, cpfSchema, requiredText } from "@/shared/validators/schemas";
import type { LoginRequest, SignUpRequest } from "./api";

/** A senha nunca é aparada: é enviada exatamente como digitada, como no Angular. */
const passwordSchema = z.string().min(1, "Informe a senha.");

export const loginSchema = z.object({
	cpf: cpfSchema,
	password: passwordSchema,
});

export type LoginFormInput = z.input<typeof loginSchema>;
export type LoginFormValues = z.output<typeof loginSchema>;

export const toLoginRequest = (values: LoginFormValues): LoginRequest => ({
	cpf: values.cpf,
	password: values.password,
});

/** O `ngx-mask` do Angular só considerava o telefone válido com a máscara completa. */
const PHONE_DIGITS = 11;

export const signUpSchema = z.object({
	name: requiredText("Informe o nome."),
	phone: z
		.string()
		.transform(onlyDigits)
		.refine((digits) => digits.length === PHONE_DIGITS, "Informe o telefone."),
	email: z.email("E-mail inválido."),
	cpf: cpfSchema,
	birthDate: brDateSchema("a data", { allowFuture: false }),
	password: passwordSchema,
});

export type SignUpFormInput = z.input<typeof signUpSchema>;
export type SignUpFormValues = z.output<typeof signUpSchema>;

export function toSignUpRequest(values: SignUpFormValues): SignUpRequest {
	return {
		name: values.name,
		phone: values.phone,
		password: values.password,
		email: values.email,
		cpf: values.cpf,
		birthDate: brDateToIsoDate(values.birthDate),
	};
}
