import type { Client, ClientForm, MaintenanceStatus, Reservation, ReservationStatus, Vehicle, VehicleForm, VehicleState, VehicleType, VehicleVerification } from "@/lib/rentar-types";

export const VEHICLE_TYPE_OPTIONS: VehicleType[] = ["SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"];
export const VEHICLE_STATE_OPTIONS: VehicleState[] = ["DISPONIBLE", "RESERVADO", "EN_ALQUILER"];
export const RESERVATION_STATUS_OPTIONS: ReservationStatus[] = ["CONFIRMADA", "CANCELADA", "FINALIZADA"];

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SEDAN: "Sedán",
  SUV: "SUV",
  PICKUP: "Pickup",
  COUPE: "Coupé",
  HATCHBACK: "Hatchback",
};

const VEHICLE_TYPE_LABELS_BY_NUMBER: Record<number, string> = {
  1: "Sedán",
  2: "SUV",
  3: "Pickup",
  4: "Coupé",
  5: "Hatchback",
};

const VEHICLE_STATE_LABELS: Record<VehicleState, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  EN_ALQUILER: "En alquiler",
};

const VEHICLE_STATE_LABELS_BY_NUMBER: Record<number, string> = {
  1: "Disponible",
  2: "Reservado",
  3: "En alquiler",
};

const VEHICLE_VERIFICATION_LABELS: Record<VehicleVerification, string> = {
  PENDIENTE: "Pendiente",
  VALIDADO: "Validado",
  ROBADO: "Robado",
};

const VEHICLE_VERIFICATION_LABELS_BY_NUMBER: Record<number, string> = {
  1: "Pendiente",
  2: "Validado",
  3: "Robado",
};

const now = Date.now();

export function vehicleTypeLabel(type: VehicleType | number): string {
  return typeof type === "number"
    ? VEHICLE_TYPE_LABELS_BY_NUMBER[type] ?? `Tipo desconocido (${type})`
    : VEHICLE_TYPE_LABELS[type];
}

export function vehicleStateLabel(state: VehicleState | number): string {
  return typeof state === "number"
    ? VEHICLE_STATE_LABELS_BY_NUMBER[state] ?? `Estado desconocido (${state})`
    : VEHICLE_STATE_LABELS[state];
}

export function vehicleVerificationLabel(
  verification: VehicleVerification | number | null | undefined,
): string {
  if (typeof verification === "number") {
    return VEHICLE_VERIFICATION_LABELS_BY_NUMBER[verification] ?? "Sin información";
  }

  if (!verification) {
    return "Sin información";
  }

  return VEHICLE_VERIFICATION_LABELS[verification] ?? "Sin información";
}

export function isVehicleVerificationPending(
  verification: VehicleVerification | number | null | undefined,
): boolean {
  return verification === "PENDIENTE" || verification === 1;
}

export function isVehicleStolen(
  verification: VehicleVerification | number | null | undefined,
): boolean {
  return verification === "ROBADO" || verification === 3;
}

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

export function maintenanceStatusLabel(
  status: MaintenanceStatus | null | undefined,
): string {
  switch (status ?? "PENDIENTE") {
    case "REALIZADO":
      return "COMPLEADO";
    case "NO_REALIZADO":
      return "NO SE PUDO COMPLETAR";
    default:
      return "EN REVISIÓN";
  }
}

export function hasRentalStarted(startAt: string): boolean {
  const date = normalizeDate(startAt);
  if (!date) {
    return true;
  }

  return date.getTime() <= Date.now();
}
