import { FormControl } from "@angular/forms";
import { dateMaskValidator } from "./date-mask.validators";

describe("dateMaskValidator", () => {
	it("should accept a complete valid future date when allowFuture is true", () => {
		const control = new FormControl("31/12/2099", dateMaskValidator());
		expect(control.errors).toBeNull();
	});

	it("should reject incomplete mask input", () => {
		const control = new FormControl("010120", dateMaskValidator());
		expect(control.errors).toEqual({ dateMask: true });
	});

	it("should reject invalid calendar dates", () => {
		const control = new FormControl("31/02/2024", dateMaskValidator());
		expect(control.errors).toEqual({ dateInvalid: true });
	});

	it("should reject future dates when allowFuture is false", () => {
		const future = new Date();
		future.setFullYear(future.getFullYear() + 2);
		const control = new FormControl(
			future,
			dateMaskValidator({ allowFuture: false }),
		);
		expect(control.errors).toEqual({ dateInvalid: true });
	});
});
