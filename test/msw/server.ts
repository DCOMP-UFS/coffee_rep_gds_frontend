import { setupServer } from "msw/node";

/**
 * Servidor MSW compartilhado. Começa sem handlers: cada teste declara exatamente as rotas
 * que a tela deve chamar, o que torna o contrato HTTP explícito no próprio teste.
 */
export const server = setupServer();

/** Mesma URL definida em `test.env.VITE_API_URL` no `vite.config.ts`. */
export const API_URL = "http://api.test/api";

export const apiUrl = (path: string) => `${API_URL}/${path}`;
