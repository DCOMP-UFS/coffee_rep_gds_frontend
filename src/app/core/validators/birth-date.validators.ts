import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

interface BirthDateParts {
	day: number;
	month: number;
	year: number;
}

function parseBirthDateParts(value: string): BirthDateParts | null {
	const digits = value.replace(/\D/g, "");
	if (digits.length !== 8) {
		return null;
	}

	return {
		day: Number(digits.slice(0, 2)),
		month: Number(digits.slice(2, 4)),
		year: Number(digits.slice(4, 8)),
	};
}

function isValidBirthDate(parts: BirthDateParts): boolean {
	const date = new Date(parts.year, parts.month - 1, parts.day);

	if (
		date.getFullYear() !== parts.year ||
		date.getMonth() !== parts.month - 1 ||
		date.getDate() !== parts.day
	) {
		return false;
	}

	const today = new Date();
	today.setHours(23, 59, 59, 999);
	return date <= today;
}

export function birthDateMaskValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const raw = String(control.value ?? "").trim();
		if (!raw.length) {
			return null;
		}

		const parts = parseBirthDateParts(raw);
		if (!parts) {
			return { birthDateMask: true };
		}

		if (!isValidBirthDate(parts)) {
			return { birthDateInvalid: true };
		}

		return null;
	};
}

export function birthDateBrToApi(value: string): string {
	const parts = parseBirthDateParts(String(value ?? "").trim());
	if (!parts) {
		return String(value ?? "").trim();
	}

	const pad = (num: number) => num.toString().padStart(2, "0");
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}
