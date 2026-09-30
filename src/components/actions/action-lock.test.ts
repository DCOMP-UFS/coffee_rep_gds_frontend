import { inlineReason, lockedLabel } from "./action-lock";

describe("rótulos de ação bloqueada", () => {
	it("põe o motivo no meio da frase sem baixar o nome do perfil", () => {
		expect(inlineReason("Disponível a partir de Coordenação")).toBe(
			"disponível a partir de Coordenação",
		);
	});

	it("junta o nome da ação e o motivo entre parênteses", () => {
		expect(lockedLabel("Novo setor", "Exclusivo do administrador de tecnologia")).toBe(
			"Novo setor (exclusivo do administrador de tecnologia)",
		);
	});
});
