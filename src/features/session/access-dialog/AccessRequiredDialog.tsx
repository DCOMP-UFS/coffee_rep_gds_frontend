import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { accessSummary, PERMISSION_REQUIREMENTS } from "../access";
import type { Permission } from "../types";
import { AccessExplanation, AccessPrimaryAction } from "./AccessExplanation";

export const ACCESS_REQUIRED_TITLE = "Acesso necessário";

interface AccessRequiredDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	permission: Permission;
	feature: string;
}

export function AccessRequiredDialog({
	open,
	onOpenChange,
	permission,
	feature,
}: AccessRequiredDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader className="items-center sm:items-start">
					<span className="flex size-10 items-center justify-center rounded-full bg-warning-soft text-warning">
						<Lock className="size-5" aria-hidden="true" />
					</span>
					<DialogTitle>{ACCESS_REQUIRED_TITLE}</DialogTitle>
					<DialogDescription>
						{accessSummary(feature, PERMISSION_REQUIREMENTS[permission])}
					</DialogDescription>
				</DialogHeader>
				<AccessExplanation permission={permission} />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Entendi</Button>
					</DialogClose>
					<AccessPrimaryAction permission={permission} onNavigate={() => onOpenChange(false)} />
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
