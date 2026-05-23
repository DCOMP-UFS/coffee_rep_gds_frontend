import { AbstractControl, FormGroup } from "@angular/forms";

export function markAllAsTouched(control: AbstractControl): void {
	control.markAsTouched();
	if (control instanceof FormGroup) {
		for (const key of Object.keys(control.controls)) {
			markAllAsTouched(control.controls[key]);
		}
	}
}

export function shouldShowControlError(
	control: AbstractControl | null | undefined,
	formSubmitted = false,
): boolean {
	if (!control?.invalid) {
		return false;
	}
	return control.touched || control.dirty || formSubmitted;
}

export function runIfValid(form: FormGroup, onValid: () => void): boolean {
	if (form.valid) {
		onValid();
		return true;
	}
	markAllAsTouched(form);
	return false;
}
