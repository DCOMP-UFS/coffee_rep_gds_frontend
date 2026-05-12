import { Component, OnDestroy, OnInit } from "@angular/core";
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {
	ActivatedRoute,
	NavigationEnd,
	Router,
	RouterLink,
} from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { NgxMaskDirective } from "ngx-mask";
import { Subject, filter, takeUntil } from "rxjs";
import {
	birthDateBrToApi,
	birthDateMaskValidator,
} from "../../core/validators/birth-date.validators";
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
		MatButtonModule,
		NgxMaskDirective,
		RouterLink,
	],
	providers: [LoginSignUpStore],
})
export class LoginSignUpComponent implements OnInit, OnDestroy {
	loginPasswordInputType: "password" | "text" = "password";
	signUpPasswordInputType: "password" | "text" = "password";
	isSignUp = false;
	loginForm: FormGroup;
	signUpForm: FormGroup;

	private readonly destroy$ = new Subject<void>();

	constructor(
		private loginStore: LoginSignUpStore,
		private cookieService: CookieService,
		private route: ActivatedRoute,
		private router: Router,
	) {
		this.loginForm = this.createLoginForm();
		this.signUpForm = this.createSignUpForm();
		this.cookieService.deleteAll();
	}

	ngOnInit(): void {
		this.syncModeFromUrl(this.router.url);
		this.router.events
			.pipe(
				filter(
					(event): event is NavigationEnd => event instanceof NavigationEnd,
				),
				takeUntil(this.destroy$),
			)
			.subscribe((event) => {
				this.syncModeFromUrl(event.urlAfterRedirects);
				this.clearStrayFocus();
			});

		this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((p) => {
			if (p.registered === "1") {
				this.isSignUp = false;
			}
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	createSignUpForm(): FormGroup {
		return new FormGroup({
			name: new FormControl("", [Validators.required]),
			phone: new FormControl("", [Validators.required]),
			password: new FormControl("", [Validators.required]),
			email: new FormControl("", [Validators.required, Validators.email]),
			cpf: new FormControl("", [Validators.required, cpfDigitsValidator()]),
			birthDate: new FormControl("", [
				Validators.required,
				birthDateMaskValidator(),
			]),
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

	toggleLoginPasswordVisibility(): void {
		this.loginPasswordInputType =
			this.loginPasswordInputType === "password" ? "text" : "password";
	}

	toggleSignUpPasswordVisibility(): void {
		this.signUpPasswordInputType =
			this.signUpPasswordInputType === "password" ? "text" : "password";
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
			birthDate: birthDateBrToApi(String(v.birthDate)),
		});
	}

	private syncModeFromUrl(url: string): void {
		const path = url.split("?")[0].split("#")[0];
		this.isSignUp = path === "/cadastro";
	}

	private clearStrayFocus(): void {
		queueMicrotask(() => {
			const active = document.activeElement;
			if (!(active instanceof HTMLElement)) {
				return;
			}
			if (active.tagName === "A" || !this.isAuthField(active)) {
				active.blur();
			}
		});
	}

	private isAuthField(element: HTMLElement): boolean {
		const tag = element.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
			return true;
		}
		return element.closest(".login-page__form") !== null;
	}
}
