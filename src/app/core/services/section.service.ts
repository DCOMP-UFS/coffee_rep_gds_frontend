import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { SectionResponseModel } from "../models/section-response.model";
import { HttpService } from "./http.service";

/** Body para criar/atualizar setor (alinhado ao CreateSectionDTO do backend). */
export interface SectionWriteDto {
	nome: string;
	observacao?: string | null;
}

@Injectable({
	providedIn: "root",
})
export class SectionService {
	constructor(private readonly http: HttpService) {}

	/**
	 * Lista todos os setores ativos (backend retorna array JSON quando unpaged=true).
	 */
	getSections(): Observable<SectionResponseModel> {
		const params = new HttpParams().set("unpaged", "true");
		return this.http
			.getWithoutLoad<SectionResponseModel | unknown[]>("section", params)
			.pipe(
				map((res) => {
					if (Array.isArray(res)) {
						return {
							content: res as SectionResponseModel["content"],
						};
					}
					return res as SectionResponseModel;
				}),
			);
	}

	createSection(body: SectionWriteDto): Observable<void> {
		return this.http.postWithLoader<void>("section", body);
	}

	updateSection(id: number, body: SectionWriteDto): Observable<void> {
		return this.http.putWithLoader<void>(`section/${id}`, body);
	}

	deleteSection(id: number): Observable<void> {
		return this.http.deleteWithLoader<void>(`section/${id}`);
	}
}
