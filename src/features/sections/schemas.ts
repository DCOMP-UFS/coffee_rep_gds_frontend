import { z } from "zod";
import { requiredText } from "@/shared/validators/schemas";
import type { Section, SectionWriteDto } from "./types";

export const sectionFormSchema = z.object({
	nome: requiredText("Informe o nome."),
	observacao: z.string(),
});

export type SectionFormInput = z.input<typeof sectionFormSchema>;
export type SectionFormValues = z.output<typeof sectionFormSchema>;

export const toSectionFormInput = (section?: Section): SectionFormInput => ({
	nome: section?.nome ?? "",
	observacao: section?.observacoes ?? "",
});

/** Observação vazia vai como `null`, como no diálogo do Angular. */
export const toSectionWriteDto = (values: SectionFormValues): SectionWriteDto => ({
	nome: values.nome,
	observacao: values.observacao.trim() || null,
});
