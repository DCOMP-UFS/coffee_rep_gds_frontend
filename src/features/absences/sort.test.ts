import { sortAbsences } from "./sort";
import type { Absence } from "./types";

const absence = (id: number, solicitanteNome: string, dataInicio: string | null): Absence => ({
	id,
	solicitanteId: id,
	solicitanteNome,
	dataInicio,
	dataFim: dataInicio,
});

describe("sortAbsences", () => {
	it("ordena da mais recente para a mais antiga e, no mesmo dia, pelo nome", () => {
		const sorted = sortAbsences([
			absence(1, "Carla", "2026-01-05"),
			absence(2, "Álvaro", "2026-03-01"),
			absence(3, "Bruno", "2026-03-01"),
			absence(4, "Ana", null),
		]);
		expect(sorted.map((item) => item.id)).toEqual([2, 3, 1, 4]);
	});

	it("não altera a lista original", () => {
		const original = [absence(1, "B", "2026-01-01"), absence(2, "A", "2026-02-01")];
		sortAbsences(original);
		expect(original.map((item) => item.id)).toEqual([1, 2]);
	});
});
