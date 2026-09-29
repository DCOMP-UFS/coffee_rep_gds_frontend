import type { CalendarReservationFilters, ReservationListFilters } from "./types";

export const reservationKeys = {
	all: ["reservations"] as const,
	list: (filters: ReservationListFilters) => [...reservationKeys.all, "list", filters] as const,
	calendar: (filters: CalendarReservationFilters) =>
		[...reservationKeys.all, "calendar", filters] as const,
};
