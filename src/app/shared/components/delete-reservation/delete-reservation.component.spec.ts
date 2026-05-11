import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideDialogTest } from "../../../testing/test-providers";
import { DeleteReservationComponent } from "./delete-reservation.component";

describe("DeleteReservationComponent", () => {
	let component: DeleteReservationComponent;
	let fixture: ComponentFixture<DeleteReservationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DeleteReservationComponent],
			providers: [...provideDialogTest()],
		}).compileComponents();

		fixture = TestBed.createComponent(DeleteReservationComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
