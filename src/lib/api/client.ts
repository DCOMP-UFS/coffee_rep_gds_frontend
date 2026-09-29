import { getToken } from "@/lib/auth/token";
import { API_BASE_URL } from "@/lib/config";
import { ApiError } from "./errors";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
	method?: HttpMethod;
	/** Parâmetros de query. Valores `undefined` e `null` são omitidos. */
	query?: QueryParams;
	/** Corpo serializado como JSON. `undefined` significa requisição sem corpo. */
	body?: unknown;
	signal?: AbortSignal;
}

/** Mesma regra do `authInterceptor` do Angular: o login nunca recebe o token. */
function shouldAttachToken(path: string): boolean {
	return !path.includes("login");
}

export function buildUrl(path: string, query?: QueryParams): string {
	const url = `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
	if (!query) return url;

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== null) params.append(key, String(value));
	}

	const search = params.toString();
	return search ? `${url}?${search}` : url;
}

async function readBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return undefined;

	const isJson = response.headers.get("content-type")?.includes("application/json");
	if (!isJson) return text;

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", query, body, signal } = options;

	const headers = new Headers({ Accept: "application/json" });
	if (body !== undefined) headers.set("Content-Type", "application/json");

	const token = getToken();
	if (token && shouldAttachToken(path)) headers.set("Authorization", `Bearer ${token}`);

	const response = await fetch(buildUrl(path, query), {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
		signal,
	});

	const payload = await readBody(response);

	if (!response.ok) {
		throw new ApiError(response.status, path, payload);
	}

	return payload as T;
}

export const api = {
	get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
		apiRequest<T>(path, { query, signal }),
	post: <T = void>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
	put: <T = void>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
	patch: <T = void>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
	delete: <T = void>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
