import type { Client, ClientForm, Reservation, ReservationStatus, Vehicle, VehicleForm, VehicleState, VehicleType } from "@/lib/rentar-types";

export const VEHICLE_TYPE_OPTIONS: VehicleType[] = ["SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"];
export const VEHICLE_STATE_OPTIONS: VehicleState[] = ["DISPONIBLE", "RESERVADO", "EN_ALQUILER"];
export const RESERVATION_STATUS_OPTIONS: ReservationStatus[] = ["CONFIRMADA", "CANCELADA", "FINALIZADA"];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 1,
    licensePlate: "AA123BB",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    color: "Gris",
    type: "SEDAN",
    dailyPrice: 52000,
    state: "DISPONIBLE",
    active: true,
  },
  {
    id: 2,
    licensePlate: "AB987CD",
    brand: "Ford",
    model: "Ranger",
    year: 2021,
    color: "Blanco",
    type: "PICKUP",
    dailyPrice: 79000,
    state: "RESERVADO",
    active: true,
  },
  {
    id: 3,
    licensePlate: "AC456EF",
    brand: "Volkswagen",
    model: "Taos",
    year: 2023,
    color: "Azul",
    type: "SUV",
    dailyPrice: 68000,
    state: "DISPONIBLE",
    active: true,
  },
  {
    id: 4,
    licensePlate: "AD111GH",
    brand: "Peugeot",
    model: "208",
    year: 2020,
    color: "Negro",
    type: "HATCHBACK",
    dailyPrice: 47000,
    state: "DISPONIBLE",
    active: false,
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 1,
    document: "30111222",
    firstName: "Luz",
    lastName: "Mendez",
    email: "luz.mendez@example.com",
    phone: "11-4455-6677",
    birthDate: "1993-04-10",
    active: true,
  },
  {
    id: 2,
    document: "28999111",
    firstName: "Martin",
    lastName: "Rios",
    email: "martin.rios@example.com",
    phone: "11-3344-8899",
    birthDate: "1988-09-21",
    active: true,
  },
  {
    id: 3,
    document: "35555777",
    firstName: "Noelia",
    lastName: "Sosa",
    email: "noelia.sosa@example.com",
    phone: "11-5522-1199",
    birthDate: "1996-12-01",
    active: false,
  },
];

const now = Date.now();

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    clientId: 1,
    vehicleId: 2,
    startAt: new Date(now + 1000 * 60 * 60 * 24 * 3).toISOString(),
    endAt: new Date(now + 1000 * 60 * 60 * 24 * 5).toISOString(),
    dailyPrice: 79000,
    totalAmount: 158000,
    status: "CONFIRMADA",
  },
  {
    id: 2,
    clientId: 1,
    vehicleId: 1,
    startAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    endAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    dailyPrice: 52000,
    totalAmount: 156000,
    status: "CONFIRMADA",
  },
  {
    id: 3,
    clientId: 2,
    vehicleId: 3,
    startAt: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(),
    endAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
    dailyPrice: 68000,
    totalAmount: 204000,
    status: "CANCELADA",
  },
];

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

