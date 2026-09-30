import { currentUser } from "@test/msw/fixtures";
import { accessSummary, lockedReason, PERMISSION_REQUIREMENTS } from "./access";
import type { Permission, Role } from "./types";

const ROLES_BY_LEVEL: Role[] = ["VIEWER", "ASSISTANT", "COORDINATOR", "ADMIN"];

describe("requisitos de acesso", () => {
	it.each(
		Object.entries(PERMISSION_REQUIREMENTS) as [
			Permission,
			(typeof PERMISSION_REQUIREMENTS)[Permission],
		][],
	)("%s: o perfil mínimo tem a permissão e os abaixo dele não", (permission, { minimumRole }) => {
		const level = ROLES_BY_LEVEL.indexOf(minimumRole);
		for (const [index, role] of ROLES_BY_LEVEL.entries()) {
			expect(currentUser(role).permissions.includes(permission)).toBe(index >= level);
		}
	});

	it("explica no tooltip o perfil mínimo, ou que é exclusivo do administrador", () => {
		expect(lockedReason(PERMISSION_REQUIREMENTS["absence.manage"])).toBe(
			"Disponível a partir de Assistente administrativo",
		);
		expect(lockedReason(PERMISSION_REQUIREMENTS["catalog.manage"])).toBe(
			"Disponível a partir de Coordenação",
		);
		expect(lockedReason(PERMISSION_REQUIREMENTS["users.manage"])).toBe(
			"Exclusivo do administrador do sistema",
		);
	});

	it("resume a exigência da funcionalidade", () => {
		expect(accessSummary("Cadastrar setores", PERMISSION_REQUIREMENTS["catalog.manage"])).toBe(
			"Cadastrar setores exige o perfil Coordenação ou superior.",
		);
		expect(accessSummary("Acessar a Administração", PERMISSION_REQUIREMENTS["users.manage"])).toBe(
			"Acessar a Administração é exclusivo do administrador do sistema.",
		);
	});
});
