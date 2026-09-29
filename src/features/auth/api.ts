import { api } from "@/lib/api/client";

export interface LoginRequest {
	/** Só dígitos. */
	cpf: string;
	password: string;
}

export interface LoginResponse {
	accessToken: string;
}

export interface SignUpRequest {
	name: string;
	/** Só dígitos. */
	phone: string;
	password: string;
	email: string;
	/** Só dígitos. */
	cpf: string;
	/** `yyyy-MM-dd`. */
	birthDate: string;
}

export const authApi = {
	login: (body: LoginRequest) => api.post<LoginResponse>("auth/login", body),
	signUp: (body: SignUpRequest) => api.post("auth/register", body),
};
