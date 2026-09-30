import {
	getLockedButton,
	getLockedButtons,
	mockMyRoleRequests,
	openAccessDialog,
} from "@test/access";
import { paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { REQUESTER_ERROR_MESSAGES } from "./hooks";
import { REQUESTER_SAVED_MESSAGE } from "./RequesterFormDialog";
import { REQUESTER_DELETED_MESSAGE, SPECIALTIES_LOAD_ERROR_MESSAGE } from "./RequestersPage";
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
	/** Ausentes quando não enviados, para não pesarem nas comparações com `toEqual`. */
	especialidade?: string;
	sort?: string;
}

const isUnpaged = (request: Request) => new URL(request.url).searchParams.get("unpaged") === "true";

/**
 * Backend em memória com a paginação, a busca (nome, especialidade ou telefone), o filtro de
 * especialidade e a ordenação do NestJS. A lista completa (`unpaged=true`), que alimenta o
 * select de especialidades, não entra em `listRequests`.
 */
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
			if (isUnpaged(request)) return HttpResponse.json(requesters);

			const url = new URL(request.url);
			const busca = url.searchParams.get("busca");
			const especialidade = url.searchParams.get("especialidade") ?? undefined;
			const sort = url.searchParams.get("sort") ?? undefined;
			const size = Number(url.searchParams.get("size"));
			const page = Number(url.searchParams.get("page"));
			listRequests.push({
				size: url.searchParams.get("size"),
				page: url.searchParams.get("page"),
				busca,
				especialidade,
				sort,
			});
			const filtered = requesters.filter(
				(item) =>
					(!busca || matches(item, busca)) &&
					(!especialidade ||
						(item.especialidade ?? "").toLowerCase() === especialidade.toLowerCase()),
			);
			if (sort) {
				const [field, direction] = sort.split(",") as ["nome" | "especialidade", string];
				const sign = direction === "desc" ? -1 : 1;
				filtered.sort(
					(a, b) => sign * (a[field] ?? "").localeCompare(b[field] ?? "") || sign * (a.id - b.id),
				);
			}
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
		// Acima e abaixo da tabela, como no Angular.
		expect(screen.getAllByText(/Mostrando/).map((summary) => summary.textContent)).toEqual([
			"Mostrando 1–5 de 12",
			"Mostrando 1–5 de 12",
		]);
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

	it("busca depois da digitação, sem espaços nas pontas, e limpa pelo Limpar filtros", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();

		await user.type(screen.getByLabelText("Buscar solicitante"), "  pediatria ");

		await waitFor(() =>
			expect(backend.lastList()).toEqual({ size: "5", page: "0", busca: "pediatria" }),
		);
		expect(await screen.findByRole("cell", { name: "Profissional 07" })).toBeInTheDocument();
		expect(screen.queryByRole("cell", { name: "Profissional 01" })).not.toBeInTheDocument();
		expect(backend.listRequests.filter((request) => request.busca !== null)).toHaveLength(1);

		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
		expect(screen.getByLabelText("Buscar solicitante")).toHaveValue("");
		expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
	});

	// Regressão: no Angular, trocar de página aplicava um termo que não estava valendo.
	it("mantém a busca aplicada ao paginar e volta à primeira página quando ela muda", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "Profissional");
		await waitFor(() => expect(backend.lastList()?.busca).toBe("Profissional"));
		await user.click(screen.getByRole("button", { name: "Próxima página" }));

		await waitFor(() =>
			expect(backend.lastList()).toEqual({ size: "5", page: "1", busca: "Profissional" }),
		);
		expect(await screen.findByRole("cell", { name: "Profissional 06" })).toBeInTheDocument();

		await user.type(screen.getByLabelText("Buscar solicitante"), " 1");
		await waitFor(() =>
			expect(backend.lastList()).toEqual({ size: "5", page: "0", busca: "Profissional 1" }),
		);
	});

	it("mostra Buscando… enquanto a busca espera e carrega, mantendo a lista anterior", async () => {
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
		await user.type(screen.getByLabelText("Buscar solicitante"), "Pediatria");

		expect(await screen.findByText("Buscando…")).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(screen.getByText("Buscando…")).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();

		release();
		expect(await screen.findByRole("cell", { name: "Profissional 07" })).toBeInTheDocument();
		await waitFor(() => expect(screen.queryByText("Buscando…")).not.toBeInTheDocument());
	});

	it("busca por telefone", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "3333");

		expect(await screen.findByRole("cell", { name: "Profissional 02" })).toBeInTheDocument();
		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
		expect(backend.lastList()?.busca).toBe("3333");
	});

	it("filtra por especialidade com as opções tiradas dos solicitantes ativos", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		const select = screen.getByRole("combobox", { name: "Especialidade" });
		await waitFor(() => expect(select).toBeEnabled());
		expect(select).toHaveTextContent("Todas");
		await user.click(select);
		expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
			"Selecione a especialidade",
			"Todas",
			"Cardiologia",
			"Pediatria",
		]);
		await user.click(screen.getByRole("option", { name: "Pediatria" }));

		await waitFor(() =>
			expect(backend.lastList()).toEqual({
				size: "5",
				page: "0",
				busca: null,
				especialidade: "Pediatria",
			}),
		);
		expect(await screen.findByRole("cell", { name: "Profissional 07" })).toBeInTheDocument();
		expect(screen.queryByRole("cell", { name: "Profissional 01" })).not.toBeInTheDocument();
	});

	it("avisa quando as especialidades não carregam e permite tentar de novo", async () => {
		mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("requester"), ({ request }) => {
				if (isUnpaged(request) && failures > 0) {
					failures--;
					return new HttpResponse(null, { status: 500 });
				}
				return undefined;
			}),
		);
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		const select = screen.getByRole("combobox", { name: "Especialidade" });
		expect(await screen.findByText(SPECIALTIES_LOAD_ERROR_MESSAGE)).toBeInTheDocument();
		expect(select).toBeDisabled();

		await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

		await waitFor(() => expect(select).toBeEnabled());
		expect(screen.queryByText(SPECIALTIES_LOAD_ERROR_MESSAGE)).not.toBeInTheDocument();
	});

	it("ordena enviando sort e restaura tudo ao limpar os filtros", async () => {
		const backend = mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.click(screen.getByRole("combobox", { name: "Ordenar por" }));
		await user.click(await screen.findByRole("option", { name: "Nome Z–A" }));

		await waitFor(() =>
			expect(backend.lastList()).toEqual({ size: "5", page: "0", busca: null, sort: "nome,desc" }),
		);
		expect(await screen.findByRole("cell", { name: "Profissional 12" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
		expect(screen.getByRole("combobox", { name: "Ordenar por" })).toHaveTextContent(
			"Mais recentes",
		);
		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
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

	it("distingue a busca sem resultado e permite limpar pelo estado vazio", async () => {
		mockBackend();
		const { user } = renderRequesters();
		await screen.findByRole("cell", { name: "Profissional 01" });

		await user.type(screen.getByLabelText("Buscar solicitante"), "Neurologia");

		expect(await screen.findByText("Nenhum solicitante encontrado")).toBeInTheDocument();
		expect(screen.queryByText("Nenhum solicitante cadastrado")).not.toBeInTheDocument();

		const [, emptyStateClear] = screen.getAllByRole("button", { name: "Limpar filtros" });
		await user.click(emptyStateClear as HTMLElement);
		expect(await screen.findByRole("cell", { name: "Profissional 01" })).toBeInTheDocument();
	});

	it("mostra erro com opção de tentar novamente", async () => {
		const backend = mockBackend();
		let failures = 1;
		server.use(
			http.get(apiUrl("requester"), ({ request }) => {
				if (!isUnpaged(request) && failures > 0) {
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

	it("visualizador vê as ações de cadastro bloqueadas e a explicação, sem gravar nada", async () => {
		const backend = mockBackend();
		mockMyRoleRequests();
		const { user } = renderApp("/requester", { authenticated: true, role: "VIEWER" });
		await screen.findByRole("cell", { name: "Profissional 01" });

		expect(
			getLockedButtons(/^Editar solicitante .* \(disponível a partir de Coordenação\)$/).length,
		).toBeGreaterThan(0);
		expect(getLockedButtons(/^Excluir solicitante /).length).toBeGreaterThan(0);

		const dialog = await openAccessDialog(user, getLockedButton(/^Novo solicitante \(/));

		expect(dialog).toHaveTextContent(
			"Cadastrar, editar e excluir solicitantes exige o perfil Coordenação ou superior.",
		);
		expect(screen.queryByRole("dialog", { name: /solicitante/i })).not.toBeInTheDocument();
		expect(backend.writes).toEqual([]);
	});
});
