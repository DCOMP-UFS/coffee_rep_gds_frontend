import { createContext, useContext } from "react";
import type { Permission } from "../types";

/** Abre a explicação de uma funcionalidade que o perfil não pode usar. */
export type ExplainAccess = (permission: Permission, feature: string) => void;

export const AccessDialogContext = createContext<ExplainAccess | null>(null);

export function useExplainAccess(): ExplainAccess {
	const explain = useContext(AccessDialogContext);
	if (!explain) throw new Error("useExplainAccess precisa estar dentro de AccessDialogProvider.");
	return explain;
}
