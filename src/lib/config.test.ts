import { afterEach, describe, expect, it, vi } from "vitest";

async function loadApiBaseUrl() {
	vi.resetModules();
	const { API_BASE_URL } = await import("./config");
	return API_BASE_URL;
}

describe("API_BASE_URL", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("usa VITE_API_URL sem a barra final", async () => {
		vi.stubEnv("VITE_API_URL", "https://api.exemplo.com/api/");

		expect(await loadApiBaseUrl()).toBe("https://api.exemplo.com/api");
	});

	it("aponta para a API publicada no build de produção sem VITE_API_URL", async () => {
		vi.stubEnv("VITE_API_URL", "");
		vi.stubEnv("PROD", true);

		expect(await loadApiBaseUrl()).toBe("https://api-gestao-salas.vercel.app/api");
	});

	it("aponta para o backend local em desenvolvimento sem VITE_API_URL", async () => {
		vi.stubEnv("VITE_API_URL", "");
		vi.stubEnv("PROD", false);

		expect(await loadApiBaseUrl()).toBe("http://localhost:8080/api");
	});
});
