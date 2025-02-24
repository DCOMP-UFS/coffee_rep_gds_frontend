import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class LoaderService {
	private _loader: boolean;

	constructor() {
		this._loader = false;
	}

	public get loader(): boolean {
		return this._loader;
	}

	public set loader(value: boolean) {
		this._loader = value;
	}
}
