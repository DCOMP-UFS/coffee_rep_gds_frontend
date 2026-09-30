import { usePermission } from "@/features/session/hooks";
import type { Reservation } from "./types";

export interface ReservationPermissions {
	/** Criar e cancelar reservas pontuais. */
	canManageSingle: boolean;
	/** Criar e cancelar reservas recorrentes, inclusive uma ocorrência isolada da série. */
	canManageRecurring: boolean;
}

/** Mesma política do backend: ocorrências de uma série só são canceladas pela coordenação. */
export function useReservationPermissions(): ReservationPermissions {
	return {
		canManageSingle: usePermission("reservation.single.manage"),
		canManageRecurring: usePermission("reservation.recurring.manage"),
	};
}

export function canCancelReservation(
	reservation: Pick<Reservation, "recorrenciaId">,
	{ canManageSingle, canManageRecurring }: ReservationPermissions,
): boolean {
	return reservation.recorrenciaId ? canManageRecurring : canManageSingle;
}

export const RECURRING_RESERVATION_HINT = "Reservas recorrentes são feitas pela coordenação.";
