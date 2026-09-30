import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import "@/lib/zod";

import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Elemento #root não encontrado no index.html.");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
		<Analytics />
	</StrictMode>,
);
