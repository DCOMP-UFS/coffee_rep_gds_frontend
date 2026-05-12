export function formatCpfBr(value: string | null | undefined): string {
	const digits = String(value ?? "").replace(/\D/g, "");
	if (digits.length !== 11) {
		return String(value ?? "");
	}

	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhoneBr(value: string | null | undefined): string {
	const digits = String(value ?? "").replace(/\D/g, "");

	if (digits.length === 11) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	}

	if (digits.length === 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	}

	return String(value ?? "");
}
