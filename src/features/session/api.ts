import { api } from "@/lib/api/client";
import type { CurrentUser } from "./types";

export const sessionApi = {
	me: (signal?: AbortSignal) => api.get<CurrentUser>("auth/me", undefined, signal),
};
