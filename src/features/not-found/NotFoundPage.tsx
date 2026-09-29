import { Link } from "react-router-dom";
import { illustrations } from "@/assets/illustrations";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
	return (
		<main className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
			<BrandLogo className="h-10" />
			<img src={illustrations.lostPage} alt="" className="h-52 w-auto select-none" />
			<p className="text-sm font-semibold tracking-widest text-brand-blue uppercase">Erro 404</p>
			<h1 className="text-2xl font-bold text-primary">Página não encontrada</h1>
			<p className="max-w-sm text-sm text-muted-foreground">
				O endereço acessado não existe ou foi alterado.
			</p>
			<Button asChild>
				<Link to="/rooms">Voltar para o início</Link>
			</Button>
		</main>
	);
}
