import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideDialogTest } from "../../../testing/test-providers";
import { CalendarDialogInfosComponent } from "./calendar-dialog-infos.component";

describe("CalendarDialogInfosComponent", () => {
	let component: CalendarDialogInfosComponent;
	let fixture: ComponentFixture<CalendarDialogInfosComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CalendarDialogInfosComponent],
			providers: [...provideDialogTest()],
		}).compileComponents();

		fixture = TestBed.createComponent(CalendarDialogInfosComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
