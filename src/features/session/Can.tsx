import type { ReactNode } from "react";
import { usePermission } from "./hooks";
import type { Permission } from "./types";

interface CanProps {
	permission: Permission;
	children: ReactNode;
	/** Exibido no lugar de `children` quando falta a permissão. */
	fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
	return usePermission(permission) ? children : fallback;
}
