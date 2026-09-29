import type { AuditListParams } from "./types";

export const auditKeys = {
	all: ["audit"] as const,
	list: (params: AuditListParams) => [...auditKeys.all, "list", params] as const,
};
