import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
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
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { Reservation } from "../../core/models/reservation-response.model";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { DeleteReservationComponent } from "../../shared/components/delete-reservation/delete-reservation.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PaginationBarComponent } from "../../shared/components/pagination/pagination-bar.component";
import { PaginationPageChange } from "../../shared/components/pagination/pagination-page-change.model";
import { PaginationSummaryComponent } from "../../shared/components/pagination/pagination-summary.component";
import { ReservationDialogComponent } from "../../shared/components/reservation-dialog/reservation-dialog.component";
import { FORM_DIALOG_CONFIG } from "../../shared/constants/dialog-config";
import { ReservationsComponentStore } from "./reservations.store";

@Component({
	selector: "app-reservations",
	imports: [
		MatTableModule,
		DatePipe,
		MatCardModule,
		MatIcon,
		MatDatepickerModule,
		FormsModule,
		MatNativeDateModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		AsyncPipe,
		EmptyStateComponent,
		PaginationBarComponent,
		PaginationSummaryComponent,
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
	pageSize = 5;
	pageIndex = 0;
	totalElements = 0;
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
		this.fetchReservations(0, this.pageSize);
		this.store.getReservations.subscribe((i) => {
			this.dataSource.data = i.content;
			this.pageSize = i.page?.size ?? this.pageSize;
			this.pageIndex = i.page?.number ?? this.pageIndex;
			this.totalElements = i.page?.totalElements ?? 0;
		});
	}

	submit() {
		if (this.reservationForm.valid) {
			this.fetchReservations(0, this.pageSize);
		}
	}

	openDialog() {
		const dialog = this.dialog.open(ReservationDialogComponent, {
			...FORM_DIALOG_CONFIG,
		});

		dialog.afterClosed().subscribe(() => {
			this.fetchReservations(this.pageIndex, this.pageSize);
		});
	}

	handlePageEvent(e: PaginationPageChange) {
		this.fetchReservations(e.pageIndex, e.pageSize);
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

	private fetchReservations(page: number, size: number): void {
		this.pageIndex = page;
		this.pageSize = size;
		this.store.getReservations$({
			start: this.reservationForm.value.start,
			end: this.reservationForm.value.end,
			size,
			page,
		});
	}
}
