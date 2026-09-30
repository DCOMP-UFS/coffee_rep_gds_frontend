import { roleRequest as request } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ROLE_REQUEST_ERROR_MESSAGES } from "@/features/role-requests/hooks";
import type { RoleRequest } from "@/features/role-requests/types";
import type { Role } from "@/features/session/types";
import { MY_REQUESTS_LOAD_ERROR, ROLE_REQUEST_CANCELLED_MESSAGE } from "./MyAccessPage";
import { ROLE_REQUEST_SENT_MESSAGE } from "./RoleRequestForm";

type User = ReturnType<typeof renderApp>["user"];

/** Backend em memória dos pedidos do usuário logado: criar, listar e cancelar. */
function mockRequests(initial: RoleRequest[] = []) {
	let requests = [...initial];
	const writes: { method: string; url: string; body?: unknown }[] = [];

	server.use(
		http.get(apiUrl("role-request/me"), () => HttpResponse.json(requests)),
		http.post(apiUrl("role-request"), async ({ request: req }) => {
			const body = (await req.json()) as { requestedRole: string; justification: string };
			writes.push({ method: "POST", url: req.url, body });
			const created = request(requests.length + 1, body);
			requests = [created, ...requests];
			return HttpResponse.json(created, { status: 201 });
		}),
		http.post(apiUrl("role-request/:id/cancel"), ({ request: req, params }) => {
			writes.push({ method: "POST", url: req.url });
			requests = requests.map((item) =>
				item.id === Number(params.id) ? { ...item, status: "CANCELLED" } : item,
			);
			return HttpResponse.json(requests.find((item) => item.id === Number(params.id)));
		}),
	);

	return { writes };
}

const renderMyAccess = (role: Role = "VIEWER") =>
	renderApp("/meu-acesso", { authenticated: true, role });

async function submitRequest(user: User, role: string, justification: string) {
	await user.click(await screen.findByRole("radio", { name: new RegExp(`^${role}`) }));
	await user.type(screen.getByLabelText("Justificativa (obrigatório)"), justification);
	await user.click(screen.getByRole("button", { name: "Enviar pedido" }));
}

describe("Meu acesso", () => {
	beforeAll(async () => {
		await import("./MyAccessPage");
	});

	it("mostra o perfil atual destacado na hierarquia", async () => {
		mockRequests();
		renderMyAccess("ASSISTANT");

		expect(await screen.findByRole("heading", { level: 1, name: "Meu acesso" })).toBeVisible();
		const levels = screen.getByRole("list", { name: "Níveis de acesso" });
		const current = within(levels)
			.getAllByRole("listitem")
			.find((item) => item.getAttribute("aria-current") === "true");
		expect(current).toHaveTextContent("Assistente administrativo");
		expect(current).toHaveTextContent("Seu perfil");
	});

	it("visualizador pede um perfil acima, com o corpo exato, e passa a ver o pedido pendente", async () => {
		const backend = mockRequests();
		const { user } = renderMyAccess("VIEWER");

		expect(await screen.findByText("Nenhum pedido ainda")).toBeInTheDocument();
		expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
			"ASSISTANT",
			"COORDINATOR",
		]);
		expect(screen.getByRole("radio", { name: /^Assistente administrativo/ })).toBeChecked();

		await submitRequest(user, "Coordenação", "  Coordeno o ambulatório de pediatria.  ");

		expect(await screen.findByText(ROLE_REQUEST_SENT_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([
			{
				method: "POST",
				url: apiUrl("role-request"),
				body: {
					requestedRole: "COORDINATOR",
					justification: "Coordeno o ambulatório de pediatria.",
				},
			},
		]);
		const pending = await screen.findByRole("region", { name: "Pedido em análise" });
		expect(pending).toHaveTextContent("Seu pedido para Coordenação está em análise");
		expect(screen.queryByRole("button", { name: "Enviar pedido" })).not.toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Pendente" })).toBeInTheDocument();
	});

	it.each([
		["VIEWER", "COORDINATOR", /^Coordenação/],
		["VIEWER", "ADMIN", /^Assistente administrativo/],
		["VIEWER", "invalido", /^Assistente administrativo/],
		["ASSISTANT", "ASSISTANT", /^Coordenação/],
	] as const)(
		"%s com ?perfil=%s abre o formulário com o perfil certo marcado",
		async (role, param, checked) => {
			mockRequests();
			renderApp(`/meu-acesso?perfil=${param}`, { authenticated: true, role });

			expect(await screen.findByRole("radio", { name: checked })).toBeChecked();
			const checkedRadios = screen
				.getAllByRole("radio")
				.filter((radio) => radio.getAttribute("aria-checked") === "true");
			expect(checkedRadios).toHaveLength(1);
		},
	);

	it("valida a justificativa sem chamar o backend", async () => {
		const backend = mockRequests();
		const { user } = renderMyAccess("VIEWER");

		await user.click(await screen.findByRole("button", { name: "Enviar pedido" }));
		expect(
			await screen.findByText("Explique por que você precisa deste acesso."),
		).toBeInTheDocument();

		await user.type(screen.getByLabelText("Justificativa (obrigatório)"), "Curta");
		expect(
			await screen.findByText("A justificativa deve ter pelo menos 10 caracteres."),
		).toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	it("mostra a recusa do backend junto do formulário", async () => {
		mockRequests();
		server.use(
			http.post(apiUrl("role-request"), () =>
				HttpResponse.json(
					{ status: 400, error: "Bad Request", message: "Você já tem um pedido pendente." },
					{ status: 400 },
				),
			),
		);
		const { user } = renderMyAccess("VIEWER");

		await submitRequest(user, "Assistente administrativo", "Preciso marcar reservas.");

		expect(await screen.findByRole("alert")).toHaveTextContent("Você já tem um pedido pendente.");
		expect(screen.getAllByText("Você já tem um pedido pendente.")).toHaveLength(1);
	});

	it("cancela o pedido pendente e volta a oferecer o formulário", async () => {
		const backend = mockRequests([
			request(3, { reviewNote: undefined }),
			request(2, { status: "REJECTED", reviewNote: "Acesso só para a secretaria." }),
		]);
		const { user } = renderMyAccess("VIEWER");

		const pending = await screen.findByRole("region", { name: "Pedido em análise" });
		expect(pending).toHaveTextContent("desde 28/09/2026 14:30");
		expect(screen.getByRole("cell", { name: "Acesso só para a secretaria." })).toBeInTheDocument();

		await user.click(within(pending).getByRole("button", { name: "Cancelar pedido" }));
		const confirm = await screen.findByRole("alertdialog", {
			name: "Cancelar o pedido de acesso?",
		});
		await user.click(within(confirm).getByRole("button", { name: "Cancelar pedido" }));

		expect(await screen.findByText(ROLE_REQUEST_CANCELLED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "POST", url: apiUrl("role-request/3/cancel") }]);
		expect(await screen.findByRole("button", { name: "Enviar pedido" })).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Cancelado" })).toBeInTheDocument();
	});

	it("mostra o erro do cancelamento dentro da confirmação", async () => {
		mockRequests([request(3)]);
		server.use(
			http.post(apiUrl("role-request/:id/cancel"), () => new HttpResponse(null, { status: 500 })),
		);
		const { user } = renderMyAccess("VIEWER");

		await user.click(await screen.findByRole("button", { name: "Cancelar pedido" }));
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Cancelar pedido" }));

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(
			ROLE_REQUEST_ERROR_MESSAGES.cancel,
		);
	});

	it("coordenação está no maior nível e não vê o formulário", async () => {
		mockRequests();
		renderMyAccess("COORDINATOR");

		expect(await screen.findByText(/Você já está no maior nível da hierarquia/)).toBeVisible();
		expect(screen.queryByRole("button", { name: "Enviar pedido" })).not.toBeInTheDocument();
	});

	it("administrador vê o aviso e o atalho, sem consultar pedidos", async () => {
		renderMyAccess("ADMIN");

		expect(await screen.findByText("Você já tem todas as permissões")).toBeVisible();
		expect(screen.getByRole("link", { name: "Ir para Administração" })).toHaveAttribute(
			"href",
			"/admin",
		);
		expect(screen.queryByText("Histórico de pedidos")).not.toBeInTheDocument();
	});

	it("mostra o erro de carga com opção de tentar novamente", async () => {
		let failures = 1;
		mockRequests();
		server.use(
			http.get(apiUrl("role-request/me"), () => {
				if (failures-- > 0) return new HttpResponse(null, { status: 500 });
				return undefined;
			}),
		);
		const { user } = renderMyAccess("VIEWER");

		expect(await screen.findByText(MY_REQUESTS_LOAD_ERROR)).toBeInTheDocument();
		await user.click(screen.getAllByRole("button", { name: "Tentar novamente" })[0] as HTMLElement);

		await waitFor(() =>
			expect(screen.getByRole("button", { name: "Enviar pedido" })).toBeInTheDocument(),
		);
	});
});
