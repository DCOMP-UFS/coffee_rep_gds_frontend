import { CalendarCheck2, DoorOpen, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { illustrations } from "@/assets/illustrations";
import { AppFooter } from "@/components/layout/AppFooter";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ColdStartBanner } from "@/components/layout/ColdStartBanner";
import { clearToken } from "@/lib/auth/token";

const HIGHLIGHTS = [
	{ icon: DoorOpen, text: "Salas e setores organizados em um só lugar" },
	{ icon: CalendarCheck2, text: "Reservas e disponibilidade em tempo real" },
	{ icon: ShieldCheck, text: "Acesso restrito à equipe do ambulatório" },
];

/**
 * Tela dividida de login e cadastro. Entrar aqui encerra qualquer sessão anterior, como o
 * Angular fazia ao abrir o login.
 */
export function AuthLayout() {
	useEffect(() => {
		clearToken();
	}, []);

	return (
		<div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
			<aside className="relative hidden overflow-hidden bg-primary lg:block">
				<img
					src={illustrations.loginHero}
					alt=""
					className="absolute inset-0 size-full object-cover opacity-90"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-primary via-primary/70 to-primary/10" />
				<div className="relative flex h-full flex-col justify-end gap-6 p-10 text-white xl:p-14">
					<div className="space-y-3">
						<p className="text-sm font-semibold tracking-widest text-sidebar-primary uppercase">
							Ambulatório HU-UFS
						</p>
						<h2 className="max-w-md text-3xl leading-tight font-bold xl:text-4xl">
							Gestão de salas simples, do jeito que o dia a dia pede.
						</h2>
					</div>
					<ul className="space-y-3 text-sm text-white/85">
						{HIGHLIGHTS.map(({ icon: Icon, text }) => (
							<li key={text} className="flex items-center gap-3">
								<span className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
									<Icon className="size-4 text-sidebar-primary" aria-hidden="true" />
								</span>
								{text}
							</li>
						))}
					</ul>
				</div>
			</aside>

			<main className="flex flex-col items-center justify-center gap-6 bg-background px-4 py-10 sm:px-8">
				<div className="w-full max-w-md space-y-6">
					<BrandLogo className="h-11" />
					<ColdStartBanner />
					<div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
						<Outlet />
					</div>
					<p className="text-center text-xs text-muted-foreground">
						Gerenciamento de salas – Ambulatório HU-UFS
					</p>
				</div>
				<AppFooter className="py-0" />
			</main>
		</div>
	);
}
