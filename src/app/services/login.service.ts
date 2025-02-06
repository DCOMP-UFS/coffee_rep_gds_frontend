import { Injectable } from '@angular/core';
import {LoginRequestModel} from "../models/login-request.model";
import {LoginResponseModel} from "../models/login-response.model";
import {HttpService} from "./http.service";

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private readonly http: HttpService
  ) { }

  login(req: LoginRequestModel){
    return this.http.postWithLoader<LoginResponseModel>('/auth/login', req)
  }

  signUp(req: any){
    return this.http.postWithLoader<LoginResponseModel>('/auth/register', req)
  }
}
