import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { REQUESTER_ERROR_MESSAGES } from "./hooks";
import { REQUESTER_SAVED_MESSAGE } from "./RequesterFormDialog";
import { REQUESTER_DELETED_MESSAGE } from "./RequestersPage";
import { PHONE_MESSAGE } from "./schemas";
import type { Requester } from "./types";

const pad = (id: number) => String(id).padStart(2, "0");

/** Telefones variados: celular, fixo e sem telefone nos três primeiros. */
const contactFor = (id: number) => {
	if (id === 1) return "79999887766";
	if (id === 2) return "7933334444";
	if (id === 3) return undefined;
	return `799990000${pad(id)}`;
};

const requester = (id: number): Requester => ({
	id,
	nome: `Profissional ${pad(id)}`,
	especialidade: id <= 6 ? "Cardiologia" : "Pediatria",
	contato: contactFor(id),
});

const REQUESTERS = Array.from({ length: 12 }, (_, index) => requester(index + 1));

interface ListRequest {
	size: string | null;
	page: string | null;
	busca: string | null;
}

/** Backend em memória com a paginação e a busca do NestJS (nome, especialidade ou telefone). */
function mockBackend(initial: Requester[] = REQUESTERS) {
	let requesters = [...initial];
	const listRequests: ListRequest[] = [];
	const writes: { method: string; url: string; body?: unknown }[] = [];

	const matches = (item: Requester, term: string) => {
		const text = term.toLowerCase();
		const digits = term.replace(/\D/g, "");
		return (
			item.nome.toLowerCase().includes(text) ||
			(item.especialidade ?? "").toLowerCase().includes(text) ||
			(digits !== "" && (item.contato ?? "").includes(digits))
		);
	};

	server.use(
		http.get(apiUrl("requester"), ({ request }) => {
			const url = new URL(request.url);
			const busca = url.searchParams.get("busca");
			const size = Number(url.searchParams.get("size"));
			const page = Number(url.searchParams.get("page"));
			listRequests.push({
				size: url.searchParams.get("size"),
				page: url.searchParams.get("page"),
				busca,
			});
			const filtered = busca ? requesters.filter((item) => matches(item, busca)) : requesters;
			return HttpResponse.json(paged(filtered, page, size));
		}),
		http.post(apiUrl("requester"), async ({ request }) => {
			const body = (await request.json()) as Record<string, string | null>;
			writes.push({ method: "POST", url: request.url, body });
			return HttpResponse.json({ id: 100, ...body }, { status: 201 });
		}),
		http.put(apiUrl("requester/:id"), async ({ request }) => {
			const body = (await request.json()) as Record<string, string | null>;
			writes.push({ method: "PUT", url: request.url, body });
			return HttpResponse.json({ id: 1, ...body });
		}),
		http.delete(apiUrl("requester/:id"), ({ request, params }) => {
			writes.push({ method: "DELETE", url: request.url });
			requesters = requesters.filter((item) => item.id !== Number(params.id));
			return new HttpResponse(null, { status: 204 });
		}),
	);

	return { listRequests, writes, lastList: () => listRequests.at(-1) };
}

const renderRequesters = () => renderApp("/requester", { authenticated: true });

const rowOf = (name: string) => screen.getByRole("cell", { name }).closest("tr") as HTMLElement;

describe("Solicitantes", () => {
	it("carrega a primeira página com 5 itens, sem o parâmetro busca", async () => {
		const backend = mockBackend();
		renderRequesters();

		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
		expect(screen.getAllByRole("row")).toHaveLength(6);
		expect(backend.listRequests).toEqual([{ size: "5", page: "0", busca: null }]);
		expect(screen.getByText(/Mostrando/)).toHaveTextContent("Mostrando 1–5 de 12");
	});

	it("formata o telefone e mostra — quando não há telefone", async () => {
		mockBackend();
		renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		expect(within(rowOf("Profissional 01")).getByText("(79) 99988-7766")).toBeInTheDocument();
		expect(within(rowOf("Profissional 02")).getByText("(79) 3333-4444")).toBeInTheDocument();
		expect(within(rowOf("Profissional 03")).getByText("—")).toBeInTheDocument();
		expect(within(rowOf("Profissional 01")).getByText("Cardiologia")).toBeInTheDocument();
	});

	it("busca ao enviar e mostra a opção de limpar", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "  pediatria {Enter}");

		await waitFor(() =>
			expect(backend.lastList()).toEqual({ size: "5", page: "0", busca: "pediatria" }),
		);
		expect(await screen.findByRole("cell", { name: "Profissional 07" })).toBeInTheDocument();
		expect(screen.queryByRole("cell", { name: "Profissional 01" })).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Limpar busca" }));
		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
		expect(screen.getByLabelText("Buscar solicitante")).toHaveValue("");
		expect(screen.queryByRole("button", { name: "Limpar busca" })).not.toBeInTheDocument();
	});

	// Regressão: no Angular, trocar de página aplicava o termo digitado e ainda não enviado.
	it("ignora o termo ainda não enviado ao paginar", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "Pediatria");
		await user.click(screen.getByRole("button", { name: "Próxima página" }));

		await waitFor(() => expect(backend.lastList()).toEqual({ size: "5", page: "1", busca: null }));
		expect(await screen.findByRole("cell", { name: "Profissional 06" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Buscar" }));
		await waitFor(() =>
			expect(backend.lastList()).toEqual({ size: "5", page: "0", busca: "Pediatria" }),
		);
	});

	it("mostra Buscando… enquanto a busca carrega, mantendo a lista anterior", async () => {
		mockBackend();
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		server.use(
			http.get(apiUrl("requester"), async () => {
				await gate;
				return undefined;
			}),
		);
		await user.type(screen.getByLabelText("Buscar solicitante"), "Pediatria{Enter}");

		expect(await screen.findByRole("button", { name: "Buscando…" })).toBeDisabled();
		expect(screen.getByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();

		release();
		expect(await screen.findByRole("button", { name: "Buscar" })).toBeEnabled();
		expect(await screen.findByRole("cell", { name: "Profissional 07" })).toBeInTheDocument();
	});

	it("busca por telefone", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "3333{Enter}");

		expect(await screen.findByRole("cell", { name: "Profissional 02" })).toBeInTheDocument();
		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
		expect(backend.lastList()?.busca).toBe("3333");
	});

	it("cadastra com valores aparados, telefone só com dígitos e aviso de sucesso", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.click(screen.getByRole("button", { name: "Novo solicitante" }));
		const dialog = await screen.findByRole("dialog", { name: "Novo solicitante" });
		await user.type(within(dialog).getByLabelText("Nome (obrigatório)"), "  Ana Souza ");
		await user.type(within(dialog).getByLabelText("Telefone"), "79999887766");
		expect(within(dialog).getByLabelText("Telefone")).toHaveValue("(79) 99988-7766");
		await user.type(within(dialog).getByLabelText("Especialidade (obrigatório)"), " Cardiologia ");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(REQUESTER_SAVED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([
			{
				method: "POST",
				url: apiUrl("requester"),
				body: { nome: "Ana Souza", telefone: "79999887766", especialidade: "Cardiologia" },
			},
		]);
		await waitFor(() =>
			expect(screen.queryByRole("dialog", { name: "Novo solicitante" })).not.toBeInTheDocument(),
		);
	});

	it("envia telefone null quando o campo fica vazio", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.click(screen.getByRole("button", { name: "Novo solicitante" }));
		const dialog = await screen.findByRole("dialog", { name: "Novo solicitante" });
		await user.type(within(dialog).getByLabelText("Nome (obrigatório)"), "Ana");
		await user.type(within(dialog).getByLabelText("Especialidade (obrigatório)"), "Pediatria");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		await screen.findByText(REQUESTER_SAVED_MESSAGE);
		expect(backend.writes[0]?.body).toEqual({
			nome: "Ana",
			telefone: null,
			especialidade: "Pediatria",
		});
	});

	// Regressão: no Angular, o ícone de editar não era botão (inacessível pelo teclado), o
	// título do diálogo não mudava e salvar não dava aviso de sucesso.
	it("edita pelo teclado, com o formulário preenchido, via PUT", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();

		const editButton = await screen.findByRole("button", {
			name: "Editar solicitante Profissional 01",
		});
		editButton.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "Editar solicitante" });
		expect(within(dialog).getByLabelText("Nome (obrigatório)")).toHaveValue("Profissional 01");
		expect(within(dialog).getByLabelText("Telefone")).toHaveValue("(79) 99988-7766");
		expect(within(dialog).getByLabelText("Especialidade (obrigatório)")).toHaveValue("Cardiologia");

		const phone = within(dialog).getByLabelText("Telefone");
		await user.clear(phone);
		await user.type(phone, "7933334444");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await screen.findByText(REQUESTER_SAVED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([
			{
				method: "PUT",
				url: apiUrl("requester/1"),
				body: { nome: "Profissional 01", telefone: "7933334444", especialidade: "Cardiologia" },
			},
		]);
	});

	it("valida campos obrigatórios e telefone incompleto sem chamar o backend", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.click(screen.getByRole("button", { name: "Novo solicitante" }));
		const dialog = await screen.findByRole("dialog", { name: "Novo solicitante" });
		await user.type(within(dialog).getByLabelText("Nome (obrigatório)"), "   ");
		await user.type(within(dialog).getByLabelText("Telefone"), "7999");
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByText("Informe o nome.")).toBeInTheDocument();
		expect(within(dialog).getByText("Informe a especialidade.")).toBeInTheDocument();
		expect(within(dialog).getByText(PHONE_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	it("mostra o erro ao salvar dentro do formulário, que continua aberto", async () => {
		const backend = mockBackend();
		server.use(
			http.put(apiUrl("requester/:id"), () =>
				HttpResponse.json({ message: "Solicitante não encontrado!" }, { status: 404 }),
			),
		);
		const { user } = renderRequesters();

		await user.click(
			await screen.findByRole("button", { name: "Editar solicitante Profissional 01" }),
		);
		const dialog = await screen.findByRole("dialog", { name: "Editar solicitante" });
		await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Solicitante não encontrado!",
		);
		expect(screen.queryByText(REQUESTER_SAVED_MESSAGE)).not.toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});

	it("exclui após confirmação", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();

		await user.click(
			await screen.findByRole("button", { name: "Excluir solicitante Profissional 02" }),
		);
		const confirm = await screen.findByRole("alertdialog", {
			name: "Excluir o solicitante “Profissional 02”?",
		});
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await screen.findByText(REQUESTER_DELETED_MESSAGE)).toBeInTheDocument();
		expect(backend.writes).toEqual([{ method: "DELETE", url: apiUrl("requester/2") }]);
		await waitFor(() =>
			expect(screen.queryByRole("cell", { name: "Profissional 02" })).not.toBeInTheDocument(),
		);
	});

	// Regressão: no Angular, cancelar a exclusão gerava um erro de execução.
	it("não faz nada ao cancelar a exclusão", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();

		await user.click(
			await screen.findByRole("button", { name: "Excluir solicitante Profissional 02" }),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Cancelar" }));

		await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
		expect(backend.writes).toEqual([]);
		expect(screen.getByRole("cell", { name: "Profissional 02" })).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	// Regressão: no Angular, a falha na exclusão aparecia num aviso com estilo de sucesso.
	it("mostra o erro da exclusão dentro da confirmação, com o fallback da operação", async () => {
		mockBackend();
		server.use(http.delete(apiUrl("requester/:id"), () => new HttpResponse(null, { status: 500 })));
		const { user } = renderRequesters();

		await user.click(
			await screen.findByRole("button", { name: "Excluir solicitante Profissional 02" }),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await within(confirm).findByRole("alert")).toHaveTextContent(
			REQUESTER_ERROR_MESSAGES.remove,
		);
		expect(screen.getAllByText(REQUESTER_ERROR_MESSAGES.remove)).toHaveLength(1);
		expect(screen.queryByText(REQUESTER_DELETED_MESSAGE)).not.toBeInTheDocument();
	});

	// Regressão: no Angular, excluir o último item da última página deixava a tela vazia.
	it("volta para a página anterior ao excluir o último item da última página", async () => {
		const backend = mockBackend(REQUESTERS.slice(0, 11));
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.click(screen.getByRole("button", { name: "Última página" }));
		await user.click(
			await screen.findByRole("button", { name: "Excluir solicitante Profissional 11" }),
		);
		const confirm = await screen.findByRole("alertdialog");
		await user.click(within(confirm).getByRole("button", { name: "Excluir" }));

		expect(await screen.findByRole("cell", { name: "Profissional 10" })).toBeInTheDocument();
		expect(backend.lastList()).toMatchObject({ page: "1" });
		expect(screen.queryByText("Nenhum solicitante cadastrado")).not.toBeInTheDocument();
	});

	it("mostra o estado vazio com ação de cadastro", async () => {
		mockBackend([]);
		renderRequesters();

		expect(await screen.findByText("Nenhum solicitante cadastrado")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Novo solicitante" })).toHaveLength(2);
	});

	it("distingue a busca sem resultado e permite limpar a busca", async () => {
		mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "Neurologia{Enter}");

		expect(await screen.findByText("Nenhum solicitante encontrado")).toBeInTheDocument();
		expect(screen.queryByText("Nenhum solicitante cadastrado")).not.toBeInTheDocument();

		await user.click(screen.getAllByRole("button", { name: "Limpar busca" })[0] as HTMLElement);
		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
	});

	it("mostra erro com opção de tentar novamente", async () => {
		const backend = mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("requester"), () => {
				if (failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderRequesters();

		await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));

		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
		expect(backend.listRequests).toHaveLength(1);
	});
});
