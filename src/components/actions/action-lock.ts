/** Ação que continua visível, mas bloqueada: explica o motivo em vez de executar. */
export interface ActionLock {
	/** Motivo curto, mostrado no tooltip, ex.: "Disponível a partir de Coordenação". */
	reason: string;
	/** Abre a explicação completa. */
	explain: () => void;
}

/** Motivo no meio de uma frase: "Exclusivo do…" vira "exclusivo do…"; nomes de perfil ficam. */
export function inlineReason(reason: string): string {
	return `${reason.charAt(0).toLowerCase()}${reason.slice(1)}`;
}

/** Nome acessível de uma ação bloqueada: o nome da ação seguido do motivo. */
export function lockedLabel(label: string, reason: string): string {
	return `${label} (${inlineReason(reason)})`;
}

/** Aparência de bloqueio, sem `disabled`: o botão continua focável e clicável para explicar. */
export const LOCKED_ACTION_CLASSES = "opacity-60 hover:opacity-80";
