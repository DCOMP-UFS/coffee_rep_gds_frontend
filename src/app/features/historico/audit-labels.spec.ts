import {
	auditActionLabel,
	auditEntityLabel,
	formatAuditDetails,
	isBackfillEvent,
} from "./audit-labels";

describe("audit-labels", () => {
	it("maps known actions", () => {
		expect(auditActionLabel("room.create")).toBe("Criação de sala");
	});

	it("falls back to raw action", () => {
		expect(auditActionLabel("foo.bar")).toBe("foo.bar");
	});

	it("formats entity with id", () => {
		expect(auditEntityLabel("room", 12)).toBe("Sala #12");
	});

	it("detects backfill and hides internal keys in details", () => {
		const details = {
			backfill: true,
			backfillSource: "rooms",
			backfillSourceId: 1,
			actorInferred: true,
			nome: "Sala A",
		};
		expect(isBackfillEvent(details)).toBe(true);
		expect(formatAuditDetails(details)).toBe("Nome: Sala A");
	});
});
