import type { Access } from "@/features/session/access-dialog/useAccess";
import { cancelAccessFor, type ReservationAccess } from "./permissions";

const single: Access = { allowed: true };
const recurring: Access = {
	allowed: false,
	lock: { reason: "Disponível a partir de Coordenação", explain: () => {} },
};
const access: ReservationAccess = { single, recurring };

describe("cancelAccessFor", () => {
	it("reserva pontual usa o acesso das pontuais", () => {
		expect(cancelAccessFor({ recorrenciaId: undefined }, access)).toBe(single);
	});

	it("ocorrência de uma série usa o acesso das recorrentes", () => {
		expect(cancelAccessFor({ recorrenciaId: 50 }, access)).toBe(recurring);
	});
});
