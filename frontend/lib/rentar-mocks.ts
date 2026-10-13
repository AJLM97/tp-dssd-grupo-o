import type { Client, ClientForm, Reservation, ReservationStatus, Vehicle, VehicleForm, VehicleState, VehicleType } from "@/lib/rentar-types";

export const VEHICLE_TYPE_OPTIONS: VehicleType[] = ["SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"];
export const VEHICLE_STATE_OPTIONS: VehicleState[] = ["DISPONIBLE", "RESERVADO", "EN_ALQUILER"];
export const RESERVATION_STATUS_OPTIONS: ReservationStatus[] = ["CONFIRMADA", "CANCELADA", "FINALIZADA"];

const now = Date.now();

export function createEmptyVehicle(): VehicleForm {
  return {
    licensePlate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    type: "SEDAN",
    dailyPrice: "",
    state: "DISPONIBLE",
    active: true,
  };
}

export function createEmptyClient(): ClientForm {
  return {
    document: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    active: true,
  };
}

export function buildNextId(items: { id: number }[]): number {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map((item) => item.id)) + 1;
}

export function normalizeDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function overlaps(startA: string, endA: string, startB: Date, endB: Date): boolean {
  const aStart = normalizeDate(startA);
  const aEnd = normalizeDate(endA);
  if (!aStart || !aEnd) {
    return false;
  }

  return aStart < endB && startB < aEnd;
}

export function isVehicleAvailable(vehicleId: number, startAt: Date, endAt: Date, reservations: Reservation[]): boolean {
  return !reservations.some((reservation) => {
    if (reservation.vehicleId !== vehicleId) {
      return false;
    }

    if (reservation.status === "CANCELADA") {
      return false;
    }

    return overlaps(reservation.startAt, reservation.endAt, startAt, endAt);
  });
}

export function calculateDays(startAt: Date, endAt: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = endAt.getTime() - startAt.getTime();
  return Math.max(1, Math.ceil(diff / msPerDay));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string): string {
  const date = normalizeDate(value);
  if (!date) {
    return "-";
  }

  return date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function reservationStatusLabel(status: ReservationStatus): string {
  if (status === "CONFIRMADA") {
    return "CONFIRMADA";
  }

  if (status === "CANCELADA") {
    return "CANCELADA";
  }

  return "FINALIZADA";
}

export function hasRentalStarted(startAt: string): boolean {
  const date = normalizeDate(startAt);
  if (!date) {
    return true;
  }

  return date.getTime() <= Date.now();
}

