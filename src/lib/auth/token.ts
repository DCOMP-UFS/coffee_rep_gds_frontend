/**
 * Armazenamento do token de acesso.
 *
 * Mantém a semântica do frontend Angular: cookie `gdsToken` de sessão (sem expiração,
 * some ao fechar o navegador) no caminho raiz. Centralizar aqui permite trocar o meio de
 * armazenamento no futuro sem tocar em quem consome o token.
 */
export const TOKEN_COOKIE_NAME = "gdsToken";

export function getToken(): string | null {
	const prefix = `${TOKEN_COOKIE_NAME}=`;
	const entry = document.cookie
		.split(";")
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(prefix));

	if (!entry) return null;

	const value = decodeURIComponent(entry.slice(prefix.length));
	return value || null;
}

export function setToken(token: string): void {
	// biome-ignore lint/suspicious/noDocumentCookie: a Cookie Store API não existe no Firefox nem no jsdom.
	document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

export function clearToken(): void {
	// biome-ignore lint/suspicious/noDocumentCookie: a Cookie Store API não existe no Firefox nem no jsdom.
	document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
	return getToken() !== null;
}
