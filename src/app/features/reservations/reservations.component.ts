import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
	FormBuilder,
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { Reservation } from "../../core/models/reservation-response.model";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { DeleteReservationComponent } from "../../shared/components/delete-reservation/delete-reservation.component";
import { ReservationDialogComponent } from "../../shared/components/reservation-dialog/reservation-dialog.component";
import { ReservationsComponentStore } from "./reservations.store";

@Component({
	selector: "app-reservations",
	imports: [
		MatTableModule,
		MatPaginatorModule,
		DatePipe,
		MatCardModule,
		MatIcon,
		MatDatepickerModule,
		FormsModule,
		MatNativeDateModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		AsyncPipe,
	],
	standalone: true,
	providers: [ReservationsComponentStore, MatDialogModule],
	templateUrl: "./reservations.component.html",
	styleUrl: "./reservations.component.scss",
})
export class ReservationsComponent implements OnInit {
	displayedColumns: string[] = [
		"sala",
		"solicitante",
		"setor",
		"criador",
		"horaInicio",
		"horaFim",
		"recorrencia",
		"cancel",
	];
	dataSource = new MatTableDataSource<Reservation>();
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	reservationForm: FormGroup;

	constructor(
		public store: ReservationsComponentStore,
		private dialog: MatDialog,
		private fb: FormBuilder,
	) {
		this.reservationForm = this.fb.group({
			start: new FormControl<Date>(
				new Date(new Date().setDate(new Date().getDate())),
				[Validators.required],
			),
			end: new FormControl<Date>(
				new Date(new Date().setDate(new Date().getDate() + 30)),
				[Validators.required],
			),
		});
	}

	ngOnInit(): void {
		this.store.getReservations$({
			start: this.reservationForm.value.start,
			end: this.reservationForm.value.end,
			size: 5,
			page: 0,
		});
		this.store.getReservations.subscribe((i) => {
			this.dataSource.data = i.content;
		});
	}

	submit() {
		if (this.reservationForm.valid) {
			this.store.getReservations$({
				start: this.reservationForm.value.start,
				end: this.reservationForm.value.end,
				size: 5,
				page: 0,
			});
		}
	}

	openDialog() {
		const dialog = this.dialog.open(ReservationDialogComponent, {
			width: "375px",
			height: "670px",
		});

		dialog.afterClosed().subscribe(() => {
			this.store.getReservations$({
				start: this.reservationForm.value.start,
				end: this.reservationForm.value.end,
				size: 5,
				page: 0,
			});
		});
	}

	handlePageEvent(e: PageEvent) {
		this.store.getReservations$({
			start: this.reservationForm.value.start,
			end: this.reservationForm.value.end,
			size: e.pageSize,
			page: e.pageIndex,
		});
	}

	cancelReservation(element: Reservation) {
		if (!element.recorrenciaId) {
			const dialog = this.dialog.open(ConfirmationDialogComponent);
			dialog.afterClosed().subscribe(
				(i) =>
					i.action &&
					this.store.cancelReservation$({
						reservationId: element.reservationId,
					}),
			);
		} else {
			const dialog = this.dialog.open(DeleteReservationComponent);
			dialog.afterClosed().subscribe((i) => {
				if (i?.type === "pontual") {
					this.store.cancelReservation$({
						reservationId: element.reservationId,
					});
				}
				if (i?.type === "todas") {
					this.store.cancelReservationRecurrent$({
						recurrentId: element.recorrenciaId,
					});
				}
			});
		}
	}
}
