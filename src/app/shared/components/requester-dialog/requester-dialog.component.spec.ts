import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RequesterDialogComponent } from "./requester-dialog.component";

describe("RequesterDialogComponent", () => {
	let component: RequesterDialogComponent;
	let fixture: ComponentFixture<RequesterDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RequesterDialogComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(RequesterDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
