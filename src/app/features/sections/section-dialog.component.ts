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
import { Section } from "../../core/models/section-response.model";
import { SectionService } from "../../core/services/section.service";

@Component({
	selector: "app-section-dialog",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatDialogModule,
		MatButtonModule,
	],
	templateUrl: "./section-dialog.component.html",
	styleUrl: "./section-dialog.component.scss",
})
export class SectionDialogComponent {
	form: FormGroup;

	constructor(
		private fb: FormBuilder,
		private sectionService: SectionService,
		private dialogRef: MatDialogRef<SectionDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { element?: Section },
	) {
		this.form = this.fb.group({
			nome: [data.element?.nome ?? "", Validators.required],
			observacao: [data.element?.observacoes ?? ""],
		});
	}

	save(): void {
		this.form.markAllAsTouched();
		if (this.form.invalid) return;
		const v = this.form.getRawValue();
		const body = {
			nome: v.nome.trim(),
			observacao: v.observacao?.trim() || null,
		};
		const req$ = this.data.element
			? this.sectionService.updateSection(this.data.element.id, body)
			: this.sectionService.createSection(body);

		req$.subscribe({
			next: () => this.dialogRef.close(true),
			error: () => {},
		});
	}
}
