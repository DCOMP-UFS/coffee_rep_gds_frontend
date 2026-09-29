import { auditActionLabel, auditEntityLabel, isImportedEvent } from "./labels";
import type { AuditEvent } from "./types";

const event = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
	id: 1,
	action: "room.create",
	entityType: "room",
	entityId: 10,
	actorName: "Maria Admin",
	details: {},
	...overrides,
});

describe("auditActionLabel", () => {
	it("traduz as ações conhecidas", () => {
		expect(auditActionLabel("reservation.cancel_recurrence")).toBe("Cancelamento de série");
		expect(auditActionLabel("auth.login")).toBe("Login no sistema");
	});

	it("mostra códigos desconhecidos como vieram", () => {
		expect(auditActionLabel("report.export")).toBe("report.export");
		expect(auditActionLabel("constructor")).toBe("constructor");
	});
});

describe("auditEntityLabel", () => {
	it("junta a entidade e o número do registro", () => {
		expect(auditEntityLabel(event())).toBe("Sala #10");
	});

	it("mostra só a entidade quando não há número", () => {
		expect(auditEntityLabel(event({ entityType: "user", entityId: null }))).toBe("Usuário");
	});

	it("identifica a série na criação recorrente e no cancelamento da série", () => {
		expect(
			auditEntityLabel(
				event({
					action: "reservation.create",
					entityType: "reservation",
					entityId: 50,
					details: { recorrente: true },
				}),
			),
		).toBe("Série #50");
		expect(
			auditEntityLabel(
				event({
					action: "reservation.cancel_recurrence",
					entityType: "reservation",
					entityId: 50,
				}),
			),
		).toBe("Série #50");
	});

	it("mantém a reserva pontual como reserva", () => {
		expect(
			auditEntityLabel(
				event({
					action: "reservation.create",
					entityType: "reservation",
					entityId: 9,
					details: { recorrente: false },
				}),
			),
		).toBe("Reserva #9");
	});

	it("mostra entidades desconhecidas como vieram", () => {
		expect(auditEntityLabel(event({ entityType: "report", entityId: 3 }))).toBe("report #3");
	});
});

describe("isImportedEvent", () => {
	it("reconhece eventos importados", () => {
		expect(isImportedEvent(event({ details: { backfill: true } }))).toBe(true);
		expect(isImportedEvent(event({ details: null }))).toBe(false);
	});
});
