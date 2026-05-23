import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateAdapter, provideNativeDateAdapter } from "@angular/material/core";
import { PtBrDateAdapter } from "../../core/adapters/pt-br-date.adapter";
import { provideComponentHttp } from "../../testing/test-providers";
import { CurrentMonthComponent } from "./current-month.component";
import { CurrentMonthComponentStore } from "./current-month.store";

describe("CurrentMonthComponent", () => {
	let component: CurrentMonthComponent;
	let fixture: ComponentFixture<CurrentMonthComponent>;
	let store: CurrentMonthComponentStore;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CurrentMonthComponent],
			providers: [
				...provideComponentHttp(),
				provideNativeDateAdapter(),
				{ provide: DateAdapter, useClass: PtBrDateAdapter },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(CurrentMonthComponent);
		component = fixture.componentInstance;
		store = component.store;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should request rooms when section changes", () => {
		spyOn(store, "getRoomsBySectionId$");
		spyOn(store, "setRoomsByFilter");

		component.reservationForm.get("section")?.setValue("2");

		expect(store.setRoomsByFilter).toHaveBeenCalledWith([]);
		expect(store.getRoomsBySectionId$).toHaveBeenCalledWith({ sectionId: 2 });
	});

	it("should clear rooms when section is cleared", () => {
		spyOn(store, "getRoomsBySectionId$");
		spyOn(store, "setRoomsByFilter");

		component.reservationForm.get("section")?.setValue("");
		component.reservationForm.get("room")?.setValue("3");

		expect(store.setRoomsByFilter).toHaveBeenCalledWith([]);
		expect(store.getRoomsBySectionId$).not.toHaveBeenCalled();
	});

	it("should mark controls touched and not create reservation on invalid submit", () => {
		spyOn(store, "createReservation$");
		component.reservationForm.reset({
			section: "",
			room: "",
			requester: "",
			reservationDate: null,
			horaInicio: "",
			horaFim: "",
		});

		component.submitForm();

		expect(store.createReservation$).not.toHaveBeenCalled();
		expect(component.reservationForm.get("section")?.touched).toBeTrue();
		expect(component.reservationForm.get("horaInicio")?.touched).toBeTrue();
	});
});
