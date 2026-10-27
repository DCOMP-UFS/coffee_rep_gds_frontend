import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { preloadAuthenticatedPage } from "@/app/authenticated-page-loaders";

vi.mock("@/app/authenticated-page-loaders", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/app/authenticated-page-loaders")>();
	return {
		...actual,
		preloadAuthenticatedPage: vi.fn(),
	};
});

const mockRoomsPage = () =>
	server.use(
		http.get(apiUrl("room"), () => HttpResponse.json(paged([], 0, 5))),
		http.get(apiUrl("section"), () => HttpResponse.json([])),
	);

describe("AppSidebar preload", () => {
	beforeAll(async () => {
		await import("@/features/rooms/RoomsPage");
	});

	beforeEach(() => {
		vi.mocked(preloadAuthenticatedPage).mockClear();
	});

	it("no hover de item liberado, pré-carrega o chunk da rota", async () => {
		mockRoomsPage();
		const { user } = renderApp("/rooms", { authenticated: true, role: "VIEWER" });
		vi.mocked(preloadAuthenticatedPage).mockClear();

		await user.hover(screen.getByRole("link", { name: "Calendário" }));

		expect(preloadAuthenticatedPage).toHaveBeenCalledWith("/calendar");
	});

	it("no focus de item liberado, pré-carrega o chunk da rota", () => {
		mockRoomsPage();
		renderApp("/rooms", { authenticated: true, role: "VIEWER" });
		vi.mocked(preloadAuthenticatedPage).mockClear();

		screen.getByRole("link", { name: "Calendário" }).focus();

		expect(preloadAuthenticatedPage).toHaveBeenCalledWith("/calendar");
	});

	it("não pré-carrega item bloqueado por permissão", async () => {
		mockRoomsPage();
		const { user } = renderApp("/rooms", { authenticated: true, role: "VIEWER" });
		vi.mocked(preloadAuthenticatedPage).mockClear();

		await user.hover(
			screen.getByRole("link", {
				name: /^Administração\s*, exclusivo do administrador/,
			}),
		);

		expect(preloadAuthenticatedPage).not.toHaveBeenCalled();
	});
});
