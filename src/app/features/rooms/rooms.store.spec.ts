import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { RoomService } from "../../core/services/room.service";
import { SectionService } from "../../core/services/section.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { RoomsComponentStore } from "./rooms.store";

describe("RoomsComponentStore", () => {
	let store: RoomsComponentStore;
	let roomService: jasmine.SpyObj<RoomService>;

	const params = { size: 5, page: 0, unpaged: false, section: 0 };

	beforeEach(() => {
		roomService = jasmine.createSpyObj("RoomService", ["getRooms", "deleteRoom"]);
		const sectionService = jasmine.createSpyObj("SectionService", ["getSections"]);
		sectionService.getSections.and.returnValue(of({ content: [] }));
		const snackBar = jasmine.createSpyObj("SnackBarService", ["openSnackBar"]);

		TestBed.configureTestingModule({
			providers: [
				RoomsComponentStore,
				{ provide: RoomService, useValue: roomService },
				{ provide: SectionService, useValue: sectionService },
				{ provide: SnackBarService, useValue: snackBar },
			],
		});
		store = TestBed.inject(RoomsComponentStore);
	});

	it("stores rooms after successful fetch", (done) => {
		roomService.getRooms.and.returnValue(
			of({
				content: [{ id: 1, nome: "Sala", setor: "A", setorId: 1, ocupada: false }],
				page: { totalElements: 1, totalPages: 1, size: 5, number: 0 },
			}),
		);

		store.getRooms.subscribe((rooms) => {
			if (rooms.content.length) {
				expect(rooms.content[0].nome).toBe("Sala");
				done();
			}
		});
		store.getRooms$(of(params));
	});

	it("sets rooms error on fetch failure", (done) => {
		roomService.getRooms.and.returnValue(throwError(() => new Error("fail")));

		store.roomsError.subscribe((err) => {
			if (err) {
				expect(err).toContain("Não foi possível carregar as salas");
				done();
			}
		});
		store.getRooms$(of(params));
	});
});
