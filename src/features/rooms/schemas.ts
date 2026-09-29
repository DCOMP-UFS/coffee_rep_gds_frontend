import { z } from "zod";
import { requiredText } from "@/shared/validators/schemas";
import type { Room, RoomWriteDto } from "./types";

const SECTION_REQUIRED_MESSAGE = "Selecione o setor.";

export const roomFormSchema = z.object({
	nome: requiredText("Informe o nome da sala."),
	/** Sem setor escolhido o campo fica `null`, e a validação pede a seleção. */
	setorId: z
		.number()
		.nullable()
		.transform((id, ctx) => {
			if (id === null || id <= 0) {
				ctx.addIssue({ code: "custom", message: SECTION_REQUIRED_MESSAGE });
				return z.NEVER;
			}
			return id;
		}),
});

export type RoomFormInput = z.input<typeof roomFormSchema>;
export type RoomFormValues = z.output<typeof roomFormSchema>;

export const toRoomFormInput = (room?: Room): RoomFormInput => ({
	nome: room?.nome ?? "",
	setorId: room?.setorId ?? null,
});

export const toRoomWriteDto = (values: RoomFormValues): RoomWriteDto => ({
	nome: values.nome,
	setorId: values.setorId,
});
