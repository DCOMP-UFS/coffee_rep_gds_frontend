import { LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useRoleRequestSummary } from "@/features/role-requests/hooks";
import { useCurrentUser } from "@/features/session/hooks";
import { BrandLogo } from "./BrandLogo";
import { NAVIGATION_ITEMS, type NavigationPath } from "./navigation";

/** Item que mostra o número de pedidos de acesso pendentes. */
const ADMIN_PATH: NavigationPath = "/admin";

const pendingLabel = (count: number) =>
	count === 1 ? "1 pedido pendente" : `${count} pedidos pendentes`;

const MENU_BUTTON_CLASSES =
	"h-10 gap-3 text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:[&>svg]:text-sidebar-primary";

export function AppSidebar() {
	const { pathname } = useLocation();
	const { isMobile, setOpenMobile } = useSidebar();
	const logout = useLogout();
	const { data: currentUser } = useCurrentUser();
	const permissions = currentUser?.permissions ?? [];
	const items = NAVIGATION_ITEMS.filter(
		(item) => !item.permission || permissions.includes(item.permission),
	);
	const summary = useRoleRequestSummary({ enabled: permissions.includes("roleRequests.review") });
	const pendingRequests = summary.data?.pending ?? 0;

	const closeOnMobile = () => {
		if (isMobile) setOpenMobile(false);
	};

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="p-3">
				<div className="flex items-center justify-center rounded-lg bg-white px-3 py-2 shadow-sm group-data-[collapsible=icon]:p-1">
					<BrandLogo className="h-8 group-data-[collapsible=icon]:hidden" />
					<img
						src="/favicon-32.png"
						alt="ClinicRoom"
						className="hidden size-6 group-data-[collapsible=icon]:block"
					/>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="text-sidebar-foreground/60">Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map(({ label, path, icon: Icon }) => {
								const badge = path === ADMIN_PATH && pendingRequests > 0 ? pendingRequests : 0;
								return (
									<SidebarMenuItem key={path}>
										<SidebarMenuButton
											asChild
											isActive={pathname.startsWith(path)}
											tooltip={badge ? `${label} (${pendingLabel(badge)})` : label}
											className={MENU_BUTTON_CLASSES}
										>
											<NavLink to={path} onClick={closeOnMobile}>
												<Icon aria-hidden="true" />
												<span>{label}</span>
												{badge > 0 && <span className="sr-only">, {pendingLabel(badge)}</span>}
											</NavLink>
										</SidebarMenuButton>
										{badge > 0 && (
											<SidebarMenuBadge
												aria-hidden="true"
												className="rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground peer-data-[size=default]/menu-button:top-2.5"
											>
												{badge > 99 ? "99+" : badge}
											</SidebarMenuBadge>
										)}
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Sair" onClick={logout} className={MENU_BUTTON_CLASSES}>
							<LogOut aria-hidden="true" />
							<span>Sair</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
