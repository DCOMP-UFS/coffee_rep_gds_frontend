import { compareText, findSortOption, type SortOption, toSortParam } from "./sort";

const OPTIONS: SortOption[] = [
	{ value: "recentes", label: "Mais recentes" },
	{ value: "nome-asc", label: "Nome A–Z", sort: { field: "nome", direction: "asc" } },
	{ value: "nome-desc", label: "Nome Z–A", sort: { field: "nome", direction: "desc" } },
];

describe("toSortParam", () => {
	it("monta campo e sentido no formato do Spring", () => {
		expect(toSortParam(OPTIONS[1])).toBe("nome,asc");
		expect(toSortParam(OPTIONS[2])).toBe("nome,desc");
	});

	it("não envia nada na ordem padrão", () => {
		expect(toSortParam(OPTIONS[0])).toBeUndefined();
		expect(toSortParam(undefined)).toBeUndefined();
	});
});

describe("findSortOption", () => {
	it("encontra a opção pelo valor", () => {
		expect(findSortOption(OPTIONS, "nome-desc")?.label).toBe("Nome Z–A");
	});

	it("cai na opção padrão quando o valor é desconhecido", () => {
		expect(findSortOption(OPTIONS, "inexistente")?.value).toBe("recentes");
	});
});

describe("compareText", () => {
	it("ordena ignorando acentos e maiúsculas", () => {
		expect(["bruno", "Álvaro", "carla", "Ana"].sort(compareText)).toEqual([
			"Álvaro",
			"Ana",
			"bruno",
			"carla",
		]);
	});

	it("ordena números em ordem natural", () => {
		expect(["Sala 10", "Sala 2", "Sala 1"].sort(compareText)).toEqual([
			"Sala 1",
			"Sala 2",
			"Sala 10",
		]);
	});

	it("trata ausente como texto vazio, que vem primeiro", () => {
		expect(compareText(null, "Ana")).toBeLessThan(0);
		expect(compareText("Ana", undefined)).toBeGreaterThan(0);
		expect(compareText(null, undefined)).toBe(0);
	});
});
