import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { AuditService } from "../../core/services/audit.service";
import { HistoricoComponentStore } from "./historico.store";

describe("HistoricoComponentStore", () => {
	let store: HistoricoComponentStore;
	let auditService: jasmine.SpyObj<AuditService>;

	const params = { size: 10, page: 0 };

	beforeEach(() => {
		auditService = jasmine.createSpyObj("AuditService", ["getEvents"]);

		TestBed.configureTestingModule({
			providers: [
				HistoricoComponentStore,
				{ provide: AuditService, useValue: auditService },
			],
		});
		store = TestBed.inject(HistoricoComponentStore);
	});

	it("stores events after successful fetch", (done) => {
		auditService.getEvents.and.returnValue(
			of({
				content: [
					{
						id: 1,
						action: "room.create",
						entityType: "room",
						entityId: 10,
						actorUserId: 5,
						actorName: "Alice",
						details: { nome: "Sala A" },
						createdAt: "2026-01-01T10:00:00",
					},
				],
				page: { totalElements: 1, totalPages: 1, size: 10, number: 0 },
			}),
		);

		store.getEvents.subscribe((events) => {
			if (events.content.length) {
				expect(events.content[0].action).toBe("room.create");
				expect(auditService.getEvents).toHaveBeenCalledWith(params);
				done();
			}
		});
		store.getEvents$(of(params));
	});

	it("sets error on fetch failure", (done) => {
		auditService.getEvents.and.returnValue(throwError(() => new Error("fail")));

		store.error.subscribe((err) => {
			if (err) {
				expect(err).toContain("Não foi possível carregar o histórico");
				done();
			}
		});
		store.getEvents$(of(params));
	});
});
