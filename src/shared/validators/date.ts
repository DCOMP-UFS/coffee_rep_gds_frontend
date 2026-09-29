/** Porte de `date-mask.validators.ts` do frontend Angular, sem dependência de formulário. */

export interface DateParts {
	day: number;
	month: number;
	year: number;
}

export type BrDateError = "dateMask" | "dateInvalid";

/** Lê `DD/MM/AAAA` (com ou sem máscara). Exige exatamente 8 dígitos. */
export function parseBrDateParts(value: string): DateParts | null {
	const digits = value.replace(/\D/g, "");
	if (digits.length !== 8) return null;

	return {
		day: Number(digits.slice(0, 2)),
		month: Number(digits.slice(2, 4)),
		year: Number(digits.slice(4, 8)),
	};
}

export function isValidCalendarDate({ day, month, year }: DateParts): boolean {
	const date = new Date(year, month - 1, day);
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Valida uma data digitada como `DD/MM/AAAA`. Vazio não é erro aqui: a obrigatoriedade é
 * responsabilidade de quem compõe o campo, como no validador original.
 */
export function validateBrDate(
	value: string,
	{ allowFuture = true }: { allowFuture?: boolean } = {},
): BrDateError | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const parts = parseBrDateParts(trimmed);
	if (!parts) return "dateMask";
	if (!isValidCalendarDate(parts)) return "dateInvalid";

	if (!allowFuture) {
		const endOfToday = new Date();
		endOfToday.setHours(23, 59, 59, 999);
		if (new Date(parts.year, parts.month - 1, parts.day) > endOfToday) return "dateInvalid";
	}

	return null;
}

/** `31/12/2024` → `2024-12-31`, formato que o backend espera. */
export function brDateToIsoDate(value: string): string {
	const parts = parseBrDateParts(String(value ?? "").trim());
	if (!parts) return String(value ?? "").trim();

	const pad = (num: number) => num.toString().padStart(2, "0");
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}
