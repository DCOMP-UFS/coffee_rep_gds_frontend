import { Component, Inject } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { NgxMaskDirective } from "ngx-mask";
import { Requester } from "../../../core/models/requester-response.model";
import { cpfDigitsValidator } from "../../../core/validators/cpf.validators";
import { RequesterDialogComponentStore } from "./requester-dialog.store";

@Component({
	selector: "app-requester-dialog",
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatDialogModule,
		MatSelectModule,
		MatButtonModule,
		MatInputModule,
		NgxMaskDirective,
	],
	standalone: true,
	providers: [RequesterDialogComponentStore],
	templateUrl: "./requester-dialog.component.html",
	styleUrl: "./requester-dialog.component.scss",
})
export class RequesterDialogComponent {
	requesterForm: FormGroup;

	constructor(
		private fb: FormBuilder,
		private store: RequesterDialogComponentStore,
		@Inject(MAT_DIALOG_DATA) public data: { element: Requester },
	) {
		this.requesterForm = this.fb.group({
			name: [
				this.data?.element?.nome ? this.data.element.nome : "",
				Validators.required,
			],
			cpf: [
				{
					value: this.data?.element?.cpf ? this.data.element.cpf : "",
					disabled: !!this.data?.element?.cpf,
				},
				[Validators.required, cpfDigitsValidator()],
			],
			phone: [
				this.data?.element?.contato ? this.data.element.contato : "",
				Validators.required,
			],
			type: [
				this.data?.element?.especialidade
					? this.data.element.especialidade
					: "",
				Validators.required,
			],
		});
	}

	submit() {
		this.requesterForm.markAllAsTouched();
		if (!this.requesterForm.valid) {
			return;
		}

		const raw = this.requesterForm.getRawValue();
		const payload = {
			nome: raw.name,
			cpf: String(raw.cpf).replace(/\D/g, ""),
			telefone: String(raw.phone).replace(/\D/g, ""),
			especialidade: raw.type,
		};

		if (this.data?.element) {
			this.store.updateRequester$({
				id: this.data.element.id,
				...payload,
			});
			return;
		}

		this.store.createRequester$(payload);
	}
}
