import type { ComponentType } from "react";
import {
	type BrandIconProps,
	GitHubIcon,
	LinkedInIcon,
	WhatsAppIcon,
} from "@/components/icons/brand-icons";

export const DEVELOPER_NAME = "Guilherme R. Alves";
export const DEVELOPER_ROLE = "Engenheiro de Software";

/** (79) 99900-7075, com o DDI do Brasil exigido pelo `wa.me`. */
const DEVELOPER_WHATSAPP = "+55 (79) 99900-7075";

export interface DeveloperLink {
	label: string;
	href: string;
	icon: ComponentType<BrandIconProps>;
	/** Cor oficial da marca, como classe literal do Tailwind para ser gerada no build. */
	brandColorClass: string;
}

/** Link de conversa do WhatsApp; o `wa.me` só aceita dígitos (DDI + DDD + número). */
export function whatsappUrl(phone: string): string {
	return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function copyrightNotice(year: number = new Date().getFullYear()): string {
	return `© ${year} Todos os direitos reservados.`;
}

export const DEVELOPER_LINKS: readonly DeveloperLink[] = [
	{
		label: "WhatsApp",
		href: whatsappUrl(DEVELOPER_WHATSAPP),
		icon: WhatsAppIcon,
		brandColorClass: "text-[#25D366]",
	},
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/in/guigorosario/",
		icon: LinkedInIcon,
		brandColorClass: "text-[#0A66C2]",
	},
	{
		label: "GitHub",
		href: "https://github.com/athena272",
		icon: GitHubIcon,
		brandColorClass: "text-foreground",
	},
];
