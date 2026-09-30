import type { RoleRequestListParams } from "./types";

export const roleRequestKeys = {
	all: ["role-requests"] as const,
	mine: () => [...roleRequestKeys.all, "mine"] as const,
	lists: () => [...roleRequestKeys.all, "list"] as const,
	list: (params: RoleRequestListParams) => [...roleRequestKeys.lists(), params] as const,
	summary: () => [...roleRequestKeys.all, "summary"] as const,
};

export const userKeys = {
	all: ["users"] as const,
};
