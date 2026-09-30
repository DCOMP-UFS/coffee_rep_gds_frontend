import { useMemo } from "react";
import type { ActionLock } from "@/components/actions/action-lock";
import { lockedReason, PERMISSION_REQUIREMENTS } from "../access";
import { usePermission } from "../hooks";
import type { Permission } from "../types";
import { useExplainAccess } from "./context";

export interface Access {
	allowed: boolean;
	/** Presente só sem permissão: repasse às ações para que apareçam bloqueadas. */
	lock?: ActionLock;
}

/**
 * Chame uma vez por tela e repasse `lock` às ações. `feature` descreve a funcionalidade com
 * verbo no infinitivo, ex.: "Cadastrar e alterar setores".
 */
export function useAccess(permission: Permission, feature: string): Access {
	const allowed = usePermission(permission);
	const explain = useExplainAccess();

	return useMemo(
		() =>
			allowed
				? { allowed }
				: {
						allowed,
						lock: {
							reason: lockedReason(PERMISSION_REQUIREMENTS[permission]),
							explain: () => explain(permission, feature),
						},
					},
		[allowed, explain, permission, feature],
	);
}
