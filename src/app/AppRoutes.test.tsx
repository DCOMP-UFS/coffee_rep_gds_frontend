import { currentUser, paged } from "@test/msw/fixtures";
import { API_URL, apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor } from "@testing-library/react";
import { delay, HttpResponse, http } from "msw";
import { DEVELOPER_CONTACT_LABEL } from "@/components/layout/AppFooter";
import { copyrightNotice } from "@/components/layout/developer";
import { NAVIGATION_ITEMS } from "@/components/layout/navigation";
import { FORBIDDEN_TITLE } from "@/features/session/PermissionGate";

const mockRoomsPage = () =>
	server.use(
		http.get(apiUrl("room"), () => HttpResponse.json(paged([], 0, 5))),
		http.get(apiUrl("section"), () => HttpResponse.json([])),
	);

// A ordem importa: cada tela sob demanda é resolvida uma vez por arquivo de teste, então o teste
// da carga sob demanda precisa rodar antes de qualquer outro que abra a tela de Salas.
describe("rotas", () => {
	// Importar os módulos antes evita que a primeira visita pague a importação dentro do tempo de
	// espera do `findBy`. A tela continua passando pelo "Carregando…" na primeira renderização.
	beforeAll(async () => {
		await Promise.all([
			import("@/features/rooms/RoomsPage"),
			import("@/features/sections/SectionsPage"),
			import("@/features/requesters/RequestersPage"),
			import("@/features/absences/AbsencesPage"),
			import("@/features/reservations/ReservationsPage"),
			import("@/features/audit/HistoryPage"),
			import("@/features/calendar/CalendarPage"),
			import("@/features/my-access/MyAccessPage"),
			import("@/features/admin/AdminPage"),
		]);
	});

	it("mostra a página 404 em endereço desconhecido", () => {
		renderApp("/nao-existe");
		expect(screen.getByRole("heading", { name: "Página não encontrada" })).toBeInTheDocument();
	});

	it("carrega a tela de Salas sob demanda, mantendo o menu visível durante a carga", async () => {
		mockRoomsPage();
		renderApp("/rooms", { authenticated: true });

		expect(screen.getByText("Carregando…")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Salas" })).toHaveAttribute("data-active", "true");

		expect(await screen.findByRole("heading", { level: 1, name: "Salas" })).toBeInTheDocument();
		expect(screen.queryByText("Carregando…")).not.toBeInTheDocument();
	});

	it("marca o item de menu da rota atual", () => {
		mockRoomsPage();
		renderApp("/rooms", { authenticated: true });
		expect(screen.getByRole("link", { name: "Salas" })).toHaveAttribute("data-active", "true");
		expect(screen.getByRole("link", { name: "Calendário" })).toHaveAttribute(
			"data-active",
			"false",
		);
	});

	it("leva a raiz ao login quando não há sessão", async () => {
		const { location } = renderApp("/");
		await waitFor(() => expect(location()).toBe("/login"));
	});

	// Com o administrador, que tem todas as permissões, nenhuma rota cai em "Sem permissão".
	it.each(NAVIGATION_ITEMS.map((item) => [item.path, item.label]))(
		"%s abre a tela própria",
		async (path, label) => {
			// Só a presença da tela importa aqui; os dados podem voltar vazios.
			server.use(http.get(`${API_URL}/*`, () => HttpResponse.json([])));
			renderApp(path, { authenticated: true, role: "ADMIN" });

			expect(await screen.findByRole("heading", { level: 1 })).not.toHaveTextContent(
				FORBIDDEN_TITLE,
			);
			expect(screen.getByRole("link", { name: new RegExp(`^${label}`) })).toHaveAttribute(
				"data-active",
				"true",
			);
		},
	);

	describe("rodapé", () => {
		const footerNav = () => screen.getByRole("navigation", { name: DEVELOPER_CONTACT_LABEL });

		it.each(["/login", "/cadastro", "/nao-existe"])("aparece em %s", (path) => {
			renderApp(path);
			expect(footerNav()).toBeInTheDocument();
			expect(screen.getByText(copyrightNotice())).toBeInTheDocument();
		});

		it("aparece nas telas autenticadas, abaixo do conteúdo", async () => {
			mockRoomsPage();
			renderApp("/rooms", { authenticated: true });

			expect(await screen.findByRole("heading", { level: 1, name: "Salas" })).toBeInTheDocument();
			expect(footerNav()).toBeInTheDocument();
		});

		it("aparece enquanto a sessão carrega", async () => {
			mockRoomsPage();
			server.use(
				http.get(apiUrl("auth/me"), async () => {
					await delay(50);
					return HttpResponse.json(currentUser("VIEWER"));
				}),
			);
			renderApp("/rooms", { authenticated: true, role: null });

			expect(screen.getByText("Carregando…")).toBeInTheDocument();
			expect(footerNav()).toBeInTheDocument();
			expect(await screen.findByRole("heading", { level: 1, name: "Salas" })).toBeInTheDocument();
			expect(footerNav()).toBeInTheDocument();
		});
	});
});
