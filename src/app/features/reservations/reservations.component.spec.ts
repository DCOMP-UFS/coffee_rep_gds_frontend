import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideComponentHttp } from "../../testing/test-providers";
import { ReservationsComponent } from "./reservations.component";

describe("ReservationsComponent", () => {
	let component: ReservationsComponent;
	let fixture: ComponentFixture<ReservationsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ReservationsComponent],
			providers: [...provideComponentHttp()],
		}).compileComponents();

		fixture = TestBed.createComponent(ReservationsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
