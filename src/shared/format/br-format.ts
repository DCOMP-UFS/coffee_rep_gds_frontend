/** Remove tudo que não for dígito. */
export function onlyDigits(value: string | null | undefined): string {
	return String(value ?? "").replace(/\D/g, "");
}

/** `52998224725` → `529.982.247-25`. Valores fora do formato voltam como vieram. */
export function formatCpfBr(value: string | null | undefined): string {
	const digits = onlyDigits(value);
	if (digits.length !== 11) return String(value ?? "");

	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Celular (11 dígitos) ou fixo (10 dígitos). Outros valores voltam como vieram. */
export function formatPhoneBr(value: string | null | undefined): string {
	const digits = onlyDigits(value);

	if (digits.length === 11) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	}

	if (digits.length === 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	}

	return String(value ?? "");
}

/** `2026-01-05` → `05/01/2026`. Outros valores voltam como vieram. */
export function formatIsoDateBr(value: string | null | undefined): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
	if (!match) return String(value ?? "");

	const [, year, month, day] = match;
	return `${day}/${month}/${year}`;
}

/**
 * `2026-08-24T08:00:00` → `24/08/2026 08:00`. O backend manda o horário local sem fuso, então
 * a conversão é só de texto: passar por `Date` poderia deslocar o dia. Outros valores voltam
 * como vieram.
 */
export function formatIsoDateTimeBr(value: string | null | undefined): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(value ?? "").trim());
	if (!match) return String(value ?? "");

	const [, year, month, day, hours, minutes] = match;
	return `${day}/${month}/${year} ${hours}:${minutes}`;
}
