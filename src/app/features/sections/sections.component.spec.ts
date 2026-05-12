import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { SectionService } from "../../core/services/section.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { SectionsComponent } from "./sections.component";

describe("SectionsComponent", () => {
	beforeEach(async () => {
		const sectionService = jasmine.createSpyObj("SectionService", [
			"getSections",
		]);
		sectionService.getSections.and.returnValue(
			of({ content: [{ id: 1, nome: "Setor", observacoes: "" }] }),
		);

		await TestBed.configureTestingModule({
			imports: [SectionsComponent],
			providers: [
				{ provide: SectionService, useValue: sectionService },
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

	it("should create and load sections", () => {
		const fixture = TestBed.createComponent(SectionsComponent);
		fixture.detectChanges();
		expect(fixture.componentInstance.dataSource.data.length).toBe(1);
		expect(fixture.componentInstance.loading).toBeFalse();
	});
});
