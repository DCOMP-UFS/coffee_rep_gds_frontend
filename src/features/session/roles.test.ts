import { requestableRoles, resolveRole, roleLabel } from "./roles";

describe("perfis", () => {
	it("traduz os perfis, inclusive o legado, e mantém códigos desconhecidos", () => {
		expect(roleLabel("VIEWER")).toBe("Visualizador");
		expect(roleLabel("ASSISTANT")).toBe("Assistente administrativo");
		expect(roleLabel("COORDINATOR")).toBe("Coordenação");
		expect(roleLabel("ADMIN")).toBe("Administrador de tecnologia");
		expect(roleLabel("BASIC")).toBe("Básico (legado)");
		expect(roleLabel("OUTRO")).toBe("OUTRO");
		expect(roleLabel("constructor")).toBe("constructor");
	});

	it("só oferece perfis acima do atual e nunca o de administrador", () => {
		expect(requestableRoles("VIEWER")).toEqual(["ASSISTANT", "COORDINATOR"]);
		expect(requestableRoles("ASSISTANT")).toEqual(["COORDINATOR"]);
		expect(requestableRoles("COORDINATOR")).toEqual([]);
		expect(requestableRoles("ADMIN")).toEqual([]);
	});

	it("resolve o perfil efetivo como o backend: o maior reconhecido, BASIC como Coordenação", () => {
		expect(resolveRole([])).toBe("VIEWER");
		expect(resolveRole(["OUTRO"])).toBe("VIEWER");
		expect(resolveRole(["BASIC"])).toBe("COORDINATOR");
		expect(resolveRole(["ASSISTANT", "VIEWER"])).toBe("ASSISTANT");
		expect(resolveRole(["BASIC", "ADMIN"])).toBe("ADMIN");
	});
});
