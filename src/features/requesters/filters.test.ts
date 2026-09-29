import {
	ALL_SPECIALTIES_OPTION,
	DEFAULT_REQUESTER_FILTERS,
	hasActiveRequesterFilters,
	specialtyOptions,
	toRequesterListFilters,
} from "./filters";
import type { Requester } from "./types";

describe("toRequesterListFilters", () => {
	it("não envia sort na ordem padrão", () => {
		expect(toRequesterListFilters(DEFAULT_REQUESTER_FILTERS, 0, 5)).toEqual({
			search: "",
			specialty: "",
			page: 0,
			size: 5,
		});
	});

	it("apara a busca e converte a ordenação para o formato do backend", () => {
		expect(
			toRequesterListFilters(
				{ search: " ana ", specialty: "Cardiologia", sort: "especialidade-asc" },
				1,
				10,
			),
		).toEqual({
			search: "ana",
			specialty: "Cardiologia",
			sort: "especialidade,asc",
			page: 1,
			size: 10,
		});
	});
});

describe("hasActiveRequesterFilters", () => {
	it("considera busca e especialidade, não a ordenação", () => {
		expect(hasActiveRequesterFilters(DEFAULT_REQUESTER_FILTERS)).toBe(false);
		expect(hasActiveRequesterFilters({ ...DEFAULT_REQUESTER_FILTERS, sort: "nome-asc" })).toBe(
			false,
		);
		expect(hasActiveRequesterFilters({ ...DEFAULT_REQUESTER_FILTERS, search: "ana" })).toBe(true);
		expect(
			hasActiveRequesterFilters({ ...DEFAULT_REQUESTER_FILTERS, specialty: "Pediatria" }),
		).toBe(true);
	});
});

describe("specialtyOptions", () => {
	const requester = (id: number, especialidade?: string | null): Requester => ({
		id,
		nome: `Profissional ${id}`,
		especialidade,
	});

	it("começa com Todas e lista as especialidades sem repetição, em ordem alfabética", () => {
		const options = specialtyOptions([
			requester(1, "Pediatria"),
			requester(2, " Cardiologia "),
			requester(3, "pediatria"),
			requester(4, "Clínica Médica"),
		]);

		expect(options).toEqual([
			{ value: ALL_SPECIALTIES_OPTION, label: "Todas" },
			{ value: "Cardiologia", label: "Cardiologia" },
			{ value: "Clínica Médica", label: "Clínica Médica" },
			{ value: "Pediatria", label: "Pediatria" },
		]);
	});

	it("ignora solicitantes sem especialidade", () => {
		expect(specialtyOptions([requester(1, null), requester(2, "  "), requester(3)])).toEqual([
			{ value: ALL_SPECIALTIES_OPTION, label: "Todas" },
		]);
	});

	it("mantém separadas as grafias com acentos diferentes", () => {
		const labels = specialtyOptions([requester(1, "Clínica"), requester(2, "Clinica")]).map(
			(option) => option.label,
		);
		expect(labels).toHaveLength(3);
	});
});
