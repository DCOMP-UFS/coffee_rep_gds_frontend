import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { createQueryClient } from "@/lib/query-client";
import { AppShell } from "./AppShell";
import { ServerWarmUp } from "./ServerWarmUp";

export function App() {
	const [queryClient] = useState(createQueryClient);

	return (
		<BrowserRouter>
			<AppShell queryClient={queryClient}>
				<ServerWarmUp />
			</AppShell>
		</BrowserRouter>
	);
}
