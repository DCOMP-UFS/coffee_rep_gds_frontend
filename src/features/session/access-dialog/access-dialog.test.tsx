import { getLockedButton, mockMyRoleRequests, openAccessDialog } from "@test/access";
import { roleRequest } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Role } from "../types";
import {
	CHECKING_REQUESTS_MESSAGE,
	REQUEST_ACCESS_LABEL,
	VIEW_MY_REQUEST_LABEL,
} from "./AccessExplanation";

/** Setores exige Coordenação: serve de tela para abrir a explicação a partir de "Novo setor". */
async function openFromSections(role: Role = "VIEWER") {
	server.use(
		http.get(apiUrl("section"), () =>
			HttpResponse.json([{ id: 3, nome: "Cardiologia", observacoes: null }]),
		),
	);
	const app = renderApp("/sections", { authenticated: true, role });
	await screen.findByRole("cell", { name: "Cardiologia" });
	const dialog = await openAccessDialog(app.user, getLockedButton(/^Novo setor \(/));
	return { ...app, dialog };
}

describe("explicação de acesso", () => {
	beforeAll(async () => {
		await Promise.all([
			import("@/features/sections/SectionsPage"),
			import("@/features/my-access/MyAccessPage"),
		]);
	});

	it("compara os perfis e ensina a pedir acesso", async () => {
		mockMyRoleRequests();
		const { dialog } = await openFromSections("ASSISTANT");

		expect(dialog).toHaveTextContent(
			"Cadastrar, editar e excluir setores exige o perfil Coordenação ou superior.",
		);
		expect(dialog).toHaveTextContent("Seu perfilAssistente administrativo");
		expect(dialog).toHaveTextContent("Perfil necessárioCoordenação ou superior");

		const guide = await within(dialog).findByRole("region", { name: "Como pedir acesso" });
		const steps = within(guide).getAllByRole("listitem");
		expect(steps).toHaveLength(4);
		expect(steps[1]).toHaveTextContent("Escolha o perfil Coordenação, que já vem marcado.");
		expect(within(dialog).getByRole("link", { name: REQUEST_ACCESS_LABEL })).toHaveAttribute(
			"href",
			"/meu-acesso?perfil=COORDINATOR",
		);
	});

	it("mostra que está verificando os pedidos enquanto eles carregam", async () => {
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		server.use(
			http.get(apiUrl("role-request/me"), async () => {
				await gate;
				return HttpResponse.json([]);
			}),
		);
		const { dialog } = await openFromSections();

		expect(within(dialog).getByRole("status")).toHaveTextContent(CHECKING_REQUESTS_MESSAGE);
		expect(within(dialog).queryByRole("region", { name: "Como pedir acesso" })).toBeNull();

		release();

		expect(
			await within(dialog).findByRole("region", { name: "Como pedir acesso" }),
		).toBeInTheDocument();
		expect(within(dialog).queryByText(CHECKING_REQUESTS_MESSAGE)).not.toBeInTheDocument();
	});

	it("com um pedido pendente que cobre a funcionalidade, avisa e leva ao pedido", async () => {
		mockMyRoleRequests([roleRequest(5, { requestedRole: "COORDINATOR" })]);
		const { dialog } = await openFromSections();

		expect(
			await within(dialog).findByText(/Você já tem um pedido em análise para/),
		).toHaveTextContent(
			"Você já tem um pedido em análise para Coordenação. Quando o administrador aprovar, você poderá usar esta funcionalidade.",
		);
		expect(within(dialog).queryByRole("region", { name: "Como pedir acesso" })).toBeNull();
		expect(within(dialog).getByRole("link", { name: VIEW_MY_REQUEST_LABEL })).toHaveAttribute(
			"href",
			"/meu-acesso",
		);
	});

	it("com um pedido pendente abaixo do necessário, explica que ele não basta", async () => {
		mockMyRoleRequests([
			roleRequest(6, { requestedRole: "ASSISTANT" }),
			roleRequest(4, { requestedRole: "COORDINATOR", status: "REJECTED" }),
		]);
		const { dialog } = await openFromSections();

		expect(
			await within(dialog).findByText(/Você já tem um pedido em análise para/),
		).toHaveTextContent(
			"Ele não inclui esta funcionalidade, que exige Coordenação ou superior. Em Meu acesso, você pode cancelar o pedido atual e fazer um novo.",
		);
	});

	it("se os pedidos não carregam, mostra o passo a passo com um aviso", async () => {
		server.use(http.get(apiUrl("role-request/me"), () => new HttpResponse(null, { status: 500 })));
		const { dialog } = await openFromSections();

		const guide = await within(dialog).findByRole("region", { name: "Como pedir acesso" });
		expect(guide).toHaveTextContent(
			"Não foi possível verificar se você já tem um pedido em análise.",
		);
		expect(within(dialog).getByRole("link", { name: REQUEST_ACCESS_LABEL })).toBeInTheDocument();
	});

	it("Pedir acesso fecha o modal e abre Meu acesso com o perfil necessário marcado", async () => {
		mockMyRoleRequests();
		const { dialog, user, location } = await openFromSections();

		await user.click(await within(dialog).findByRole("link", { name: REQUEST_ACCESS_LABEL }));

		expect(await screen.findByRole("heading", { level: 1, name: "Meu acesso" })).toBeVisible();
		expect(location()).toBe("/meu-acesso?perfil=COORDINATOR");
		await waitFor(() => expect(dialog).not.toBeInTheDocument());
		expect(await screen.findByRole("radio", { name: /^Coordenação/ })).toBeChecked();
		expect(screen.getByRole("radio", { name: /^Assistente administrativo/ })).not.toBeChecked();
	});
});
