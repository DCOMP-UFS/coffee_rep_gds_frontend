import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/** CPF com exatamente 11 dígitos (valor já sem máscara, compatível com ngx-mask). */
export function cpfDigitsValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const raw = String(control.value ?? "").replace(/\D/g, "");
		if (!raw.length) return null;
		if (raw.length !== 11) return { cpfDigits: true };
		return null;
	};
}
