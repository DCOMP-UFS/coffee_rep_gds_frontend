import { AsyncPipe } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { Subscription, distinctUntilChanged } from "rxjs";
import {
	endTimeAfterStartValidator,
	timeFormatValidator,
} from "../../core/validators/time.validators";
import { createDate } from "../../core/utils/utils";
import {
	mapRequesterOptions,
	mapRoomOptions,
	mapSectionOptions,
} from "../../shared/components/searchable-select-field/searchable-select-options.util";
import { SearchableSelectFieldComponent } from "../../shared/components/searchable-select-field/searchable-select-field.component";
import { TimeRangeFieldsComponent } from "../../shared/components/time-range-fields/time-range-fields.component";
import { CalendarComponent } from "../../shared/components/calendar/calendar.component";
import { CurrentMonthComponentStore } from "./current-month.store";

@Component({
	selector: "app-home",
	templateUrl: "./current-month.component.html",
	styleUrls: ["./current-month.component.scss"],
	standalone: true,
	imports: [
		AsyncPipe,
		MatIconModule,
		MatInputModule,
		MatPaginatorModule,
		MatFormFieldModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatButtonModule,
		SearchableSelectFieldComponent,
		TimeRangeFieldsComponent,
		ReactiveFormsModule,
		CalendarComponent,
		MatCardModule,
	],
	providers: [CurrentMonthComponentStore],
})
export class CurrentMonthComponent implements OnInit, OnDestroy {
	reservationForm: FormGroup;
	private sectionChangesSub?: Subscription;
	protected readonly mapSectionOptions = mapSectionOptions;
	protected readonly mapRoomOptions = mapRoomOptions;
	protected readonly mapRequesterOptions = mapRequesterOptions;

	constructor(
		public store: CurrentMonthComponentStore,
		private fb: FormBuilder,
	) {
		this.reservationForm = this.fb.group(
			{
				section: ["", Validators.required],
				room: ["", Validators.required],
				reservationDate: [new Date(), Validators.required],
				horaInicio: ["", [Validators.required, timeFormatValidator]],
				horaFim: ["", [Validators.required, timeFormatValidator]],
				requester: ["", Validators.required],
			},
			{ validators: endTimeAfterStartValidator },
		);
	}

	ngOnInit(): void {
		const sectionControl = this.reservationForm.get("section");
		if (!sectionControl) {
			return;
		}

		this.sectionChangesSub = sectionControl.valueChanges
			.pipe(distinctUntilChanged())
			.subscribe((sectionId) => this.loadRoomsForSection(sectionId));
	}

	ngOnDestroy(): void {
		this.sectionChangesSub?.unsubscribe();
	}

	loadRoomsForSection(sectionId: string | number | null | undefined): void {
		const id = Number(sectionId);
		if (!Number.isFinite(id) || id <= 0) {
			this.reservationForm.patchValue({ room: "" }, { emitEvent: false });
			this.store.setRoomsByFilter([]);
			return;
		}

		this.reservationForm.patchValue({ room: "" }, { emitEvent: false });
		this.store.setRoomsByFilter([]);
		this.store.getRoomsBySectionId$({ sectionId: id });
	}

	getRoomsById(event: string | number): void {
		this.loadRoomsForSection(event);
	}

	submitForm(): void {
		if (this.reservationForm.valid) {
			this.store.createReservation$({
				salaId: +this.reservationForm.value.room,
				solicitanteId: +this.reservationForm.value.requester,
				horaInicio: createDate(
					this.reservationForm.value.reservationDate,
					this.reservationForm.value.horaInicio,
				),
				horaFim: createDate(
					this.reservationForm.value.reservationDate,
					this.reservationForm.value.horaFim,
				),
				observacoes: "",
			});
		}
	}

}
