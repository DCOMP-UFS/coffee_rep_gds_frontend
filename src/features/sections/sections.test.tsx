import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Room } from "@/features/rooms/types";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/api/error-handler";
import { getToken } from "@/lib/auth/token";
import {
	SECTION_REMOVED_MESSAGE,
	SECTION_ROOMS_CHECK_ERROR_MESSAGE,
	SECTION_ROOMS_CHECKING_MESSAGE,
	SECTION_WITH_ROOMS_DESCRIPTION,
	sectionWithRoomsMessage,
} from "./DeleteSectionDialog";
import { SECTION_ERROR_MESSAGES } from "./hooks";
import { SECTION_SAVED_MESSAGE } from "./SectionFormDialog";
import type { Section } from "./types";

const SECTIONS: Section[] = [
	{ id: 3, nome: "Cardiologia", observacoes: "2º andar" },
	{ id: 4, nome: "Pediatria", observacoes: null },
];

const roomsOf = (section: Section | undefined, count: number): Room[] =>
	Array.from({ length: count }, (_, index) => ({
		id: 100 + index,
		nome: `Sala ${index + 1}`,
		ocupada: false,
		setorId: section?.id ?? 0,
		setor: section?.nome ?? "",
	}));

/**
 * Backend em memória: `GET section?unpaged=true` devolve array puro, como o NestJS.
 * `roomCounts` define quantas salas cada setor tem (padrão: nenhuma).
 */
function mockSections(initial: Section[] = SECTIONS, roomCounts: Record<number, number> = {}) {
	let sections = [...initial];
	const calls = { list: 0, unpagedParam: [] as (string | null)[] };

	server.use(
		http.get(apiUrl("section"), ({ request }) => {
			calls.list++;
			calls.unpagedParam.push(new URL(request.url).searchParams.get("unpaged"));
			return HttpResponse.json(sections);
		}),
		http.get(apiUrl("room/section/:id"), ({ request, params }) => {
			const id = Number(params.id);
			const url = new URL(request.url);
			const rooms = roomsOf(
				sections.find((section) => section.id === id),
				roomCounts[id] ?? 0,
			);
			return HttpResponse.json(
				paged(rooms, Number(url.searchParams.get("page")), Number(url.searchParams.get("size"))),
			);
		}),
	);

	return {
		calls,
		replace: (next: Section[]) => {
			sections = next;
		},
	};
}

const renderSections = () => renderApp("/sections", { authenticated: true });

/** Abre a confirmação de exclusão e espera a verificação de salas liberar o botão. */
async function openDeleteConfirmation(
	user: ReturnType<typeof renderApp>["user"],
	sectionName: string,
) {
	await user.click(await screen.findByRole("button", { name: `Excluir setor ${sectionName}` }));
	const confirm = await screen.findByRole("alertdialog", {
		name: `Excluir o setor “${sectionName}”?`,
	});
	await waitFor(() =>
		expect(within(confirm).getByRole("button", { name: "Excluir" })).toBeEnabled(),
	);
	return confirm;
}

describe("Setores", () => {
	it("lista os setores com o parâmetro unpaged e mostra — sem observação", async () => {
		const { calls } = mockSections();
		renderSections();

		const row = (await screen.findByRole("cell", { name: "Pediatria" })).closest("tr");
		expect(row).not.toBeNull();
		expect(within(row as HTMLElement).getByText("—")).toBeInTheDocument();
		expect(screen.getByText("2º andar")).toBeInTheDocument();
		// Acima e abaixo da tabela.
		expect(screen.getAllByText("2 setores")).toHaveLength(2);
		expect(calls.unpagedParam).toEqual(["true"]);
	});

	it("aceita também a resposta no envelope { content }", async () => {
		server.use(http.get(apiUrl("section"), () => HttpResponse.json({ content: SECTIONS })));
		renderSections();

		expect(await screen.findByRole("cell", { name: "Cardiologia" })).toBeInTheDocument();
	});

	it("cria um setor aparando o nome e enviando observação vazia como null", async () => {
		const backend = mockSections([]);
		let body: unknown;
		server.use(
			http.post(apiUrl("section"), async ({ request }) => {
				body = await request.json();
				backend.replace([{ id: 9, nome: "Pediatria", observacoes: null }]);
				return HttpResponse.json({ id: 9, nome: "Pediatria", observacao: null }, { status: 201 });
			}),
		);

		const { user } = renderSections();
		await screen.findByText("Nenhum setor cadastrado");
		await user.click(screen.getAllByRole("button", { name: "Novo setor" })[0]);

		const dialog = await screen.findByRole("dialog", { name: "Novo setor" });
		await user.type(within(dialog).getByLabelText("Nome do setor (obrigatório)"), "  Pediatria ");
		await user.type(within(dialog).getByLabelText("Observação"), "   ");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(SECTION_SAVED_MESSAGE)).toBeInTheDocument();
		expect(body).toEqual({ nome: "Pediatria", observacao: null });
		expect(await screen.findByRole("cell", { name: "Pediatria" })).toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("edita um setor lendo observacoes e gravando observacao", async () => {
		mockSections();
		let request: { url: string; body: unknown } | undefined;
		server.use(
			http.put(apiUrl("section/:id"), async ({ request: req }) => {
				request = { url: req.url, body: await req.json() };
				return HttpResponse.json({ id: 3, nome: "Cardiologia Adulto", observacao: "2º andar" });
			}),
		);

		const { user } = renderSections();
		await user.click(await screen.findByRole("button", { name: "Editar setor Cardiologia" }));

		const dialog = await screen.findByRole("dialog", { name: "Editar setor" });
		const nameInput = within(dialog).getByLabelText("Nome do setor (obrigatório)");
		expect(within(dialog).getByLabelText("Observação")).toHaveValue("2º andar");
		await user.clear(nameInput);
		await user.type(nameInput, "Cardiologia Adulto");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		await screen.findByText(SECTION_SAVED_MESSAGE);
		expect(request).toEqual({
			url: apiUrl("section/3"),
			body: { nome: "Cardiologia Adulto", observacao: "2º andar" },
		});
	});

	it("exige o nome sem chamar o backend", async () => {
		mockSections();
		const { user } = renderSections();

		await user.click(await screen.findByRole("button", { name: "Novo setor" }));
		const dialog = await screen.findByRole("dialog", { name: "Novo setor" });
		await user.type(within(dialog).getByLabelText("Nome do setor (obrigatório)"), "   ");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByText("Informe o nome.")).toBeInTheDocument();
	});

	it("exclui após confirmação", async () => {
		const backend = mockSections();
		let deletedUrl: string | undefined;
		server.use(
			http.delete(apiUrl("section/:id"), ({ request }) => {
				deletedUrl = request.url;
				backend.replace(SECTIONS.filter((section) => section.id !== 4));
				return new HttpResponse(null, { status: 204 });
			}),
		);

		const { user } = renderSections();
		const confirm = await openDeleteConfirmation(user, "Pediatria");
		expect(within(confirm).getByText("Essa ação será irreversível.")).toBeInTheDocument();
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await screen.findByText(SECTION_REMOVED_MESSAGE)).toBeInTheDocument();
		expect(deletedUrl).toBe(apiUrl("section/4"));
		await waitFor(() =>
			expect(screen.queryByRole("cell", { name: "Pediatria" })).not.toBeInTheDocument(),
		);
	});

	it("mostra a mensagem do backend quando a exclusão falha e mantém a confirmação aberta", async () => {
		mockSections();
		server.use(
			http.delete(apiUrl("section/:id"), () =>
				HttpResponse.json(
					{ status: 409, error: "Conflict", message: "Existem salas vinculadas a este setor." },
					{ status: 409 },
				),
			),
		);

		const { user } = renderSections();
		const confirm = await openDeleteConfirmation(user, "Pediatria");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(
			"Existem salas vinculadas a este setor.",
		);
		expect(screen.getAllByText("Existem salas vinculadas a este setor.")).toHaveLength(1);
		expect(screen.getByRole("alertdialog")).toBeInTheDocument();
	});

	it("não mostra o erro da exclusão anterior ao abrir uma nova confirmação", async () => {
		mockSections();
		server.use(
			http.delete(apiUrl("section/:id"), () =>
				HttpResponse.json({ message: "Existem salas vinculadas a este setor." }, { status: 409 }),
			),
		);

		const { user } = renderSections();
		const confirm = await openDeleteConfirmation(user, "Pediatria");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));
		await within(confirm).findByRole("alert");
		await user.click(within(confirm).getByRole("button", { name: "Cancelar" }));
		await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

		const next = await openDeleteConfirmation(user, "Cardiologia");
		expect(within(next).queryByRole("alert")).not.toBeInTheDocument();
	});

	it("não exclui setor com salas e leva às salas dele já filtradas", async () => {
		mockSections(SECTIONS, { 4: 3 });
		const deleteRequests: string[] = [];
		server.use(
			http.delete(apiUrl("section/:id"), ({ request }) => {
				deleteRequests.push(request.url);
				return new HttpResponse(null, { status: 204 });
			}),
			http.get(apiUrl("room"), () => HttpResponse.json(paged([], 0, 1))),
		);

		const { user, location } = renderSections();
		await user.click(await screen.findByRole("button", { name: "Excluir setor Pediatria" }));
		const confirm = await screen.findByRole("alertdialog", {
			name: "Excluir o setor “Pediatria”?",
		});

		expect(await within(confirm).findByText(sectionWithRoomsMessage(3))).toBeInTheDocument();
		expect(within(confirm).getByText(SECTION_WITH_ROOMS_DESCRIPTION)).toBeInTheDocument();
		expect(within(confirm).getByRole("button", { name: "Excluir" })).toBeDisabled();

		await user.click(within(confirm).getByRole("link", { name: "Ver salas do setor" }));

		await waitFor(() => expect(location()).toBe("/rooms?setor=4"));
		expect(await screen.findByRole("cell", { name: "Sala 1" })).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "Setor" })).toHaveTextContent("Pediatria");
		expect(deleteRequests).toEqual([]);
	});

	it("bloqueia a exclusão enquanto verifica as salas do setor", async () => {
		mockSections();
		let releaseCount: () => void = () => {};
		server.use(
			http.get(apiUrl("room/section/:id"), async () => {
				await new Promise<void>((resolve) => {
					releaseCount = resolve;
				});
				return HttpResponse.json(paged([], 0, 1));
			}),
		);

		const { user } = renderSections();
		await user.click(await screen.findByRole("button", { name: "Excluir setor Pediatria" }));
		const confirm = await screen.findByRole("alertdialog");

		expect(await within(confirm).findByText(SECTION_ROOMS_CHECKING_MESSAGE)).toBeInTheDocument();
		expect(within(confirm).getByRole("button", { name: "Excluir" })).toBeDisabled();

		releaseCount();
		await waitFor(() =>
			expect(within(confirm).getByRole("button", { name: "Excluir" })).toBeEnabled(),
		);
		expect(within(confirm).queryByText(SECTION_ROOMS_CHECKING_MESSAGE)).not.toBeInTheDocument();
	});

	it("avisa quando não consegue verificar as salas e permite tentar de novo", async () => {
		mockSections();
		let failures = 1;
		server.use(
			http.get(apiUrl("room/section/:id"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return HttpResponse.json(paged([], 0, 1));
			}),
		);

		const { user } = renderSections();
		await user.click(await screen.findByRole("button", { name: "Excluir setor Pediatria" }));
		const confirm = await screen.findByRole("alertdialog");

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(
			SECTION_ROOMS_CHECK_ERROR_MESSAGE,
		);
		expect(screen.getAllByText(SECTION_ROOMS_CHECK_ERROR_MESSAGE)).toHaveLength(1);
		expect(within(confirm).getByRole("button", { name: "Excluir" })).toBeDisabled();

		await user.click(within(confirm).getByRole("button", { name: "Tentar novamente" }));

		await waitFor(() =>
			expect(within(confirm).getByRole("button", { name: "Excluir" })).toBeEnabled(),
		);
		expect(within(confirm).queryByRole("alert")).not.toBeInTheDocument();
	});

	it("mostra o erro ao salvar dentro do formulário, que continua aberto", async () => {
		mockSections();
		server.use(http.post(apiUrl("section"), () => new HttpResponse(null, { status: 500 })));

		const { user } = renderSections();
		await user.click(await screen.findByRole("button", { name: "Novo setor" }));
		const dialog = await screen.findByRole("dialog", { name: "Novo setor" });
		const nameInput = within(dialog).getByLabelText("Nome do setor (obrigatório)");
		await user.type(nameInput, "Ortopedia");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(SECTION_ERROR_MESSAGES.save);
		expect(screen.getAllByText(SECTION_ERROR_MESSAGES.save)).toHaveLength(1);
		expect(nameInput).toHaveValue("Ortopedia");

		await user.type(nameInput, "!");
		expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
	});

	it("mostra erro com opção de tentar novamente", async () => {
		let attempts = 0;
		server.use(
			http.get(apiUrl("section"), () => {
				attempts++;
				return attempts === 1
					? HttpResponse.json({ status: 500, error: "Internal Server Error" }, { status: 500 })
					: HttpResponse.json(SECTIONS);
			}),
		);

		const { user } = renderSections();
		await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));

		expect(await screen.findByRole("cell", { name: "Cardiologia" })).toBeInTheDocument();
	});

	it("leva ao login com a mensagem do backend quando a sessão expira (401)", async () => {
		server.use(
			http.get(apiUrl("section"), () =>
				HttpResponse.json(
					{
						status: 401,
						error: "Unauthorized",
						message: "Credenciais ausentes ou inválidas.",
						path: "/api/section",
					},
					{ status: 401 },
				),
			),
		);

		const { location } = renderSections();

		expect(await screen.findByText("Credenciais ausentes ou inválidas.")).toBeInTheDocument();
		await waitFor(() => expect(location()).toBe("/login"));
		expect(getToken()).toBeNull();
	});

	it("usa a mensagem de sessão expirada quando o 401 vem sem corpo", async () => {
		server.use(http.get(apiUrl("section"), () => new HttpResponse(null, { status: 401 })));

		const { location } = renderSections();

		expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(location()).toBe("/login"));
	});
});
