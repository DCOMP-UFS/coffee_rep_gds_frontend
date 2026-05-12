import { HttpErrorResponse } from "@angular/common/http";
import {
	getHttpErrorMessage,
	getSignUpErrorMessage,
} from "./http-error-message.util";

describe("http error message utils", () => {
	it("should return the API message when available", () => {
		const error = new HttpErrorResponse({
			error: { message: "Este CPF já está cadastrado." },
			status: 400,
		});

		expect(
			getHttpErrorMessage(error, "Não foi possível concluir o cadastro."),
		).toBe("Este CPF já está cadastrado.");
	});

	it("should ignore technical API messages", () => {
		const error = new HttpErrorResponse({
			error: { message: "422 UNPROCESSABLE_ENTITY" },
			status: 422,
		});

		expect(
			getHttpErrorMessage(error, "Não foi possível concluir o cadastro."),
		).toBe("Não foi possível concluir o cadastro.");
	});

	it("should map sign-up conflicts to a clear CPF message", () => {
		const error = new HttpErrorResponse({
			error: { message: "422 UNPROCESSABLE_ENTITY" },
			status: 422,
		});

		expect(getSignUpErrorMessage(error)).toBe("Este CPF já está cadastrado.");
	});

	it("should return the API email message when available", () => {
		const error = new HttpErrorResponse({
			error: { message: "Este e-mail já está cadastrado." },
			status: 400,
		});

		expect(getSignUpErrorMessage(error)).toBe("Este e-mail já está cadastrado.");
	});

	it("maps legacy duplicate CPF responses to a clear message", () => {
		const error = new HttpErrorResponse({
			error: { message: "422 UNPROCESSABLE_ENTITY" },
			status: 500,
		});

		expect(getSignUpErrorMessage(error)).toBe("Este CPF já está cadastrado.");
	});

	it("maps raw duplicate email persistence errors to a clear message", () => {
		const error = new HttpErrorResponse({
			error: {
				message:
					'could not execute statement [ERROR: duplicate key value violates unique constraint "unique_email" Detalhe: Key (email)=(admin@admin.com) already exists.]',
			},
			status: 409,
		});

		expect(getSignUpErrorMessage(error)).toBe("Este e-mail já está cadastrado.");
	});

	it("should hide raw SQL errors from the user", () => {
		const error = new HttpErrorResponse({
			error: {
				message:
					"could not execute statement [ERROR: value too long for type character varying(11)] [insert into tb_requesters (contact_number,cpf,created_at,name,specialty,status,updated_at,updated_by) values (?,?,?,?,?,?,?,?)]",
			},
			status: 409,
		});

		expect(
			getHttpErrorMessage(error, "Não foi possível concluir a operação."),
		).toBe("Informe um CPF válido (11 dígitos).");
	});

	it("should return the fallback when the API message is missing", () => {
		const error = new HttpErrorResponse({
			error: {},
			status: 500,
		});

		expect(getSignUpErrorMessage(error)).toBe(
			"Não foi possível concluir o cadastro. Verifique os dados.",
		);
	});
});
