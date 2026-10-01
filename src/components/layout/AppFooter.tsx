import { cn } from "@/lib/utils";
import { copyrightNotice, DEVELOPER_LINKS, DEVELOPER_NAME, DEVELOPER_ROLE } from "./developer";

export const DEVELOPER_CONTACT_LABEL = "Contato do desenvolvedor";

/**
 * Tamanho dos ícones de contato e da área de clique de cada um. Precisa ser uma classe literal do
 * Tailwind, porque classes montadas em tempo de execução não são geradas: `size-6` = 24px,
 * `size-8` = 32px, `size-10` = 40px, `size-12` = 48px, ou um valor exato como `size-[44px]`.
 */
const CONTACT_ICON_SIZE = "size-8";

interface AppFooterProps {
	className?: string;
}

/** Rodapé comum a todas as telas: crédito de desenvolvimento e contatos do desenvolvedor. */
export function AppFooter({ className }: AppFooterProps) {
	return (
		<footer
			className={cn(
				"flex flex-col items-center justify-center gap-2 px-4 py-4 text-center text-muted-foreground",
				className,
			)}
		>
			<nav aria-label={DEVELOPER_CONTACT_LABEL}>
				<ul className="flex items-center justify-center gap-3">
					{DEVELOPER_LINKS.map(({ label, href, icon: Icon, brandColorClass }) => (
						<li key={label}>
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								title={label}
								className={cn(
									"inline-flex items-center justify-center rounded-md transition outline-none hover:-translate-y-0.5 hover:opacity-85 focus-visible:ring-[3px] focus-visible:ring-ring/50",
									brandColorClass,
								)}
							>
								<Icon className={CONTACT_ICON_SIZE} />
								<span className="sr-only">{label} (abre em nova aba)</span>
							</a>
						</li>
					))}
				</ul>
			</nav>
			<div className="space-y-0.5">
				<p className="text-sm">
					Desenvolvido por <strong className="font-semibold text-primary">{DEVELOPER_NAME}</strong>
					<span aria-hidden="true"> · </span>
					<span className="sr-only">, </span>
					<span className="font-medium text-foreground/80">{DEVELOPER_ROLE}</span>
				</p>
				<p className="text-xs">{copyrightNotice()}</p>
			</div>
		</footer>
	);
}
