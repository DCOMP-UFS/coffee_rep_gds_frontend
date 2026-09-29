import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
	className?: string;
}

/** Logo oficial do sistema, o mesmo usado pelo frontend Angular. */
export function BrandLogo({ className }: BrandLogoProps) {
	return <img src={logo} alt="ClinicRoom" className={cn("h-9 w-auto", className)} />;
}
