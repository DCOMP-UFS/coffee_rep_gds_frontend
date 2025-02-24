import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
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
		"horaInicio",
		"horaFim",
		"cancel",
	];
	dataSource = new MatTableDataSource<Reservation>();
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	readonly range = new FormGroup({
		start: new FormControl<Date>(
			new Date(new Date().setDate(new Date().getDate() - 15)),
			[Validators.required],
		),
		end: new FormControl<Date>(
			new Date(new Date().setDate(new Date().getDate() + 15)),
			[Validators.required],
		),
	});

	constructor(
		public store: ReservationsComponentStore,
		private dialog: MatDialog,
	) {}

	ngOnInit(): void {
		this.store.getReservations$({
			start: this.range.value.start,
			end: this.range.value.end,
			size: 5,
			page: 0,
		});
		this.store.getReservations.subscribe((i) => {
			this.dataSource.data = i.content;
		});
	}

	submit() {
		if (this.range.valid) {
			this.store.getReservations$({
				start: this.range.value.start,
				end: this.range.value.end,
				size: 5,
				page: 0,
			});
		}
	}

	openDialog() {
		this.dialog.open(ReservationDialogComponent, {
			width: "375px",
			height: "475px",
		});
	}

	handlePageEvent(e: PageEvent) {
		this.store.getReservations$({
			start: this.range.value.start,
			end: this.range.value.end,
			size: e.pageSize,
			page: e.pageIndex,
		});
	}
}
