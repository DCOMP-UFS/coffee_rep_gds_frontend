import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export interface DateParts {
	day: number;
	month: number;
	year: number;
}

export interface DateMaskValidatorOptions {
	allowFuture?: boolean;
}

export function parseBrDateParts(value: string): DateParts | null {
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

export function isValidCalendarDate(parts: DateParts): boolean {
	const date = new Date(parts.year, parts.month - 1, parts.day);
	return (
		date.getFullYear() === parts.year &&
		date.getMonth() === parts.month - 1 &&
		date.getDate() === parts.day
	);
}

export function datePartsToDate(parts: DateParts): Date {
	return new Date(parts.year, parts.month - 1, parts.day);
}

export function dateMaskValidator(
	options: DateMaskValidatorOptions = {},
): ValidatorFn {
	const allowFuture = options.allowFuture ?? true;

	return (control: AbstractControl): ValidationErrors | null => {
		const raw = control.value;
		if (raw == null || raw === "") {
			return null;
		}

		let parts: DateParts | null = null;
		if (raw instanceof Date) {
			if (Number.isNaN(raw.getTime())) {
				return { dateInvalid: true };
			}
			parts = {
				day: raw.getDate(),
				month: raw.getMonth() + 1,
				year: raw.getFullYear(),
			};
		} else {
			parts = parseBrDateParts(String(raw).trim());
		}

		if (!parts) {
			return { dateMask: true };
		}

		if (!isValidCalendarDate(parts)) {
			return { dateInvalid: true };
		}

		if (!allowFuture) {
			const date = datePartsToDate(parts);
			const today = new Date();
			today.setHours(23, 59, 59, 999);
			if (date > today) {
				return { dateInvalid: true };
			}
		}

		return null;
	};
}

export function brDateToIsoDate(value: string): string {
	const parts = parseBrDateParts(String(value ?? "").trim());
	if (!parts) {
		return String(value ?? "").trim();
	}

	const pad = (num: number) => num.toString().padStart(2, "0");
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}
