import { z } from "zod";
import type { CreateRoleRequestDto } from "@/features/role-requests/types";

/** Mesmos limites do `createRoleRequestSchema` do backend. */
export const JUSTIFICATION_MIN_LENGTH = 10;
export const JUSTIFICATION_MAX_LENGTH = 500;

export const roleRequestFormSchema = z.object({
	requestedRole: z.enum(["ASSISTANT", "COORDINATOR"], { error: "Escolha o perfil desejado." }),
	justification: z
		.string()
		.trim()
		.min(1, "Explique por que você precisa deste acesso.")
		.min(
			JUSTIFICATION_MIN_LENGTH,
			`A justificativa deve ter pelo menos ${JUSTIFICATION_MIN_LENGTH} caracteres.`,
		)
		.max(
			JUSTIFICATION_MAX_LENGTH,
			`A justificativa deve ter no máximo ${JUSTIFICATION_MAX_LENGTH} caracteres.`,
		),
});

export type RoleRequestFormInput = z.input<typeof roleRequestFormSchema>;
export type RoleRequestFormValues = z.output<typeof roleRequestFormSchema>;

export const toCreateRoleRequestDto = (values: RoleRequestFormValues): CreateRoleRequestDto => ({
	requestedRole: values.requestedRole,
	justification: values.justification,
});
