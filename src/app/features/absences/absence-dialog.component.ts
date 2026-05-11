import { Component, Inject } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
	MAT_DIALOG_DATA,
	MatDialogModule,
	MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatOption, MatSelectModule } from "@angular/material/select";
import { Requester } from "../../core/models/requester-response.model";
import {
	CreateRequesterAbsencePayload,
	RequesterAbsence,
} from "../../core/models/requester-absence.model";
import { RequesterAbsenceHttpService } from "../../core/services/requester-absence-http.service";

@Component({
	selector: "app-absence-dialog",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatDialogModule,
		MatButtonModule,
		MatSelectModule,
		MatOption,
	],
	templateUrl: "./absence-dialog.component.html",
})
export class AbsenceDialogComponent {
	form: FormGroup;
	requesters: Requester[] = [];

	constructor(
		private fb: FormBuilder,
		private absenceApi: RequesterAbsenceHttpService,
		private dialogRef: MatDialogRef<AbsenceDialogComponent>,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			requesters: Requester[];
			element?: RequesterAbsence;
		},
	) {
		this.requesters = data.requesters ?? [];
		this.form = this.fb.group({
			solicitanteId: [
				data.element?.solicitanteId != null
					? String(data.element.solicitanteId)
					: "",
				Validators.required,
			],
			inicio: [data.element?.dataInicio ?? "", Validators.required],
			fim: [data.element?.dataFim ?? "", Validators.required],
		});
		if (!this.requesters.length) {
			this.form.disable();
		}
	}

	save(): void {
		this.form.markAllAsTouched();
		if (this.form.invalid || !this.requesters.length) return;
		const v = this.form.getRawValue();
		const payload: CreateRequesterAbsencePayload = {
			solicitanteId: +v.solicitanteId,
			dataInicio: v.inicio,
			dataFim: v.fim,
		};
		if (payload.dataInicio > payload.dataFim) return;

		const req$ = this.data.element
			? this.absenceApi.update(this.data.element.id, payload)
			: this.absenceApi.create(payload);

		req$.subscribe({
			next: () => this.dialogRef.close(true),
			error: () => {},
		});
	}
}
