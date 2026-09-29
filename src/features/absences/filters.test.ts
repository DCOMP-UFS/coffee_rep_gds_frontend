import {
	absenceStatus,
	DEFAULT_ABSENCE_FILTERS,
	filterAbsences,
	hasActiveAbsenceFilters,
} from "./filters";
import { sortAbsences } from "./sort";
import type { Absence } from "./types";

const TODAY = "2026-03-10";

const absence = (
	id: number,
	solicitanteNome: string,
	dataInicio: string | null,
	dataFim: string | null,
): Absence => ({ id, solicitanteId: id, solicitanteNome, dataInicio, dataFim });

/** Já na ordem padrão (início mais recente), como o hook entrega. */
const ABSENCES = sortAbsences([
	absence(1, "Carla Dias", "2026-01-05", "2026-01-10"),
	absence(2, "Álvaro Reis", "2026-03-01", "2026-03-15"),
	absence(3, "bruno lima", "2026-04-01", "2026-04-10"),
	absence(4, "Ana Souza", "2026-03-10", "2026-03-10"),
	absence(5, "Sem Data", null, null),
]);

const ids = (absences: Absence[]) => absences.map((item) => item.id);
const filtered = (filters: Partial<typeof DEFAULT_ABSENCE_FILTERS>) =>
	ids(filterAbsences(ABSENCES, { ...DEFAULT_ABSENCE_FILTERS, ...filters }, TODAY));

describe("absenceStatus", () => {
	it("classifica em relação a hoje, contando o primeiro e o último dia como em andamento", () => {
		expect(absenceStatus(absence(1, "A", "2026-03-01", "2026-03-15"), TODAY)).toBe("andamento");
		expect(absenceStatus(absence(1, "A", "2026-03-10", "2026-03-10"), TODAY)).toBe("andamento");
		expect(absenceStatus(absence(1, "A", "2026-03-11", "2026-03-20"), TODAY)).toBe("proximas");
		expect(absenceStatus(absence(1, "A", "2026-03-01", "2026-03-09"), TODAY)).toBe("encerradas");
	});

	it("não classifica ausência sem as duas datas", () => {
		expect(absenceStatus(absence(1, "A", null, "2026-03-09"), TODAY)).toBeNull();
		expect(absenceStatus(absence(1, "A", "2026-03-01", null), TODAY)).toBeNull();
	});
});

describe("filterAbsences", () => {
	it("mantém a ordem recebida no padrão", () => {
		expect(filtered({})).toEqual([3, 4, 2, 1, 5]);
	});

	it("busca pelo profissional ignorando acentos e maiúsculas", () => {
		expect(filtered({ search: "ALVARO" })).toEqual([2]);
		expect(filtered({ search: "Lima" })).toEqual([3]);
	});

	it("filtra pela situação", () => {
		expect(filtered({ status: "andamento" })).toEqual([4, 2]);
		expect(filtered({ status: "proximas" })).toEqual([3]);
		expect(filtered({ status: "encerradas" })).toEqual([1]);
	});

	it("ordena pelo início mais antigo, deixando sem data no fim", () => {
		expect(filtered({ sort: "inicio-asc" })).toEqual([1, 2, 4, 3, 5]);
	});

	it("ordena pelo profissional de A a Z e de Z a A", () => {
		expect(filtered({ sort: "profissional-asc" })).toEqual([2, 4, 3, 1, 5]);
		expect(filtered({ sort: "profissional-desc" })).toEqual([5, 1, 3, 4, 2]);
	});

	it("combina busca, situação e ordenação", () => {
		expect(filtered({ search: "a", status: "andamento", sort: "profissional-asc" })).toEqual([
			2, 4,
		]);
	});

	it("não altera a lista original", () => {
		const original = [...ABSENCES];
		filterAbsences(ABSENCES, { ...DEFAULT_ABSENCE_FILTERS, sort: "profissional-asc" }, TODAY);
		expect(ABSENCES).toEqual(original);
	});
});

describe("hasActiveAbsenceFilters", () => {
	it("considera busca e situação, não a ordenação", () => {
		expect(hasActiveAbsenceFilters(DEFAULT_ABSENCE_FILTERS)).toBe(false);
		expect(hasActiveAbsenceFilters({ ...DEFAULT_ABSENCE_FILTERS, sort: "inicio-asc" })).toBe(false);
		expect(hasActiveAbsenceFilters({ ...DEFAULT_ABSENCE_FILTERS, search: "ana" })).toBe(true);
		expect(hasActiveAbsenceFilters({ ...DEFAULT_ABSENCE_FILTERS, status: "proximas" })).toBe(true);
	});
});
