import type { Absence } from "./types";

/**
 * O backend não garante ordem: as mais recentes (pelo início) vêm primeiro e, no mesmo dia,
 * a ordem é alfabética pelo profissional. Ausências sem data de início ficam no fim.
 */
export function sortAbsences(absences: readonly Absence[]): Absence[] {
	return [...absences].sort((a, b) => {
		const byStart = (b.dataInicio ?? "").localeCompare(a.dataInicio ?? "");
		if (byStart !== 0) return byStart;
		return a.solicitanteNome.localeCompare(b.solicitanteNome, "pt-BR");
	});
}
