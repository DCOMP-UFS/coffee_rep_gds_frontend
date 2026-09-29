import type { RoomListFilters } from "./types";

export const roomKeys = {
	all: ["rooms"] as const,
	list: (filters: RoomListFilters) => [...roomKeys.all, "list", filters] as const,
	count: (ocupada: boolean | null) => [...roomKeys.all, "count", ocupada] as const,
	bySection: (sectionId: number) => [...roomKeys.all, "by-section", sectionId] as const,
	/** Fora de `all`: é consultada de novo sempre que usada, então dispensa invalidação. */
	sectionCount: (sectionId: number) => ["rooms-section-count", sectionId] as const,
};
