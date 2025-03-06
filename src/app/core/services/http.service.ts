import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, finalize } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoaderService } from "./loader.service";

@Injectable({
	providedIn: "root",
})
export class HttpService {
	constructor(
		private readonly http: HttpClient,
		private readonly loaderService: LoaderService,
	) {}

	postWithLoader<T>(url: string, body: object): Observable<T> {
		this.loaderService.loader = true;
		return this.http.post<T>(environment.apiUrl + url, body).pipe(
			finalize(() => {
				this.loaderService.loader = false;
			}),
		);
	}

	putWithLoader<T>(url: string, body: object): Observable<T> {
		this.loaderService.loader = true;
		return this.http.put<T>(environment.apiUrl + url, body).pipe(
			finalize(() => {
				this.loaderService.loader = false;
			}),
		);
	}

	getWithLoader<T>(url: string, params?: HttpParams): Observable<T> {
		this.loaderService.loader = true;
		return this.http.get<T>(environment.apiUrl + url, { params: params }).pipe(
			finalize(() => {
				this.loaderService.loader = false;
			}),
		);
	}

	getWithoutLoad<T>(url: string, params?: HttpParams): Observable<T> {
		return this.http.get<T>(environment.apiUrl + url, { params: params });
	}

	deleteWithLoader<T>(url: string, params?: HttpParams): Observable<T> {
		this.loaderService.loader = true;
		return this.http
			.delete<T>(environment.apiUrl + url, { params: params })
			.pipe(
				finalize(() => {
					this.loaderService.loader = false;
				}),
			);
	}

	patchWithLoad<T>(url: string, body: object): Observable<T> {
		this.loaderService.loader = true;
		return this.http.patch<T>(environment.apiUrl + url, body).pipe(
			finalize(() => {
				this.loaderService.loader = false;
			}),
		);
	}
}
