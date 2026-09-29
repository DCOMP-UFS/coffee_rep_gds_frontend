import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { HttpResponse, http } from "msw";
import { RANGE_PAGE_SIZE, reservationsApi } from "./api";
import type { Reservation } from "./types";

const reservation = (id: number): Reservation => ({
	reservationId: id,
	horaInicio: "2026-10-01T08:00:00",
	horaFim: "2026-10-01T09:00:00",
	sala: `Sala ${id}`,
	setor: "Ambulatório",
	solicitante: "Ana Souza",
	salaId: id,
	solicitanteId: 1,
});

function mockReservations(all: Reservation[]) {
	const requests: URLSearchParams[] = [];
	server.use(
		http.get(apiUrl("reservation"), ({ request }) => {
			const params = new URL(request.url).searchParams;
			requests.push(params);
			return HttpResponse.json(paged(all, Number(params.get("page")), Number(params.get("size"))));
		}),
	);
	return requests;
}

describe("reservationsApi.listAllInRange", () => {
	// Regressão: no Angular, o calendário pedia no máximo 1000 reservas e cortava o restante.
	it("junta todas as páginas do período", async () => {
		const all = Array.from({ length: RANGE_PAGE_SIZE * 2 + 3 }, (_, index) =>
			reservation(index + 1),
		);
		const requests = mockReservations(all);

		const result = await reservationsApi.listAllInRange({
			inicio: "2026-09-27",
			fim: "2026-11-07",
		});

		expect(result).toHaveLength(all.length);
		expect(result.map((item) => item.reservationId)).toEqual(all.map((item) => item.reservationId));
		expect(requests.map((params) => params.get("page")).sort()).toEqual(["0", "1", "2"]);
		expect(requests[0]?.get("inicio")).toBe("2026-09-27T00:00:00");
		expect(requests[0]?.get("fim")).toBe("2026-11-07T23:59:59");
		expect(requests[0]?.get("size")).toBe(String(RANGE_PAGE_SIZE));
		expect(requests[0]?.has("setorId")).toBe(false);
	});

	it("faz uma única requisição quando tudo cabe na primeira página, enviando o setor", async () => {
		const requests = mockReservations([reservation(1)]);

		const result = await reservationsApi.listAllInRange({
			inicio: "2026-09-27",
			fim: "2026-11-07",
			setorId: 4,
		});

		expect(result).toHaveLength(1);
		expect(requests).toHaveLength(1);
		expect(requests[0]?.get("setorId")).toBe("4");
	});

	it("devolve lista vazia quando o período não tem reservas", async () => {
		const requests = mockReservations([]);

		await expect(
			reservationsApi.listAllInRange({ inicio: "2026-09-27", fim: "2026-11-07" }),
		).resolves.toEqual([]);
		expect(requests).toHaveLength(1);
	});
});
