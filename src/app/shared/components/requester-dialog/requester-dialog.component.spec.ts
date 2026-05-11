import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideComponentHttp } from "../../../testing/test-providers";
import { RequesterDialogComponent } from "./requester-dialog.component";

describe("RequesterDialogComponent", () => {
	let component: RequesterDialogComponent;
	let fixture: ComponentFixture<RequesterDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RequesterDialogComponent],
			providers: [...provideComponentHttp()],
		}).compileComponents();

		fixture = TestBed.createComponent(RequesterDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
