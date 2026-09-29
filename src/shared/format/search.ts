/** Minúsculas e sem acentos: "Clínica Médica" é encontrada digitando "clinica medica". */
export function normalizeSearch(text: string): string {
	return text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

/** Se algum dos textos contém o termo, ignorando acentos e maiúsculas. Termo vazio aceita tudo. */
export function matchesSearch(term: string, ...texts: (string | null | undefined)[]): boolean {
	const normalizedTerm = normalizeSearch(term.trim());
	if (normalizedTerm === "") return true;
	return texts.some((text) => normalizeSearch(text ?? "").includes(normalizedTerm));
}
