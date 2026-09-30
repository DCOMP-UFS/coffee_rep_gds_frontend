import { StatusBadge } from "@/components/status/StatusBadge";
import { ROLE_REQUEST_STATUS_STYLES } from "./labels";
import type { RoleRequestStatus } from "./types";

export function RoleRequestStatusBadge({ status }: { status: RoleRequestStatus }) {
	const { label, tone, icon } = ROLE_REQUEST_STATUS_STYLES[status];
	return (
		<StatusBadge tone={tone} icon={icon}>
			{label}
		</StatusBadge>
	);
}
