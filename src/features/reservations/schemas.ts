import { addDays, format, getISODay } from "date-fns";
import { z } from "zod";
import { brDateToIsoDate, parseBrDateParts, validateBrDate } from "@/shared/validators/date";
import { brDateSchema, timeSchema } from "@/shared/validators/schemas";
import { isEndAfterStart } from "@/shared/validators/time";
import type { ReservationWriteDto } from "./types";

const BR_DATE_FORMAT = "dd/MM/yyyy";
/** Período padrão da lista: de hoje até daqui a 30 dias, como no Angular. */
const DEFAULT_PERIOD_DAYS = 30;

/** Dias oferecidos na reserva recorrente, na numeração ISO que o backend usa (1 = segunda). */
export const WEEKDAYS = [
	{ value: 1, label: "Segunda" },
	{ value: 2, label: "Terça" },
	{ value: 3, label: "Quarta" },
	{ value: 4, label: "Quinta" },
	{ value: 5, label: "Sexta" },
	{ value: 6, label: "Sábado" },
] as const;

const isFilledValidDate = (value: string) => value.trim() !== "" && validateBrDate(value) === null;

// ---------------------------------------------------------------------------------------------
// Período da lista

export const PERIOD_END_BEFORE_START_MESSAGE =
	"A data final deve ser igual ou posterior à data inicial.";

export const reservationPeriodSchema = z
	.object({
		inicio: brDateSchema("a data inicial"),
		fim: brDateSchema("a data final"),
	})
	.superRefine(({ inicio, fim }, ctx) => {
		if (!isFilledValidDate(inicio) || !isFilledValidDate(fim)) return;
		if (brDateToIsoDate(inicio) > brDateToIsoDate(fim)) {
			ctx.addIssue({ code: "custom", path: ["fim"], message: PERIOD_END_BEFORE_START_MESSAGE });
		}
	});

export type ReservationPeriodInput = z.input<typeof reservationPeriodSchema>;

/** Hoje e hoje + 30 no horário local do navegador, em `DD/MM/AAAA`. */
export function defaultReservationPeriod(now: Date = new Date()): ReservationPeriodInput {
	return {
		inicio: format(now, BR_DATE_FORMAT),
		fim: format(addDays(now, DEFAULT_PERIOD_DAYS), BR_DATE_FORMAT),
	};
}

// ---------------------------------------------------------------------------------------------
// Formulário de nova reserva

export const RESERVATION_MESSAGES = {
	section: "Selecione o setor.",
	room: "Selecione a sala.",
	requester: "Selecione o solicitante.",
	startTime: "Informe o horário de início.",
	endTime: "Informe o horário de fim.",
	endTimeBeforeStart: "O horário de fim deve ser posterior ao início.",
	endDateBeforeStart: "A data de fim deve ser igual ou posterior à data de início.",
	weekdaysRequired: "Selecione ao menos um dia da semana.",
	weekdaysOutsidePeriod: "Nenhum dos dias escolhidos cai dentro do período.",
} as const;

export type ReservationType = "pontual" | "recorrente";

/** Id escolhido num select; sem escolha o campo fica `null`. */
const selectedId = (message: string) =>
	z
		.number()
		.nullable()
		.refine((id) => id !== null && id > 0, message);

/**
 * Valida uma data `DD/MM/AAAA` obrigatória cujo rótulo depende do tipo de reserva. Devolve se
 * ela é válida, para as regras entre campos só compararem datas válidas.
 */
function checkBrDate(value: string, label: string, path: string, ctx: z.RefinementCtx): boolean {
	if (value.trim() === "") {
		ctx.addIssue({ code: "custom", path: [path], message: `Informe ${label}.` });
		return false;
	}
	const error = validateBrDate(value);
	if (error === "dateMask") {
		ctx.addIssue({
			code: "custom",
			path: [path],
			message: "Informe a data no formato DD/MM/AAAA.",
		});
	} else if (error === "dateInvalid") {
		ctx.addIssue({ code: "custom", path: [path], message: "Data inválida." });
	}
	return error === null;
}

/** Dias da semana ISO que ocorrem entre as duas datas, inclusive. Basta olhar uma semana. */
function weekdaysInPeriod(startBr: string, endBr: string): Set<number> {
	const start = parseBrDateParts(startBr);
	const end = parseBrDateParts(endBr);
	const days = new Set<number>();
	if (!start || !end) return days;

	const first = new Date(start.year, start.month - 1, start.day);
	const last = new Date(end.year, end.month - 1, end.day);
	for (let day = first, count = 0; day <= last && count < 7; day = addDays(day, 1), count++) {
		days.add(getISODay(day));
	}
	return days;
}

// Só verificações que não interrompem a validação: assim a regra entre campos abaixo sempre
// roda, e todos os erros aparecem juntos, mesmo com os selects ainda vazios.
export const reservationFormSchema = z
	.object({
		setorId: selectedId(RESERVATION_MESSAGES.section),
		salaId: selectedId(RESERVATION_MESSAGES.room),
		solicitanteId: selectedId(RESERVATION_MESSAGES.requester),
		tipo: z.enum(["pontual", "recorrente"]),
		dataInicio: z.string(),
		dataFim: z.string(),
		horaInicio: timeSchema(RESERVATION_MESSAGES.startTime),
		horaFim: timeSchema(RESERVATION_MESSAGES.endTime),
		dias: z.array(z.number().int().min(1).max(7)),
	})
	.superRefine((values, ctx) => {
		if (!isEndAfterStart(values.horaInicio, values.horaFim)) {
			ctx.addIssue({
				code: "custom",
				path: ["horaFim"],
				message: RESERVATION_MESSAGES.endTimeBeforeStart,
			});
		}

		if (values.tipo === "pontual") {
			checkBrDate(values.dataInicio, "a data da reserva", "dataInicio", ctx);
			return;
		}

		const startValid = checkBrDate(values.dataInicio, "a data de início", "dataInicio", ctx);
		const endValid = checkBrDate(values.dataFim, "a data de fim", "dataFim", ctx);
		const periodValid =
			startValid &&
			endValid &&
			brDateToIsoDate(values.dataInicio) <= brDateToIsoDate(values.dataFim);
		if (startValid && endValid && !periodValid) {
			ctx.addIssue({
				code: "custom",
				path: ["dataFim"],
				message: RESERVATION_MESSAGES.endDateBeforeStart,
			});
		}

		if (values.dias.length === 0) {
			ctx.addIssue({
				code: "custom",
				path: ["dias"],
				message: RESERVATION_MESSAGES.weekdaysRequired,
			});
		} else if (periodValid) {
			const available = weekdaysInPeriod(values.dataInicio, values.dataFim);
			if (!values.dias.some((day) => available.has(day))) {
				ctx.addIssue({
					code: "custom",
					path: ["dias"],
					message: RESERVATION_MESSAGES.weekdaysOutsidePeriod,
				});
			}
		}
	})
	// Só chega aqui com os ids preenchidos; o `?? 0` apenas estreita o tipo.
	.transform(({ setorId: _setorId, salaId, solicitanteId, ...rest }) => ({
		...rest,
		salaId: salaId ?? 0,
		solicitanteId: solicitanteId ?? 0,
	}));

export type ReservationFormInput = z.input<typeof reservationFormSchema>;
export type ReservationFormValues = z.output<typeof reservationFormSchema>;

export const emptyReservationForm = (): ReservationFormInput => ({
	setorId: null,
	salaId: null,
	solicitanteId: null,
	tipo: "pontual",
	dataInicio: "",
	dataFim: "",
	horaInicio: "",
	horaFim: "",
	dias: [],
});

/**
 * Pontual: início e fim no mesmo dia. Recorrente: as datas delimitam o período e os horários
 * valem para cada ocorrência, como o backend espera.
 */
export function toReservationWriteDto(values: ReservationFormValues): ReservationWriteDto {
	const startDate = brDateToIsoDate(values.dataInicio);
	const recurring = values.tipo === "recorrente";
	const endDate = recurring ? brDateToIsoDate(values.dataFim) : startDate;

	return {
		salaId: values.salaId,
		solicitanteId: values.solicitanteId,
		horaInicio: `${startDate}T${values.horaInicio}:00`,
		horaFim: `${endDate}T${values.horaFim}:00`,
		fixo: recurring,
		observacoes: "",
		...(recurring && { dias: [...values.dias].sort((a, b) => a - b) }),
	};
}
