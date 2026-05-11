import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideComponentHttp } from "../../testing/test-providers";
import { RoomsComponent } from "./rooms.component";

describe("RoomsComponent", () => {
	let component: RoomsComponent;
	let fixture: ComponentFixture<RoomsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RoomsComponent],
			providers: [...provideComponentHttp()],
		}).compileComponents();

		fixture = TestBed.createComponent(RoomsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
