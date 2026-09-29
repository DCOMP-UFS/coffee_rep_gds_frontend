import { DEFAULT_ROOM_FILTERS, hasActiveRoomFilters, toRoomListFilters } from "./filters";

describe("toRoomListFilters", () => {
	it("não envia sort na ordem padrão", () => {
		expect(toRoomListFilters(DEFAULT_ROOM_FILTERS, 0, 5)).toEqual({
			sectionId: 0,
			status: "Todas",
			search: "",
			page: 0,
			size: 5,
		});
	});

	it("apara a busca e converte a ordenação para o formato do backend", () => {
		expect(
			toRoomListFilters(
				{ search: "  Sala 1 ", sectionId: 4, status: "Livre", sort: "setor-asc" },
				2,
				10,
			),
		).toEqual({
			sectionId: 4,
			status: "Livre",
			search: "Sala 1",
			sort: "setor,asc",
			page: 2,
			size: 10,
		});
	});

	it("envia nome decrescente", () => {
		expect(toRoomListFilters({ ...DEFAULT_ROOM_FILTERS, sort: "nome-desc" }, 0, 5).sort).toBe(
			"nome,desc",
		);
	});
});

describe("hasActiveRoomFilters", () => {
	it("considera busca, setor e status, não a ordenação", () => {
		expect(hasActiveRoomFilters(DEFAULT_ROOM_FILTERS)).toBe(false);
		expect(hasActiveRoomFilters({ ...DEFAULT_ROOM_FILTERS, sort: "nome-asc" })).toBe(false);
		expect(hasActiveRoomFilters({ ...DEFAULT_ROOM_FILTERS, search: "  " })).toBe(false);
		expect(hasActiveRoomFilters({ ...DEFAULT_ROOM_FILTERS, search: "sala" })).toBe(true);
		expect(hasActiveRoomFilters({ ...DEFAULT_ROOM_FILTERS, sectionId: 4 })).toBe(true);
		expect(hasActiveRoomFilters({ ...DEFAULT_ROOM_FILTERS, status: "Ocupada" })).toBe(true);
	});
});
