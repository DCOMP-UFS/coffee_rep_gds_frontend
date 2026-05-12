import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { RequesterAbsenceHttpService } from "../../core/services/requester-absence-http.service";
import { RequesterService } from "../../core/services/requester.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { AbsencesComponent } from "./absences.component";

describe("AbsencesComponent", () => {
	beforeEach(async () => {
		const absenceApi = jasmine.createSpyObj("RequesterAbsenceHttpService", [
			"list",
		]);
		absenceApi.list.and.returnValue(of([]));
		const requesterService = jasmine.createSpyObj("RequesterService", [
			"getRequesterUnpaged",
		]);
		requesterService.getRequesterUnpaged.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [AbsencesComponent],
			providers: [
				{ provide: RequesterAbsenceHttpService, useValue: absenceApi },
				{ provide: RequesterService, useValue: requesterService },
				{
					provide: MatDialog,
					useValue: jasmine.createSpyObj("MatDialog", ["open"]),
				},
				{
					provide: SnackBarService,
					useValue: jasmine.createSpyObj("SnackBarService", ["openSnackBar"]),
				},
			],
		}).compileComponents();
	});

	it("should create and finish loading", () => {
		const fixture = TestBed.createComponent(AbsencesComponent);
		fixture.detectChanges();
		expect(fixture.componentInstance).toBeTruthy();
		expect(fixture.componentInstance.loading).toBeFalse();
	});
});
