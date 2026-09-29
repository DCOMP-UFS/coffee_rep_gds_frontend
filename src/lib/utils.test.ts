import { cn } from "./utils";

describe("cn", () => {
	it("combina classes condicionais", () => {
		expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
	});

	it("resolve conflitos de utilitários mantendo o último", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});

	it("mantém cor e tamanho de texto customizados juntos", () => {
		expect(cn("text-2xl text-primary", "text-sidebar-foreground")).toBe(
			"text-2xl text-sidebar-foreground",
		);
	});
});
