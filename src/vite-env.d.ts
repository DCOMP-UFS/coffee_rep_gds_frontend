/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** URL base da API, terminando em `/api` (ex.: `http://localhost:8080/api`). */
	readonly VITE_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
