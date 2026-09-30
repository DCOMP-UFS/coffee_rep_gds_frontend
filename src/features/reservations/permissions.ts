import { useMemo } from "react";
import { type Access, useAccess } from "@/features/session/access-dialog/useAccess";
import type { Reservation } from "./types";

export interface ReservationAccess {
	/** Criar e cancelar reservas pontuais. */
	single: Access;
	/** Criar e cancelar reservas recorrentes, inclusive uma ocorrência isolada da série. */
	recurring: Access;
}

export function useReservationAccess(): ReservationAccess {
	const single = useAccess("reservation.single.manage", "Criar e cancelar reservas pontuais");
	const recurring = useAccess(
		"reservation.recurring.manage",
		"Criar e cancelar reservas recorrentes, inclusive uma ocorrência da série",
	);
	return useMemo(() => ({ single, recurring }), [single, recurring]);
}

/** Mesma política do backend: ocorrências de uma série só são canceladas pela coordenação. */
export function cancelAccessFor(
	reservation: Pick<Reservation, "recorrenciaId">,
	access: ReservationAccess,
): Access {
	return reservation.recorrenciaId ? access.recurring : access.single;
}

export const RECURRING_RESERVATION_HINT = "Reservas recorrentes são feitas pela coordenação.";
