import { normalizeDate } from "@/lib/rentar-mocks";
import type { Reservation, ReservationStatus } from "@/lib/rentar-types";

export function getEffectiveReservationStatus(reservation: Reservation): ReservationStatus {
  if (reservation.status !== "CONFIRMADA") {
    return reservation.status;
  }

  const endAt = normalizeDate(reservation.endAt);
  if (endAt && endAt.getTime() < Date.now()) {
    return "FINALIZADA";
  }

  return reservation.status;
}