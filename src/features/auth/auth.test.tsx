import { currentUser, paged } from "@test/msw/fixtures";
import { apiUrl, server } from "@test/msw/server";
import { renderApp } from "@test/render-app";
import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { getToken, setToken } from "@/lib/auth/token";
import { LOGIN_ERROR_MESSAGE, SIGN_UP_SUCCESS_MESSAGE } from "./LoginPage";
import { SIGN_UP_ACCESS_NOTICE } from "./SignUpPage";

describe("login", () => {
	it("envia CPF só com dígitos, sem token, grava o accessToken e vai para /rooms", async () => {
		let request: { body: unknown; authorization: string | null } | undefined;
		server.use(
			http.post(apiUrl("auth/login"), async ({ request: req }) => {
				request = { body: await req.json(), authorization: req.headers.get("Authorization") };
				return HttpResponse.json({ accessToken: "novo-token", expiresIn: 3600 });
			}),
			http.get(apiUrl("auth/me"), () => HttpResponse.json(currentUser("VIEWER"))),
			// Chamadas da tela de Salas, destino do login.
			http.get(apiUrl("room"), () => HttpResponse.json(paged([], 0, 5))),
			http.get(apiUrl("section"), () => HttpResponse.json([])),
		);

		const { user, location } = renderApp("/login");
		await user.type(screen.getByLabelText("CPF (obrigatório)"), "52998224725");
		await user.type(screen.getByLabelText("Senha (obrigatório)"), "minha senha ");
		await user.click(screen.getByRole("button", { name: "Entrar" }));

		await waitFor(() => expect(location()).toBe("/rooms"));
		expect(await screen.findByRole("heading", { level: 1, name: "Salas" })).toBeInTheDocument();
		expect(request).toEqual({
			body: { cpf: "52998224725", password: "minha senha " },
			authorization: null,
		});
		expect(getToken()).toBe("novo-token");
	});

	const rejectLogin = () =>
		server.use(
			http.post(apiUrl("auth/login"), () =>
				HttpResponse.json(
					{ status: 401, error: "Unauthorized", message: "Credenciais ausentes ou inválidas." },
					{ status: 401 },
				),
			),
		);

	it("mostra sempre a mesma mensagem, junto do formulário, quando o login falha", async () => {
		rejectLogin();

		const { user, location } = renderApp("/login");
		await user.type(screen.getByLabelText("CPF (obrigatório)"), "52998224725");
		await user.type(screen.getByLabelText("Senha (obrigatório)"), "errada");
		await user.click(screen.getByRole("button", { name: "Entrar" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(LOGIN_ERROR_MESSAGE);
		expect(screen.getAllByText(LOGIN_ERROR_MESSAGE)).toHaveLength(1);
		expect(screen.queryByText("Credenciais ausentes ou inválidas.")).not.toBeInTheDocument();
		expect(location()).toBe("/login");
	});

	it("esconde o aviso de credenciais inválidas quando o usuário corrige os dados", async () => {
		rejectLogin();

		const { user } = renderApp("/login");
		await user.type(screen.getByLabelText("CPF (obrigatório)"), "52998224725");
		await user.type(screen.getByLabelText("Senha (obrigatório)"), "errada");
		await user.click(screen.getByRole("button", { name: "Entrar" }));
		await screen.findByRole("alert");

		await user.type(screen.getByLabelText("Senha (obrigatório)"), "1");

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("valida os campos sem chamar o backend", async () => {
		const { user } = renderApp("/login");

		await user.type(screen.getByLabelText("CPF (obrigatório)"), "529982");
		await user.click(screen.getByRole("button", { name: "Entrar" }));

		expect(await screen.findByText("Informe um CPF válido (11 dígitos).")).toBeInTheDocument();
		expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
		expect(screen.getByLabelText("CPF (obrigatório)")).toHaveValue("529.982");
	});

	it("encerra a sessão anterior ao abrir o login", async () => {
		setToken("token-antigo");
		renderApp("/login");

		await waitFor(() => expect(getToken()).toBeNull());
	});
});

describe("cadastro", () => {
	async function fillSignUpForm(user: ReturnType<typeof renderApp>["user"]) {
		await user.type(screen.getByLabelText("Nome (obrigatório)"), "  Maria Souza ");
		await user.type(screen.getByLabelText("Telefone (obrigatório)"), "11987654321");
		await user.type(screen.getByLabelText("Data de nascimento (obrigatório)"), "05031990");
		await user.type(screen.getByLabelText("E-mail (obrigatório)"), "maria@hu.ufs.br");
		await user.type(screen.getByLabelText("CPF (obrigatório)"), "52998224725");
		await user.type(screen.getByLabelText("Senha (obrigatório)"), "segredo");
	}

	it("avisa que a conta começa como Visualizador e mostra os níveis de acesso", () => {
		renderApp("/cadastro");

		expect(screen.getByRole("heading", { name: SIGN_UP_ACCESS_NOTICE })).toBeInTheDocument();
		const levels = within(screen.getByRole("list", { name: "Níveis de acesso" }));
		expect(levels.getAllByRole("listitem")).toHaveLength(3);
		expect(levels.getByText("Visualizador")).toBeInTheDocument();
		expect(levels.getByText("Assistente administrativo")).toBeInTheDocument();
		expect(levels.getByText("Coordenação")).toBeInTheDocument();
	});

	it("envia o corpo no formato do backend e volta ao login", async () => {
		let body: unknown;
		server.use(
			http.post(apiUrl("auth/register"), async ({ request }) => {
				body = await request.json();
				return new HttpResponse(null, { status: 200 });
			}),
		);

		const { user, location } = renderApp("/cadastro");
		await fillSignUpForm(user);
		await user.click(screen.getByRole("button", { name: "Cadastre-se" }));

		expect(await screen.findByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
		expect(screen.getByText(SIGN_UP_SUCCESS_MESSAGE).closest("[role=status]")).not.toBeNull();
		expect(screen.getAllByText(SIGN_UP_SUCCESS_MESSAGE)).toHaveLength(1);
		expect(location()).toBe("/login?registered=1");
		expect(body).toEqual({
			name: "Maria Souza",
			phone: "11987654321",
			password: "segredo",
			email: "maria@hu.ufs.br",
			cpf: "52998224725",
			birthDate: "1990-03-05",
		});
	});

	it("mostra a mensagem de conflito do backend", async () => {
		server.use(
			http.post(apiUrl("auth/register"), () =>
				HttpResponse.json(
					{ status: 409, error: "Conflict", message: "Este e-mail já está cadastrado." },
					{ status: 409 },
				),
			),
		);

		const { user, location } = renderApp("/cadastro");
		await fillSignUpForm(user);
		await user.click(screen.getByRole("button", { name: "Cadastre-se" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Este e-mail já está cadastrado.");
		expect(screen.getAllByText("Este e-mail já está cadastrado.")).toHaveLength(1);
		expect(location()).toBe("/cadastro");

		await user.clear(screen.getByLabelText("E-mail (obrigatório)"));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("rejeita telefone incompleto e data de nascimento futura", async () => {
		const { user } = renderApp("/cadastro");

		await user.type(screen.getByLabelText("Telefone (obrigatório)"), "1133334444");
		await user.type(screen.getByLabelText("Data de nascimento (obrigatório)"), "01012999");
		await user.click(screen.getByRole("button", { name: "Cadastre-se" }));

		expect(await screen.findByText("Informe o telefone.")).toBeInTheDocument();
		expect(screen.getByText("Data inválida.")).toBeInTheDocument();
		expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
		expect(screen.getByText("E-mail inválido.")).toBeInTheDocument();
	});
});

describe("rotas protegidas", () => {
	it("leva ao login quando não há token", async () => {
		const { location } = renderApp("/sections");
		await waitFor(() => expect(location()).toBe("/login"));
	});

	it("sai do sistema pelo menu, descartando o token", async () => {
		server.use(
			http.get(apiUrl("room"), () => HttpResponse.json(paged([], 0, 5))),
			http.get(apiUrl("section"), () => HttpResponse.json([])),
		);
		const { user, location } = renderApp("/rooms", { authenticated: true });

		await user.click(screen.getByRole("button", { name: "Sair" }));

		await waitFor(() => expect(location()).toBe("/login"));
		expect(getToken()).toBeNull();
	});
});
