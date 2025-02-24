import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RequestersComponent } from "./requesters.component";

describe("RequestersComponent", () => {
	let component: RequestersComponent;
	let fixture: ComponentFixture<RequestersComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RequestersComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(RequestersComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
