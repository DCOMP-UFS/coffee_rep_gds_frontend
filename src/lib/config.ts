const LOCAL_API_URL = "http://localhost:8080/api";
/** Mesma API do `environment.prod.ts` do Angular: o build de produção funciona sem configurar nada. */
const PUBLISHED_API_URL = "https://api-gestao-salas.vercel.app/api";

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

const defaultApiUrl = () => (import.meta.env.PROD ? PUBLISHED_API_URL : LOCAL_API_URL);

/**
 * URL base da API, sem barra final. Os caminhos dos serviços são relativos a ela
 * (ex.: `section`, `room/section/3`), como no `environment.apiUrl` do frontend Angular.
 */
export const API_BASE_URL = withoutTrailingSlash(import.meta.env.VITE_API_URL || defaultApiUrl());
