import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
	markAllAsTouched,
	runIfValid,
	shouldShowControlError,
} from "./form-validation.util";

describe("form-validation.util", () => {
	it("markAllAsTouched should touch nested controls", () => {
		const form = new FormGroup({
			a: new FormControl(""),
			b: new FormGroup({
				c: new FormControl(""),
			}),
		});

		markAllAsTouched(form);

		expect(form.get("a")?.touched).toBeTrue();
		expect(form.get("b.c")?.touched).toBeTrue();
	});

	it("shouldShowControlError should be true when dirty", () => {
		const control = new FormControl("", Validators.required);
		control.markAsDirty();
		expect(shouldShowControlError(control)).toBeTrue();
	});

	it("runIfValid should run callback only when valid", () => {
		const form = new FormGroup({
			name: new FormControl("", Validators.required),
		});
		const onValid = jasmine.createSpy("onValid");

		expect(runIfValid(form, onValid)).toBeFalse();
		expect(onValid).not.toHaveBeenCalled();
		expect(form.get("name")?.touched).toBeTrue();

		form.patchValue({ name: "ok" });
		expect(runIfValid(form, onValid)).toBeTrue();
		expect(onValid).toHaveBeenCalledTimes(1);
	});
});
