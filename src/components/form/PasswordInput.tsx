import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Campo de senha com botão para mostrar/ocultar, com os mesmos rótulos do Angular. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<Input {...props} type={visible ? "text" : "password"} className={cn("pr-10", className)} />
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
				aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
				aria-pressed={visible}
				onClick={() => setVisible((current) => !current)}
			>
				{visible ? <EyeOff /> : <Eye />}
			</Button>
		</div>
	);
}
