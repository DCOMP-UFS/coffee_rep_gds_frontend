import "@testing-library/jest-dom/vitest";
import "@/lib/zod";

import { cleanup, configure } from "@testing-library/react";
import { toast } from "sonner";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

// Com todos os arquivos em paralelo, o primeiro render de uma tela pode passar de 1 s, o padrão
// dos `findBy` e do `waitFor`.
configure({ asyncUtilTimeout: 3_000 });

// `onUnhandledRequest: "error"` faz qualquer chamada sem handler reprovar o teste: é assim
// que garantimos que a tela não dispara requisições fora do contrato esperado.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
	server.resetHandlers();
	cleanup();
	clearAllCookies();
	// O sonner guarda os toasts num estado global e os reexibe no próximo <Toaster> montado.
	toast.dismiss();
});

/** Isola os testes: nenhum cookie (em especial o token) vaza de um teste para o outro. */
function clearAllCookies() {
	for (const cookie of document.cookie.split(";")) {
		const name = cookie.split("=")[0]?.trim();
		// biome-ignore lint/suspicious/noDocumentCookie: o jsdom não implementa a Cookie Store API.
		if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
	}
}

afterAll(() => server.close());

// Componentes do Radix usam APIs de layout que o jsdom não implementa.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
	window.matchMedia = (query: string) =>
		({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList;
}

Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
