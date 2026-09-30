import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ROLE_REQUEST_ERROR_MESSAGES } from "@/features/role-requests/hooks";
import type { ManagedUser, RoleRequest, RoleRequestStatus } from "@/features/role-requests/types";
import { ROLE_REQUEST_APPROVED_MESSAGE, ROLE_REQUEST_REJECTED_MESSAGE } from "./RoleRequestsTab";
import { USER_ROLE_CHANGED_MESSAGE } from "./UsersTab";

type User = ReturnType<typeof renderApp>["user"];

const request = (id: number, overrides: Partial<RoleRequest> = {}): RoleRequest => ({
	id,
	userId: 100 + id,
	userName: `Pessoa ${id}`,
	userEmail: `pessoa${id}@hu.ufs.br`,
	currentRole: "VIEWER",
	requestedRole: "ASSISTANT",
	justification: `Justificativa do pedido ${id}.`,
	status: "PENDING",
	createdAt: `2026-09-2${id}T10:00:00`,
	...overrides,
});

const REQUESTS = [
	request(1),
	request(2, { currentRole: "BASIC", requestedRole: "COORDINATOR" }),
	request(3, { status: "REJECTED", reviewNote: "Sem vínculo com o ambulatório." }),
];

const USERS: ManagedUser[] = [
	{ userId: 1, name: "Admin", email: "admin@admin.com", roles: [{ roleId: 1, name: "ADMIN" }] },
	{
		userId: 2,
		name: "Carla Coordenadora",
		email: "carla@hu.ufs.br",
		cpf: "52998224725",
		roles: [{ roleId: 2, name: "BASIC" }],
	},
	{
		userId: 3,
		name: "Bruno Viewer",
		email: "bruno@hu.ufs.br",
		roles: [{ roleId: 5, name: "VIEWER" }],
	},
];

/** Backend em memória dos pedidos (lista com filtro de situação, aprovar, recusar) e usuários. */
function mockBackend({ requests = REQUESTS }: { requests?: RoleRequest[] } = {}) {
	let current = [...requests];
	const listRequests: (string | null)[] = [];
	const writes: { method: string; url: string; body?: unknown }[] = [];

	const close = (id: number, status: RoleRequestStatus, reviewNote?: string | null) => {
		current = current.map((item) =>
			item.id === id ? { ...item, status, reviewNote: reviewNote ?? undefined } : item,
		);
		return current.find((item) => item.id === id);
	};

	server.use(
		http.get(apiUrl("role-request/summary"), () =>
			HttpResponse.json({ pending: current.filter((item) => item.status === "PENDING").length }),
		),
		http.get(apiUrl("role-request"), ({ request: req }) => {
			const params = new URL(req.url).searchParams;
			const status = params.get("status");
			listRequests.push(status);
			const filtered = status ? current.filter((item) => item.status === status) : current;
			return HttpResponse.json(
				paged(filtered, Number(params.get("page")), Number(params.get("size"))),
			);
		}),
		http.post(apiUrl("role-request/:id/approve"), ({ request: req, params }) => {
			writes.push({ method: "POST", url: req.url });
			return HttpResponse.json(close(Number(params.id), "APPROVED"));
		}),
		http.post(apiUrl("role-request/:id/reject"), async ({ request: req, params }) => {
			const body = (await req.json()) as { reason: string | null };
			writes.push({ method: "POST", url: req.url, body });
			return HttpResponse.json(close(Number(params.id), "REJECTED", body.reason));
		}),
		http.get(apiUrl("user"), () => HttpResponse.json(USERS)),
		http.patch(apiUrl("user/:id/role"), async ({ request: req }) => {
			writes.push({ method: "PATCH", url: req.url, body: await req.json() });
			return HttpResponse.json(USERS[1]);
		}),
	);

	return { listRequests, writes };
}

const renderAdmin = () => renderApp("/admin", { authenticated: true, role: "ADMIN" });

/** Linha com uma célula que começa com o nome da pessoa (o e-mail pode vir logo abaixo). */
const rowOf = (name: string) =>
	screen
		.getAllByRole("row")
		.find((row) =>
			Array.from(row.querySelectorAll("td")).some((cell) => cell.textContent?.startsWith(name)),
		) as HTMLElement;

async function openUsersTab(user: User) {
	await user.click(await screen.findByRole("tab", { name: "Usuários" }));
	await screen.findByRole("cell", { name: "Carla Coordenadora" });
}

describe("Administração", () => {
	beforeAll(async () => {
		await import("./AdminPage");
	});

	describe("pedidos", () => {
		it("abre nos pedidos pendentes, com o número na aba", async () => {
			const backend = mockBackend();
			renderAdmin();

			expect(await screen.findByRole("cell", { name: /^Pessoa 1/ })).toBeInTheDocument();
			expect(screen.getByRole("tab", { name: "Pedidos (2 pendentes)" })).toHaveAttribute(
				"aria-selected",
				"true",
			);
			expect(screen.queryByRole("cell", { name: /^Pessoa 3/ })).not.toBeInTheDocument();
			expect(backend.listRequests).toEqual(["PENDING"]);
			expect(within(rowOf("Pessoa 2")).getByText("Básico (legado)")).toBeInTheDocument();
			expect(within(rowOf("Pessoa 2")).getByText("Coordenação")).toBeInTheDocument();
		});

		it("lista todas as situações quando o filtro é limpo, sem ações nos pedidos fechados", async () => {
			const backend = mockBackend();
			const { user } = renderAdmin();
			await screen.findByRole("cell", { name: /^Pessoa 1/ });

			await user.click(screen.getByRole("combobox", { name: "Situação" }));
			await user.click(await screen.findByRole("option", { name: "Todas" }));

			expect(await screen.findByRole("cell", { name: /^Pessoa 3/ })).toBeInTheDocument();
			expect(backend.listRequests.at(-1)).toBeNull();
			const closed = within(rowOf("Pessoa 3"));
			expect(closed.getByText("Recusado")).toBeInTheDocument();
			expect(closed.getByText("Sem vínculo com o ambulatório.")).toBeInTheDocument();
			expect(closed.queryByRole("button")).not.toBeInTheDocument();
		});

		it("aprova um pedido depois de confirmar, com aviso e recarga", async () => {
			const backend = mockBackend();
			const { user } = renderAdmin();

			await user.click(await screen.findByRole("button", { name: "Aprovar pedido de Pessoa 1" }));
			const confirm = await screen.findByRole("alertdialog", {
				name: "Aprovar o pedido de Pessoa 1?",
			});
			expect(confirm).toHaveTextContent("passa de Visualizador para Assistente administrativo");
			await user.click(within(confirm).getByRole("button", { name: "Aprovar" }));

			expect(await screen.findByText(ROLE_REQUEST_APPROVED_MESSAGE)).toBeInTheDocument();
			expect(backend.writes).toEqual([{ method: "POST", url: apiUrl("role-request/1/approve") }]);
			await waitFor(() =>
				expect(screen.queryByRole("cell", { name: /^Pessoa 1/ })).not.toBeInTheDocument(),
			);
			expect(await screen.findByRole("tab", { name: "Pedidos (1 pendente)" })).toBeVisible();
		});

		it("recusa um pedido com motivo", async () => {
			const backend = mockBackend();
			const { user } = renderAdmin();

			await user.click(await screen.findByRole("button", { name: "Recusar pedido de Pessoa 2" }));
			const confirm = await screen.findByRole("alertdialog", {
				name: "Recusar o pedido de Pessoa 2?",
			});
			await user.type(
				within(confirm).getByLabelText("Motivo (opcional)"),
				"  Acesso só para a coordenação.  ",
			);
			await user.click(within(confirm).getByRole("button", { name: "Recusar" }));

			expect(await screen.findByText(ROLE_REQUEST_REJECTED_MESSAGE)).toBeInTheDocument();
			expect(backend.writes).toEqual([
				{
					method: "POST",
					url: apiUrl("role-request/2/reject"),
					body: { reason: "Acesso só para a coordenação." },
				},
			]);
		});

		it("recusa sem motivo enviando null", async () => {
			const backend = mockBackend();
			const { user } = renderAdmin();

			await user.click(await screen.findByRole("button", { name: "Recusar pedido de Pessoa 1" }));
			const confirm = await screen.findByRole("alertdialog");
			await user.click(within(confirm).getByRole("button", { name: "Recusar" }));

			await screen.findByText(ROLE_REQUEST_REJECTED_MESSAGE);
			expect(backend.writes[0]?.body).toEqual({ reason: null });
		});

		it("mostra o erro da aprovação dentro da confirmação", async () => {
			mockBackend();
			server.use(
				http.post(apiUrl("role-request/:id/approve"), () =>
					HttpResponse.json(
						{ status: 400, error: "Bad Request", message: "Este pedido já foi analisado." },
						{ status: 400 },
					),
				),
			);
			const { user } = renderAdmin();

			await user.click(await screen.findByRole("button", { name: "Aprovar pedido de Pessoa 1" }));
			const confirm = await screen.findByRole("alertdialog");
			await user.click(within(confirm).getByRole("button", { name: "Aprovar" }));

			expect(await within(confirm).findByRole("alert")).toHaveTextContent(
				"Este pedido já foi analisado.",
			);
			expect(screen.queryByText(ROLE_REQUEST_APPROVED_MESSAGE)).not.toBeInTheDocument();
		});

		it("mostra o estado vazio dos pendentes", async () => {
			mockBackend({ requests: [] });
			renderAdmin();

			expect(await screen.findByText("Nenhum pedido pendente")).toBeInTheDocument();
			expect(screen.getByRole("tab", { name: "Pedidos" })).toBeInTheDocument();
		});

		it("mostra erro com opção de tentar novamente", async () => {
			mockBackend();
			let failures = 1;
			server.use(
				http.get(apiUrl("role-request"), () => {
					if (failures-- > 0) return new HttpResponse(null, { status: 500 });
					return undefined;
				}),
			);
			const { user } = renderAdmin();

			await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));

			expect(await screen.findByRole("cell", { name: /^Pessoa 1/ })).toBeInTheDocument();
		});
	});

	describe("usuários", () => {
		it("lista os usuários em ordem alfabética, com o administrador bloqueado", async () => {
			mockBackend();
			const { user } = renderAdmin();
			await openUsersTab(user);

			const names = screen
				.getAllByRole("row")
				.slice(1)
				.map((row) => row.querySelector("td")?.textContent);
			expect(names).toEqual(["Admin", "Bruno Viewer", "Carla Coordenadora"]);
			expect(within(rowOf("Admin")).getByText("Administrador de tecnologia")).toBeInTheDocument();
			expect(within(rowOf("Admin")).queryByRole("combobox")).not.toBeInTheDocument();
			expect(
				screen.getByRole("combobox", { name: "Perfil de Carla Coordenadora" }),
			).toHaveTextContent("Coordenação");
			expect(within(rowOf("Carla Coordenadora")).getByText("529.982.247-25")).toBeInTheDocument();
		});

		it("busca por nome, e-mail ou CPF", async () => {
			mockBackend();
			const { user } = renderAdmin();
			await openUsersTab(user);

			await user.type(screen.getByRole("searchbox", { name: "Buscar usuário" }), "bruno@");

			await waitFor(() =>
				expect(screen.queryByRole("cell", { name: "Carla Coordenadora" })).not.toBeInTheDocument(),
			);
			expect(screen.getByRole("cell", { name: "Bruno Viewer" })).toBeInTheDocument();
			expect(screen.getByText("1 de 3 usuários")).toBeInTheDocument();
		});

		it("altera o perfil depois de confirmar", async () => {
			const backend = mockBackend();
			const { user } = renderAdmin();
			await openUsersTab(user);

			await user.click(screen.getByRole("combobox", { name: "Perfil de Bruno Viewer" }));
			await user.click(await screen.findByRole("option", { name: "Assistente administrativo" }));
			const confirm = await screen.findByRole("alertdialog", {
				name: "Alterar o perfil de Bruno Viewer?",
			});
			await user.click(within(confirm).getByRole("button", { name: "Alterar perfil" }));

			expect(await screen.findByText(USER_ROLE_CHANGED_MESSAGE)).toBeInTheDocument();
			expect(backend.writes).toEqual([
				{ method: "PATCH", url: apiUrl("user/3/role"), body: { role: "ASSISTANT" } },
			]);
		});

		it("mostra o erro da troca de perfil dentro da confirmação", async () => {
			mockBackend();
			server.use(
				http.patch(apiUrl("user/:id/role"), () => new HttpResponse(null, { status: 500 })),
			);
			const { user } = renderAdmin();
			await openUsersTab(user);

			await user.click(screen.getByRole("combobox", { name: "Perfil de Bruno Viewer" }));
			await user.click(await screen.findByRole("option", { name: "Coordenação" }));
			const confirm = await screen.findByRole("alertdialog");
			await user.click(within(confirm).getByRole("button", { name: "Alterar perfil" }));

			expect(await within(confirm).findByRole("alert")).toHaveTextContent(
				ROLE_REQUEST_ERROR_MESSAGES.changeRole,
			);
		});
	});
});
