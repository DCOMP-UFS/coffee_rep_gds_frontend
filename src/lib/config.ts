const DEFAULT_API_URL = "http://localhost:8080/api";

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * URL base da API, sem barra final. Os caminhos dos serviços são relativos a ela
 * (ex.: `section`, `room/section/3`), como no `environment.apiUrl` do frontend Angular.
 */
export const API_BASE_URL = withoutTrailingSlash(import.meta.env.VITE_API_URL || DEFAULT_API_URL);
