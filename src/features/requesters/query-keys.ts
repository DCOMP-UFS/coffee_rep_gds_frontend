import type { RequesterListFilters } from "./types";

export const requesterKeys = {
	all: ["requesters"] as const,
	list: (filters: RequesterListFilters) => [...requesterKeys.all, "list", filters] as const,
	/** Lista completa de ativos, usada nos selects. */
	active: () => [...requesterKeys.all, "active"] as const,
};
