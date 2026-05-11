import { Component, OnInit } from "@angular/core";
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ActivatedRoute } from "@angular/router";
import { NgxMaskDirective } from "ngx-mask";
import { CookieService } from "ngx-cookie-service";
import { cpfDigitsValidator } from "../../core/validators/cpf.validators";
import { LoginSignUpStore } from "./login-sign-up.store";

@Component({
	selector: "app-login",
	templateUrl: "./login-sign-up.component.html",
	styleUrls: ["./login-sign-up.component.scss"],
	standalone: true,
	imports: [
		MatFormFieldModule,
		MatIconModule,
		ReactiveFormsModule,
		MatInputModule,
		MatDatepickerModule,
		MatButtonModule,
		NgxMaskDirective,
	],
	providers: [LoginSignUpStore],
})
export class LoginSignUpComponent implements OnInit {
	typeInput = "password";
	typeForm = "login";
	maxDate: Date = new Date();
	loginForm: FormGroup;
	signUpForm: FormGroup;

	constructor(
		private loginStore: LoginSignUpStore,
		private cookieService: CookieService,
		private route: ActivatedRoute,
	) {
		this.loginForm = this.createLoginForm();
		this.signUpForm = this.createSignUpForm();
		this.cookieService.deleteAll();
	}

	ngOnInit(): void {
		this.route.queryParams.subscribe((p) => {
			if (p["registered"] === "1") {
				this.typeForm = "login";
			}
		});
	}

	createSignUpForm(): FormGroup {
		return new FormGroup({
			name: new FormControl("", [Validators.required]),
			phone: new FormControl("", [Validators.required]),
			password: new FormControl("", [Validators.required]),
			email: new FormControl("", [Validators.required, Validators.email]),
			cpf: new FormControl("", [
				Validators.required,
				cpfDigitsValidator(),
			]),
			birthDate: new FormControl("", [Validators.required]),
		});
	}

	createLoginForm(): FormGroup {
		return new FormGroup({
			cpf: new FormControl("", [Validators.required, cpfDigitsValidator()]),
			password: new FormControl("", [Validators.required]),
		});
	}

	filterNumbers(control: string): void {
		this.signUpForm.controls[control].setValue(
			this.signUpForm.controls[control].value.replace(/\D/g, ""),
			{ emitEvent: false },
		);
	}

	tradeTypeInput(): void {
		this.typeInput = this.typeInput === "password" ? "text" : "password";
	}

	tradeTypeForm(): void {
		this.typeForm = this.typeForm === "login" ? "sign-up" : "login";
	}

	submitLogin(): void {
		this.loginForm.markAllAsTouched();
		if (!this.loginForm.valid) return;
		const v = this.loginForm.value;
		this.loginStore.sendLoginRequest$({
			cpf: String(v.cpf).replace(/\D/g, ""),
			password: v.password,
		});
	}

	submitSignUp(): void {
		this.signUpForm.markAllAsTouched();
		if (!this.signUpForm.valid) return;
		const v = this.signUpForm.value;
		this.loginStore.sendSignUpRequest$({
			...v,
			cpf: String(v.cpf).replace(/\D/g, ""),
			phone: String(v.phone).replace(/\D/g, ""),
		});
	}
}
