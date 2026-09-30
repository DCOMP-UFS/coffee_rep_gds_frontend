import { Ban, CircleCheck, Clock, type LucideIcon, XCircle } from "lucide-react";
import type { FilterOption } from "@/components/filters/FilterSelect";
import type { StatusTone } from "@/components/status/StatusBadge";
import type { RoleRequestStatus } from "./types";

interface StatusStyle {
	label: string;
	tone: StatusTone;
	icon: LucideIcon;
}

export const ROLE_REQUEST_STATUS_STYLES: Record<RoleRequestStatus, StatusStyle> = {
	PENDING: { label: "Pendente", tone: "warning", icon: Clock },
	APPROVED: { label: "Aprovado", tone: "success", icon: CircleCheck },
	REJECTED: { label: "Recusado", tone: "danger", icon: XCircle },
	CANCELLED: { label: "Cancelado", tone: "neutral", icon: Ban },
};

export const ROLE_REQUEST_STATUS_OPTIONS: FilterOption<RoleRequestStatus>[] = (
	Object.keys(ROLE_REQUEST_STATUS_STYLES) as RoleRequestStatus[]
).map((status) => ({ value: status, label: ROLE_REQUEST_STATUS_STYLES[status].label }));
