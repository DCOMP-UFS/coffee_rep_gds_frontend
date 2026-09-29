import { useMemo } from "react";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { MONTH_OPTIONS, withMonth, withYear, yearOptions } from "./month-grid";

interface MonthYearPickerProps {
	/** Primeiro dia do mês exibido. */
	month: Date;
	onChange: (month: Date) => void;
}

/** Salto direto para qualquer mês e ano, ao lado das setas que andam de um em um. */
export function MonthYearPicker({ month, onChange }: MonthYearPickerProps) {
	const displayedYear = month.getFullYear();
	const currentYear = new Date().getFullYear();
	const years = useMemo(
		() => yearOptions(displayedYear, currentYear),
		[displayedYear, currentYear],
	);

	return (
		<div className="flex items-center gap-2">
			<div className="w-32">
				<FilterSelect
					aria-label="Mês"
					value={String(month.getMonth())}
					onChange={(value) => onChange(withMonth(month, Number(value)))}
					options={MONTH_OPTIONS}
				/>
			</div>
			<div className="w-24">
				<FilterSelect
					aria-label="Ano"
					value={String(displayedYear)}
					onChange={(value) => onChange(withYear(month, Number(value)))}
					options={years}
				/>
			</div>
		</div>
	);
}
