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

	it("should switch between recorrente and pontual modes", () => {
		expect(component.isRecurrentForm).toBeTrue();
		expect(component.reservationForm.contains("reservationDateFim")).toBeTrue();
		component.changeForm(false);
		expect(component.isRecurrentForm).toBeFalse();
		expect(component.reservationForm.contains("reservationDateFim")).toBeFalse();
		component.changeForm(true);
		expect(component.isRecurrentForm).toBeTrue();
		expect(component.reservationForm.contains("reservationDateFim")).toBeTrue();
	});
});
