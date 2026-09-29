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
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { BrandLogo } from "./BrandLogo";
import { NAVIGATION_ITEMS } from "./navigation";

const MENU_BUTTON_CLASSES =
	"h-10 gap-3 text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:[&>svg]:text-sidebar-primary";

export function AppSidebar() {
	const { pathname } = useLocation();
	const { isMobile, setOpenMobile } = useSidebar();
	const logout = useLogout();

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
							{NAVIGATION_ITEMS.map(({ label, path, icon: Icon }) => (
								<SidebarMenuItem key={path}>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith(path)}
										tooltip={label}
										className={MENU_BUTTON_CLASSES}
									>
										<NavLink to={path} onClick={closeOnMobile}>
											<Icon aria-hidden="true" />
											<span>{label}</span>
										</NavLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
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
