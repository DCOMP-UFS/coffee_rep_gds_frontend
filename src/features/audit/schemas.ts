import { z } from "zod";
import { brDateToIsoDate, validateBrDate } from "@/shared/validators/date";
import { optionalBrDateSchema } from "@/shared/validators/schemas";
import type { AuditFilters } from "./types";

export const CREATED_TO_BEFORE_FROM_MESSAGE =
	"A data final deve ser igual ou posterior à data inicial.";

const isFilledValidDate = (value: string) => value.trim() !== "" && validateBrDate(value) === null;

export const auditFiltersFormSchema = z
	.object({
		q: z.string().trim(),
		action: z.string(),
		entityType: z.string(),
		createdFrom: optionalBrDateSchema(),
		createdTo: optionalBrDateSchema(),
	})
	.superRefine(({ createdFrom, createdTo }, ctx) => {
		if (!isFilledValidDate(createdFrom) || !isFilledValidDate(createdTo)) return;
		if (brDateToIsoDate(createdFrom) > brDateToIsoDate(createdTo)) {
			ctx.addIssue({
				code: "custom",
				path: ["createdTo"],
				message: CREATED_TO_BEFORE_FROM_MESSAGE,
			});
		}
	});

export type AuditFiltersFormInput = z.input<typeof auditFiltersFormSchema>;
export type AuditFiltersFormValues = z.output<typeof auditFiltersFormSchema>;

export const EMPTY_AUDIT_FILTERS_FORM: AuditFiltersFormInput = {
	q: "",
	action: "",
	entityType: "",
	createdFrom: "",
	createdTo: "",
};

/** Datas digitadas em `DD/MM/AAAA` viram `AAAA-MM-DD`, formato do backend. */
export function toAuditFilters(values: AuditFiltersFormValues): AuditFilters {
	return {
		q: values.q,
		action: values.action,
		entityType: values.entityType,
		createdFrom: values.createdFrom ? brDateToIsoDate(values.createdFrom) : "",
		createdTo: values.createdTo ? brDateToIsoDate(values.createdTo) : "",
	};
}
