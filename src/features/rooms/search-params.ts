import { ALL_SECTIONS } from "./types";

/** Parâmetro da URL de Salas com o setor filtrado, ex.: `/rooms?setor=4`. */
export const ROOM_SECTION_PARAM = "setor";

/** Aceita só um id inteiro positivo; qualquer outro valor significa "Todas". */
export function parseSectionParam(value: string | null): number {
	if (!value || !/^\d+$/.test(value)) return ALL_SECTIONS;
	const id = Number(value);
	return id > 0 ? id : ALL_SECTIONS;
}

export const roomsBySectionPath = (sectionId: number) =>
	`/rooms?${ROOM_SECTION_PARAM}=${sectionId}`;
