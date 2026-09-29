import { z } from "zod";
import { formatIsoDateBr } from "@/shared/format/br-format";
import { brDateToIsoDate } from "@/shared/validators/date";
import { brDateSchema } from "@/shared/validators/schemas";
import type { Absence, AbsenceWriteDto } from "./types";

export const REQUESTER_REQUIRED_MESSAGE = "Selecione o profissional.";
export const END_BEFORE_START_MESSAGE =
	"A data de fim deve ser igual ou posterior à data de início.";

export const absenceFormSchema = z
	.object({
		/** Sem profissional escolhido o campo fica `null`, e a validação pede a seleção. */
		solicitanteId: z
			.number()
			.nullable()
			.transform((id, ctx) => {
				if (id === null || id <= 0) {
					ctx.addIssue({ code: "custom", message: REQUESTER_REQUIRED_MESSAGE });
					return z.NEVER;
				}
				return id;
			}),
		dataInicio: brDateSchema("a data de início"),
		dataFim: brDateSchema("a data de fim"),
	})
	// Só roda com as duas datas válidas; o erro aparece no campo de fim.
	.superRefine((values, ctx) => {
		if (brDateToIsoDate(values.dataInicio) > brDateToIsoDate(values.dataFim)) {
			ctx.addIssue({ code: "custom", path: ["dataFim"], message: END_BEFORE_START_MESSAGE });
		}
	});

export type AbsenceFormInput = z.input<typeof absenceFormSchema>;
export type AbsenceFormValues = z.output<typeof absenceFormSchema>;

export const toAbsenceFormInput = (absence?: Absence): AbsenceFormInput => ({
	solicitanteId: absence?.solicitanteId ?? null,
	dataInicio: formatIsoDateBr(absence?.dataInicio),
	dataFim: formatIsoDateBr(absence?.dataFim),
});

export const toAbsenceWriteDto = (values: AbsenceFormValues): AbsenceWriteDto => ({
	solicitanteId: values.solicitanteId,
	dataInicio: brDateToIsoDate(values.dataInicio),
	dataFim: brDateToIsoDate(values.dataFim),
});
