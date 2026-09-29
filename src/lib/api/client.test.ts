import { apiUrl, server } from "@test/msw/server";
import { HttpResponse, http } from "msw";
import { setToken } from "@/lib/auth/token";
import { api, buildUrl } from "./client";
import { ApiError } from "./errors";

describe("buildUrl", () => {
	it("concatena o caminho à URL base sem barras duplicadas", () => {
		expect(buildUrl("section")).toBe(apiUrl("section"));
		expect(buildUrl("/section")).toBe(apiUrl("section"));
	});

	it("omite parâmetros nulos e indefinidos", () => {
		expect(buildUrl("room", { page: 0, size: 5, ocupada: undefined, busca: null })).toBe(
			`${apiUrl("room")}?page=0&size=5`,
		);
	});

	it("serializa booleanos como o HttpParams do Angular", () => {
		expect(buildUrl("section", { unpaged: true })).toBe(`${apiUrl("section")}?unpaged=true`);
	});
});

describe("api", () => {
	it("anexa o token como Bearer", async () => {
		setToken("meu-token");
		let authorization: string | null = null;
		server.use(
			http.get(apiUrl("section"), ({ request }) => {
				authorization = request.headers.get("authorization");
				return HttpResponse.json([]);
			}),
		);

		await api.get("section");

		expect(authorization).toBe("Bearer meu-token");
	});

	it("não anexa o token no login", async () => {
		setToken("token-antigo");
		let authorization: string | null = "não lido";
		server.use(
			http.post(apiUrl("auth/login"), ({ request }) => {
				authorization = request.headers.get("authorization");
				return HttpResponse.json({ accessToken: "novo" });
			}),
		);

		await api.post("auth/login", { cpf: "1", password: "2" });

		expect(authorization).toBeNull();
	});

	it("envia o corpo como JSON", async () => {
		let received: unknown;
		server.use(
			http.post(apiUrl("section"), async ({ request }) => {
				received = await request.json();
				return new HttpResponse(null, { status: 201 });
			}),
		);

		await api.post("section", { nome: "Pediatria", observacao: null });

		expect(received).toEqual({ nome: "Pediatria", observacao: null });
	});

	it("aceita respostas vazias", async () => {
		server.use(http.delete(apiUrl("section/1"), () => new HttpResponse(null, { status: 204 })));

		await expect(api.delete("section/1")).resolves.toBeUndefined();
	});

	it("lança ApiError com status, caminho e payload em respostas de erro", async () => {
		server.use(
			http.delete(apiUrl("room/7"), () =>
				HttpResponse.json({ message: "Sala possui reservas." }, { status: 422 }),
			),
		);

		const error = await api.delete("room/7").catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			status: 422,
			path: "room/7",
			payload: { message: "Sala possui reservas." },
		});
	});
});
