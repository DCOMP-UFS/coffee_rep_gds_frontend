import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideComponentHttp } from "../../testing/test-providers";
import { CurrentMonthComponent } from "./current-month.component";

describe("CurrentMonthComponent", () => {
	let component: CurrentMonthComponent;
	let fixture: ComponentFixture<CurrentMonthComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CurrentMonthComponent],
			providers: [...provideComponentHttp()],
		}).compileComponents();

		fixture = TestBed.createComponent(CurrentMonthComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
