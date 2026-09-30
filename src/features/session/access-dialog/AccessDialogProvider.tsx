import { type ReactNode, useCallback, useState } from "react";
import type { Permission } from "../types";
import { AccessRequiredDialog } from "./AccessRequiredDialog";
import { AccessDialogContext } from "./context";

interface AccessTarget {
	permission: Permission;
	feature: string;
}

/**
 * Uma única instância do modal "Acesso necessário" para todas as telas, em vez de um por botão
 * ou por linha de tabela.
 */
export function AccessDialogProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [target, setTarget] = useState<AccessTarget>();

	const explain = useCallback((permission: Permission, feature: string) => {
		setTarget({ permission, feature });
		setOpen(true);
	}, []);

	return (
		<AccessDialogContext value={explain}>
			{children}
			{target && (
				<AccessRequiredDialog
					open={open}
					onOpenChange={setOpen}
					permission={target.permission}
					feature={target.feature}
				/>
			)}
		</AccessDialogContext>
	);
}
