import { CircleCheck, DoorClosed, DoorOpen, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRoomCount } from "./hooks";

interface SummaryCardProps {
	label: string;
	icon: LucideIcon;
	iconClassName: string;
	ocupada: boolean | null;
}

function SummaryCard({ label, icon: Icon, iconClassName, ocupada }: SummaryCardProps) {
	const count = useRoomCount(ocupada);

	return (
		<div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
			<span className={cn("flex size-11 items-center justify-center rounded-lg", iconClassName)}>
				<Icon className="size-5" aria-hidden="true" />
			</span>
			<dl>
				<dt className="text-sm text-muted-foreground">{label}</dt>
				<dd className="text-2xl font-bold text-foreground">
					{count.isPending ? <Skeleton className="mt-1 h-7 w-12" /> : (count.data ?? "—")}
				</dd>
			</dl>
		</div>
	);
}

/** Visão geral de todas as salas, independente dos filtros da tabela. */
export function RoomsSummary() {
	return (
		<section aria-label="Resumo das salas" className="grid gap-4 sm:grid-cols-3">
			<SummaryCard
				label="Total de salas"
				icon={DoorOpen}
				iconClassName="bg-accent text-accent-foreground"
				ocupada={null}
			/>
			<SummaryCard
				label="Ocupadas"
				icon={DoorClosed}
				iconClassName="bg-destructive/10 text-destructive"
				ocupada={true}
			/>
			<SummaryCard
				label="Livres"
				icon={CircleCheck}
				iconClassName="bg-success-soft text-success"
				ocupada={false}
			/>
		</section>
	);
}
