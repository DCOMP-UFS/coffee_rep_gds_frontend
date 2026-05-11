import { FormControl } from "@angular/forms";
import { cpfDigitsValidator } from "./cpf.validators";

describe("cpfDigitsValidator", () => {
	const validator = cpfDigitsValidator();

	it("accepts empty value", () => {
		const control = new FormControl("");
		expect(validator(control)).toBeNull();
	});

	it("rejects CPF with wrong digit count", () => {
		const control = new FormControl("123");
		expect(validator(control)).toEqual({ cpfDigits: true });
	});

	it("accepts 11 digits", () => {
		const control = new FormControl("17055661030");
		expect(validator(control)).toBeNull();
	});
});
