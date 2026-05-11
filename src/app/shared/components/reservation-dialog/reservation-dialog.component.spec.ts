import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideComponentHttp } from "../../../testing/test-providers";
import { ReservationDialogComponent } from "./reservation-dialog.component";

describe("ReservationDialogComponent", () => {
	let component: ReservationDialogComponent;
	let fixture: ComponentFixture<ReservationDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ReservationDialogComponent],
			providers: [...provideComponentHttp()],
		}).compileComponents();

		fixture = TestBed.createComponent(ReservationDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
