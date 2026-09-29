import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@test": fileURLToPath(new URL("./test", import.meta.url)),
		},
	},
	server: {
		port: 5173,
	},
	build: {
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{
							// Só bibliotecas da primeira tela, que mudam pouco entre deploys e ficam no cache.
							// Um grupo genérico de node_modules traria de volta o código das telas lazy.
							name: "react-vendor",
							test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@tanstack[\\/]react-query|@tanstack[\\/]query-core)[\\/]/,
						},
					],
				},
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
		css: false,
		// Testes de tela digitam e navegam com o user-event; com todos os arquivos em paralelo, os
		// 5 s padrão não bastam em máquinas mais lentas.
		testTimeout: 15_000,
		// A URL da API nos testes é fixa: os handlers do MSW a usam para casar as requisições.
		env: {
			VITE_API_URL: "http://api.test/api",
		},
	},
});
