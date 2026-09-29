import { onlyDigits } from "./br-format";

/**
 * Máscaras aplicadas enquanto o usuário digita, no lugar do `ngx-mask`. Cada uma aceita
 * qualquer texto e devolve a forma parcial formatada, limitada ao tamanho da máscara.
 */

/** Aplica um padrão em que `0` representa um dígito, ex.: `000.000.000-00`. */
function applyDigitPattern(value: string, pattern: string): string {
	const digits = onlyDigits(value);
	let result = "";
	let digitIndex = 0;

	for (const char of pattern) {
		if (digitIndex >= digits.length) break;
		if (char === "0") {
			result += digits[digitIndex];
			digitIndex++;
		} else {
			result += char;
		}
	}

	return result;
}

export const maskCpf = (value: string) => applyDigitPattern(value, "000.000.000-00");

export const maskPhone = (value: string) => applyDigitPattern(value, "(00) 00000-0000");

/** Fixo `(00) 0000-0000` até 10 dígitos; celular `(00) 00000-0000` com 11. */
export const maskFlexiblePhone = (value: string) =>
	applyDigitPattern(value, onlyDigits(value).length > 10 ? "(00) 00000-0000" : "(00) 0000-0000");

/** Porte de `formatDateInput` do Angular: `01012024` → `01/01/2024`. */
export const maskDate = (value: string) => applyDigitPattern(value, "00/00/0000");

/** Porte de `formatTimeValue` do Angular: limita horas a 23 e minutos a 59. */
export function maskTime(value: string): string {
	const digits = onlyDigits(value).slice(0, 4);

	let hours = digits.slice(0, 2);
	let minutes = digits.slice(2, 4);

	if (hours && Number.parseInt(hours, 10) > 23) hours = "23";
	if (minutes && Number.parseInt(minutes, 10) > 59) minutes = "59";

	return digits.length <= 2 ? hours : `${hours}:${minutes}`;
}
