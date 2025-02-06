import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {LoaderService} from "./loader.service";
import {finalize, Observable} from "rxjs";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(
    private readonly http: HttpClient,
    private readonly loaderService: LoaderService
  ) { }

  postWithLoader<T>(url: string, body: object): Observable<T> {
    this.loaderService.loader = true;
    return this.http.post<T>(environment.apiUrl + url, body).pipe(
      finalize(() => this.loaderService.loader = false)
    );
  }

}
