import { Clock } from "lucide-react";
import { useDelayedFlag, useIsBusy } from "@/hooks/use-is-busy";
import { cn } from "@/lib/utils";

/** Mesmo limiar do `LoaderService` do Angular. */
export const COLD_START_DELAY_MS = 3000;

/** Aviso exibido quando uma requisição demora, típico do cold start do backend na Vercel. */
export function ColdStartBanner({ className }: { className?: string }) {
	const slow = useDelayedFlag(useIsBusy(), COLD_START_DELAY_MS);
	if (!slow) return null;

	return (
		<div
			role="status"
			className={cn(
				"flex animate-in items-center gap-3 rounded-lg border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning fade-in slide-in-from-top-1",
				className,
			)}
		>
			<Clock className="size-4 shrink-0" aria-hidden="true" />
			<span>
				O servidor pode estar iniciando — isso pode levar alguns segundos na primeira requisição.
			</span>
		</div>
	);
}
