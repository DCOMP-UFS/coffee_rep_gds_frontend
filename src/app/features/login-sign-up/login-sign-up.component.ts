import { Component } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {LoginSignUpStore} from "./login-sign-up.store";
import {MatFormField, MatFormFieldModule} from '@angular/material/form-field';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatInput, MatInputModule} from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-login',
  templateUrl: './login-sign-up.component.html',
  styleUrls: ['./login-sign-up.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule
  ],
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
