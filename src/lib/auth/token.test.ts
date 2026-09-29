import { clearToken, getToken, isAuthenticated, setToken, TOKEN_COOKIE_NAME } from "./token";

describe("token", () => {
	it("começa sem token", () => {
		expect(getToken()).toBeNull();
		expect(isAuthenticated()).toBe(false);
	});

	it("grava e lê o token no cookie gdsToken", () => {
		setToken("abc.def.ghi");

		expect(document.cookie).toContain(`${TOKEN_COOKIE_NAME}=abc.def.ghi`);
		expect(getToken()).toBe("abc.def.ghi");
		expect(isAuthenticated()).toBe(true);
	});

	it("não confunde com outro cookie de nome parecido", () => {
		// biome-ignore lint/suspicious/noDocumentCookie: preparação do cenário de teste.
		document.cookie = "xgdsToken=outro; path=/";

		expect(getToken()).toBeNull();
	});

	it("remove o token", () => {
		setToken("abc");
		clearToken();

		expect(getToken()).toBeNull();
		expect(isAuthenticated()).toBe(false);
	});
});
