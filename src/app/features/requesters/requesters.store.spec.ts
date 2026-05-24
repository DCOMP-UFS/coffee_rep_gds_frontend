import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { RequesterService } from "../../core/services/requester.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { RequestersComponentStore } from "./requesters.store";

describe("RequestersComponentStore", () => {
	let store: RequestersComponentStore;
	let requesterService: jasmine.SpyObj<RequesterService>;

	beforeEach(() => {
		requesterService = jasmine.createSpyObj("RequesterService", [
			"getRequesters",
			"deleteRequester",
		]);
		const snackBar = jasmine.createSpyObj("SnackBarService", ["openSnackBar"]);

		TestBed.configureTestingModule({
			providers: [
				RequestersComponentStore,
				{ provide: RequesterService, useValue: requesterService },
				{ provide: SnackBarService, useValue: snackBar },
			],
		});
		store = TestBed.inject(RequestersComponentStore);
	});

	it("refetches with last pagination params", () => {
		requesterService.getRequesters.and.returnValue(
			of({
				content: [],
				page: { totalElements: 0, totalPages: 0, size: 5, number: 0 },
			}),
		);

		store.getRequester$({ size: 5, page: 0, unpaged: false });
		store.refetch();
		expect(requesterService.getRequesters).toHaveBeenCalledTimes(2);
	});

	it("passes busca param to service and preserves it on refetch", () => {
		requesterService.getRequesters.and.returnValue(
			of({
				content: [],
				page: { totalElements: 0, totalPages: 0, size: 5, number: 0 },
			}),
		);

		store.getRequester$({ size: 5, page: 0, unpaged: false, busca: "Cardio" });
		store.refetch();

		expect(requesterService.getRequesters).toHaveBeenCalledWith({
			size: 5,
			page: 0,
			unpaged: false,
			busca: "Cardio",
		});
	});

	it("hasActiveSearch is true when busca is set", (done) => {
		requesterService.getRequesters.and.returnValue(
			of({
				content: [],
				page: { totalElements: 0, totalPages: 0, size: 5, number: 0 },
			}),
		);

		store.getRequester$({ size: 5, page: 0, unpaged: false, busca: "Ana" });

		store.hasActiveSearch.subscribe((active) => {
			expect(active).toBeTrue();
			done();
		});
	});
});
