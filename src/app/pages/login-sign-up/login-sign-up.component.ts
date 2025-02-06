import { Component } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {LoginSignUpStore} from "./login-sign-up.store";

@Component({
  selector: 'app-login',
  templateUrl: './login-sign-up.component.html',
  styleUrls: ['./login-sign-up.component.scss'],
  providers: [LoginSignUpStore]
})
export class LoginSignUpComponent {

  typeInput: string = "password"
  typeForm: string = "login"
  maxDate: Date = new Date()
  loginForm: FormGroup;
  signUpForm: FormGroup;

  constructor(
    private loginStore: LoginSignUpStore
  ) {
    this.loginForm = this.createLoginForm()
    this.signUpForm = this.createSignUpForm()
  }

  createSignUpForm(): FormGroup{
    return new FormGroup({
      name: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      cpf: new FormControl('', [Validators.required, Validators.minLength(11)]),
      birthDate: new FormControl('', [Validators.required]),
    });
  }

  createLoginForm(): FormGroup{
    return new FormGroup({
      cpf: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  filterNumbers(control: string): void {
    this.signUpForm.controls[control].setValue(this.signUpForm.controls[control].value.replace(/\D/g, ''), { emitEvent: false });
  }

  tradeTypeInput(): void{
    this.typeInput = this.typeInput === "password" ? "text" : "password";
  }

  tradeTypeForm(): void{
    this.typeForm = this.typeForm === "login" ? "sign-up" : "login";
  }

  submitLogin(): void{
    this.loginStore.sendLoginRequest$(this.loginForm.value)
  }

  submitSignUp(): void{
    this.loginStore.sendSignUpRequest$(this.signUpForm.value)
  }

}
