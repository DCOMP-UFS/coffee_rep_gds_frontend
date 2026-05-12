import { FormControl } from "@angular/forms";
import {
	birthDateBrToApi,
	birthDateMaskValidator,
} from "./birth-date.validators";

describe("birthDate validators", () => {
	it("should accept a valid birth date with mask separators", () => {
		const control = new FormControl("15/03/1990", [birthDateMaskValidator()]);
		expect(control.valid).toBeTrue();
	});

	it("should accept a valid birth date with digits only from ngx-mask", () => {
		const control = new FormControl("15031990", [birthDateMaskValidator()]);
		expect(control.valid).toBeTrue();
	});

	it("should reject incomplete masked values", () => {
		const control = new FormControl("15/03/199", [birthDateMaskValidator()]);
		expect(control.valid).toBeFalse();
	});

	it("should convert dd/MM/yyyy to yyyy-MM-dd", () => {
		expect(birthDateBrToApi("15/03/1990")).toBe("1990-03-15");
		expect(birthDateBrToApi("15031990")).toBe("1990-03-15");
	});
});
