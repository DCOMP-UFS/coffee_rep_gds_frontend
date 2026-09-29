import {
	ApiError,
	getHttpErrorMessage,
	getSignUpErrorMessage,
	PERMISSION_DENIED_MESSAGE,
} from "./errors";

const apiError = (payload: unknown, status = 400) => new ApiError(status, "qualquer", payload);

// Casos portados de `http-error-message.util.spec.ts` do frontend Angular.
describe("getHttpErrorMessage", () => {
	it("retorna a mensagem da API quando disponível", () => {
		const error = apiError({ message: "Este CPF já está cadastrado." });
		expect(getHttpErrorMessage(error, "Não foi possível concluir o cadastro.")).toBe(
			"Este CPF já está cadastrado.",
		);
	});

	it("ignora mensagens técnicas da API", () => {
		const error = apiError({ message: "422 UNPROCESSABLE_ENTITY" }, 422);
		expect(getHttpErrorMessage(error, "Não foi possível concluir o cadastro.")).toBe(
			"Não foi possível concluir o cadastro.",
		);
	});

	it("esconde erros SQL crus e mapeia CPF longo demais", () => {
		const error = apiError(
			{
				message:
					"could not execute statement [ERROR: value too long for type character varying(11)] [insert into tb_requesters (contact_number,cpf,created_at,name,specialty,status,updated_at,updated_by) values (?,?,?,?,?,?,?,?)]",
			},
			409,
		);
		expect(getHttpErrorMessage(error, "Não foi possível concluir a operação.")).toBe(
			"Informe um CPF válido (11 dígitos).",
		);
	});

	it("aceita payload em texto puro", () => {
		expect(getHttpErrorMessage(apiError("Sala já reservada."), "fallback")).toBe(
			"Sala já reservada.",
		);
	});

	it("usa o campo error quando message não existe", () => {
		expect(getHttpErrorMessage(apiError({ error: "Conflito de horário" }), "fallback")).toBe(
			"Conflito de horário",
		);
	});

	it("usa o fallback para erros que não vieram da API, como falha de rede", () => {
		expect(getHttpErrorMessage(new TypeError("Failed to fetch"), "fallback")).toBe("fallback");
	});

	describe("nunca mostra textos de sistema em inglês", () => {
		it.each([
			["reason phrase no campo error", { status: 500, error: "Internal Server Error" }, 500],
			["reason phrase em minúsculas", { message: "Internal server error" }, 500],
			["rota inexistente do NestJS", { message: "Cannot GET /api/nao-existe" }, 404],
			["JSON malformado", { message: "Unexpected token } in JSON at position 10" }, 400],
			["corpo grande demais", { message: "request entity too large" }, 413],
			[
				"página de erro da Vercel",
				"An error occurred with your deployment\n\nFUNCTION_INVOCATION_TIMEOUT",
				504,
			],
			["resposta em HTML", "<!DOCTYPE html><html><body>Bad Gateway</body></html>", 502],
		])("%s", (_, payload, status) => {
			expect(getHttpErrorMessage(apiError(payload, status), "Não foi possível salvar.")).toBe(
				"Não foi possível salvar.",
			);
		});

		it("prefere a mensagem em português ao reason phrase", () => {
			const error = apiError(
				{ status: 409, error: "Conflict", message: "Sala já reservada." },
				409,
			);
			expect(getHttpErrorMessage(error, "fallback")).toBe("Sala já reservada.");
		});

		it("mostra aviso de permissão em português para o 403 em inglês", () => {
			const error = apiError({ status: 403, error: "Forbidden", message: "Access Denied" }, 403);
			expect(getHttpErrorMessage(error, "fallback")).toBe(PERMISSION_DENIED_MESSAGE);
		});

		it("mantém a mensagem do backend num 403 em português", () => {
			const error = apiError({ message: "Apenas administradores podem excluir." }, 403);
			expect(getHttpErrorMessage(error, "fallback")).toBe("Apenas administradores podem excluir.");
		});
	});
});

describe("getSignUpErrorMessage", () => {
	it("mapeia conflito de cadastro para mensagem clara de CPF", () => {
		expect(getSignUpErrorMessage(apiError({ message: "422 UNPROCESSABLE_ENTITY" }, 422))).toBe(
			"Este CPF já está cadastrado.",
		);
	});

	it("retorna a mensagem de e-mail da API", () => {
		expect(getSignUpErrorMessage(apiError({ message: "Este e-mail já está cadastrado." }))).toBe(
			"Este e-mail já está cadastrado.",
		);
	});

	it("mapeia respostas legadas de CPF duplicado", () => {
		expect(getSignUpErrorMessage(apiError({ message: "422 UNPROCESSABLE_ENTITY" }, 500))).toBe(
			"Este CPF já está cadastrado.",
		);
	});

	it("mapeia erro cru de e-mail duplicado", () => {
		const error = apiError(
			{
				message:
					'could not execute statement [ERROR: duplicate key value violates unique constraint "unique_email" Detalhe: Key (email)=(admin@admin.com) already exists.]',
			},
			409,
		);
		expect(getSignUpErrorMessage(error)).toBe("Este e-mail já está cadastrado.");
	});

	it("retorna o fallback quando não há mensagem", () => {
		expect(getSignUpErrorMessage(apiError({}, 500))).toBe(
			"Não foi possível concluir o cadastro. Verifique os dados.",
		);
	});
});
