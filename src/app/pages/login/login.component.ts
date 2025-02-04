import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  typeInput: string = "password"

  tradeTypeInput(): void{
    this.typeInput = this.typeInput === "password" ? "text" : "password";
  }
}
