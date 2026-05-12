import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import {
	HttpTestingController,
	provideHttpTesting,
} from "../../testing/test-providers";
import { HttpService } from "./http.service";
import { LoaderService } from "./loader.service";
import { LoginService } from "./login.service";

describe("LoginService", () => {
	let service: LoginService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				LoginService,
				HttpService,
				LoaderService,
				...provideHttpTesting(),
			],
		});
		service = TestBed.inject(LoginService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpMock.verify());

	it("posts login payload", () => {
		service.login({ cpf: "17055661030", password: "1234" }).subscribe((res) => {
			expect(res.accessToken).toBe("token");
		});

		const req = httpMock.expectOne(`${environment.apiUrl}auth/login`);
		expect(req.request.method).toBe("POST");
		req.flush({ accessToken: "token", expiresIn: 3600 });
	});
});
