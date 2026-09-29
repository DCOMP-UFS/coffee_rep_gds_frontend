import { Check, ChevronsUpDown } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { normalizeSearch } from "@/shared/format/search";
import { SELECT_PLACEHOLDER_VALUE } from "./SelectPlaceholderItem";

export interface SelectOption<TValue extends string | number> {
	value: TValue;
	label: string;
}

interface SearchableSelectProps<TValue extends string | number>
	extends Omit<ComponentProps<typeof Button>, "value" | "onChange"> {
	options: readonly SelectOption<TValue>[];
	value: TValue | null | undefined;
	onChange: (value: TValue) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
}

/**
 * Select com busca por texto, no lugar do `ngx-mat-select-search`. A busca considera só o
 * rótulo da opção, nunca o id.
 */
export function SearchableSelect<TValue extends string | number>({
	options,
	value,
	onChange,
	placeholder = "Selecione",
	searchPlaceholder = "Pesquisar...",
	emptyMessage = "Nenhum resultado encontrado.",
	className,
	...triggerProps
}: SearchableSelectProps<TValue>) {
	const [open, setOpen] = useState(false);
	const selected = options.find((option) => option.value === value);

	return (
		// Modal: dentro de um Dialog, a trava de rolagem dele bloquearia a roda do mouse na lista,
		// que é renderizada fora do diálogo. Aberta como modal, a lista passa a ser a trava ativa.
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						"w-full justify-between font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
					{...triggerProps}
				>
					<span className="truncate">{selected?.label ?? placeholder}</span>
					<ChevronsUpDown className="opacity-50" aria-hidden="true" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start">
				<Command
					filter={(_value, search, keywords) =>
						normalizeSearch(keywords?.join(" ") ?? "").includes(normalizeSearch(search)) ? 1 : 0
					}
				>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							<CommandItem value={SELECT_PLACEHOLDER_VALUE} keywords={[]} disabled>
								<Check className="opacity-0" aria-hidden="true" />
								{placeholder}
							</CommandItem>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={String(option.value)}
									keywords={[option.label]}
									onSelect={() => {
										onChange(option.value);
										setOpen(false);
									}}
								>
									<Check
										className={cn(option.value === value ? "opacity-100" : "opacity-0")}
										aria-hidden="true"
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
