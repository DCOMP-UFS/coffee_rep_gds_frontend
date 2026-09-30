import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleRequestSummary } from "@/features/role-requests/hooks";
import { RoleRequestsTab } from "./RoleRequestsTab";
import { UsersTab } from "./UsersTab";

const pendingLabel = (count: number) => (count === 1 ? "1 pendente" : `${count} pendentes`);

export function AdminPage() {
	// A rota já exige a permissão de gerenciar usuários, que vem junto com a de analisar pedidos.
	const summary = useRoleRequestSummary({ enabled: true });
	const pending = summary.data?.pending ?? 0;

	return (
		<>
			<PageHeader
				icon={ShieldCheck}
				title="Administração"
				description="Analise os pedidos de acesso e ajuste o perfil de cada usuário."
			/>

			<Tabs defaultValue="requests" className="gap-4">
				<TabsList>
					<TabsTrigger
						value="requests"
						className="px-4"
						aria-label={pending > 0 ? `Pedidos (${pendingLabel(pending)})` : undefined}
					>
						Pedidos
						{pending > 0 && (
							<span
								aria-hidden="true"
								className="rounded-full bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground tabular-nums"
							>
								{pending}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="users" className="px-4">
						Usuários
					</TabsTrigger>
				</TabsList>
				<TabsContent value="requests">
					<RoleRequestsTab />
				</TabsContent>
				<TabsContent value="users">
					<UsersTab />
				</TabsContent>
			</Tabs>
		</>
	);
}
