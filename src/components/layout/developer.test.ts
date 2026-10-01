import { copyrightNotice, DEVELOPER_LINKS, whatsappUrl } from "./developer";

describe("whatsappUrl", () => {
	it("mantém só os dígitos do telefone mascarado", () => {
		expect(whatsappUrl("+55 (79) 99900-7075")).toBe("https://wa.me/5579999007075");
	});

	it("aceita o número já sem máscara", () => {
		expect(whatsappUrl("5579999007075")).toBe("https://wa.me/5579999007075");
	});
});

describe("copyrightNotice", () => {
	it("reserva os direitos no ano informado", () => {
		expect(copyrightNotice(2026)).toBe("© 2026 Todos os direitos reservados.");
	});

	it("usa o ano corrente por padrão", () => {
		vi.useFakeTimers({ now: new Date(2030, 5, 1) });
		try {
			expect(copyrightNotice()).toContain("© 2030 ");
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("DEVELOPER_LINKS", () => {
	it("aponta para os perfis do desenvolvedor por HTTPS", () => {
		expect(DEVELOPER_LINKS.map(({ label, href }) => [label, href])).toEqual([
			["WhatsApp", "https://wa.me/5579999007075"],
			["LinkedIn", "https://www.linkedin.com/in/guigorosario/"],
			["GitHub", "https://github.com/athena272"],
		]);
	});
});
