import { currentUser, paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor } from "@testing-library/react";
import { delay, HttpResponse, http } from "msw";
import { SESSION_LOAD_ERROR_TITLE } from "@/features/auth/ProtectedRoute";
import { getToken } from "@/lib/auth/token";
import { FORBIDDEN_TITLE } from "./PermissionGate";

const mockRoomsPage = () =>
	server.use(
		http.get(apiUrl("room"), () => HttpResponse.json(paged([], 0, 5))),
		http.get(apiUrl("section"), () => HttpResponse.json([])),
	);

const menuLinks = () =>
	screen.getAllByRole("link").map((link) => link.textContent?.replace(/,.*$/, "").trim());

describe("sessão", () => {
	beforeAll(async () => {
		await Promise.all([
			import("@/features/rooms/RoomsPage"),
			import("@/features/my-access/MyAccessPage"),
			import("@/features/admin/AdminPage"),
		]);
	});

	describe("rota protegida", () => {
		it("espera o perfil do usuário antes de montar o menu e a tela", async () => {
			mockRoomsPage();
			let calls = 0;
			server.use(
				http.get(apiUrl("auth/me"), async () => {
					calls++;
					await delay(50);
					return HttpResponse.json(currentUser("VIEWER"));
				}),
			);
			renderApp("/rooms", { authenticated: true, role: null });

			expect(screen.getByText("Carregando…")).toBeInTheDocument();
			expect(screen.queryByRole("link", { name: "Salas" })).not.toBeInTheDocument();

			expect(await screen.findByRole("heading", { level: 1, name: "Salas" })).toBeInTheDocument();
			expect(screen.getByRole("link", { name: "Salas" })).toBeInTheDocument();
			expect(calls).toBe(1);
		});

		it("mostra o erro com opção de tentar de novo quando o perfil não carrega", async () => {
			mockRoomsPage();
			let failures = 1;
			server.use(
				http.get(apiUrl("auth/me"), () => {
					if (failures-- > 0) return new HttpResponse(null, { status: 500 });
					return HttpResponse.json(currentUser("COORDINATOR"));
				}),
			);
			const { user } = renderApp("/rooms", { authenticated: true, role: null });

			expect(await screen.findByRole("heading", { name: SESSION_LOAD_ERROR_TITLE })).toBeVisible();
			expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();

			await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

			expect(await screen.findByRole("heading", { level: 1, name: "Salas" })).toBeInTheDocument();
		});

		it("leva ao login quando o usuário não existe mais", async () => {
			server.use(http.get(apiUrl("auth/me"), () => new HttpResponse(null, { status: 401 })));
			const { location } = renderApp("/rooms", { authenticated: true, role: null });

			await waitFor(() => expect(location()).toBe("/login"));
			expect(getToken()).toBeNull();
		});
	});

	describe("menu", () => {
		it("visualizador vê todos os itens, com a Administração bloqueada", () => {
			mockRoomsPage();
			renderApp("/rooms", { authenticated: true, role: "VIEWER" });

			expect(menuLinks()).toEqual([
				"Calendário",
				"Setores",
				"Salas",
				"Solicitante",
				"Reservas",
				"Ausências",
				"Histórico",
				"Meu acesso",
				"Administração",
			]);
			expect(screen.getByRole("link", { name: "Histórico" })).toBeInTheDocument();
			expect(
				screen.getByRole("link", {
					name: /^Administração\s*, exclusivo do administrador do sistema$/,
				}),
			).toHaveAttribute("href", "/admin");
		});

		it("coordenação também vê a Administração bloqueada, sem consultar os pedidos", () => {
			mockRoomsPage();
			let summaryCalls = 0;
			server.use(
				http.get(apiUrl("role-request/summary"), () => {
					summaryCalls++;
					return HttpResponse.json({ pending: 0 });
				}),
			);
			renderApp("/rooms", { authenticated: true, role: "COORDINATOR" });

			expect(
				screen.getByRole("link", { name: /^Administração\s*, exclusivo do administrador/ }),
			).toBeInTheDocument();
			expect(summaryCalls).toBe(0);
		});

		it("administrador vê a Administração com o número de pedidos pendentes", async () => {
			mockRoomsPage();
			server.use(http.get(apiUrl("role-request/summary"), () => HttpResponse.json({ pending: 3 })));
			renderApp("/rooms", { authenticated: true, role: "ADMIN" });

			expect(
				await screen.findByRole("link", { name: /^Administração\s*, 3 pedidos pendentes$/ }),
			).toBeInTheDocument();
			const badge = document.querySelector('[data-sidebar="menu-badge"]');
			expect(badge).toHaveTextContent("3");
			expect(badge).toHaveAttribute("aria-hidden", "true");
		});

		it("sem pedidos pendentes, a Administração aparece sem número", async () => {
			mockRoomsPage();
			let summaryCalls = 0;
			server.use(
				http.get(apiUrl("role-request/summary"), () => {
					summaryCalls++;
					return HttpResponse.json({ pending: 0 });
				}),
			);
			renderApp("/rooms", { authenticated: true, role: "ADMIN" });

			await waitFor(() => expect(summaryCalls).toBe(1));
			expect(screen.getByRole("link", { name: "Administração" })).toBeInTheDocument();
		});
	});

	describe("rotas com permissão", () => {
		it("visualizador que abre a Administração vê Sem permissão, sem consultar o backend", async () => {
			renderApp("/admin", { authenticated: true, role: "VIEWER" });

			const heading = await screen.findByRole("heading", { level: 1, name: FORBIDDEN_TITLE });
			const page = heading.closest("section") as HTMLElement;
			expect(page).toHaveTextContent(
				"Administrar usuários e pedidos de acesso é exclusivo do administrador do sistema.",
			);
			expect(page).toHaveTextContent("Seu perfilVisualizador");
			expect(page).toHaveTextContent("Perfil necessárioAdministrador do sistema");
			expect(page).toHaveTextContent("Esse perfil não pode ser pedido");
			expect(screen.queryByRole("link", { name: "Pedir acesso" })).not.toBeInTheDocument();
			expect(screen.getByRole("link", { name: "Ver meu acesso" })).toHaveAttribute(
				"href",
				"/meu-acesso",
			);
			expect(screen.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute(
				"href",
				"/rooms",
			);
		});

		it("coordenação que abre a Administração vê Sem permissão", async () => {
			renderApp("/admin", { authenticated: true, role: "COORDINATOR" });

			expect(await screen.findByRole("heading", { level: 1, name: FORBIDDEN_TITLE })).toBeVisible();
		});
	});
});
