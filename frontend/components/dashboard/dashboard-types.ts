import type { ReservationStatus, VehicleType } from "@/lib/rentar-types";

export type ReservationFilters = {
  clientId: string;
  vehicleId: string;
  vehicleType: "" | VehicleType;
  status: "" | ReservationStatus;
  startAt: string;
  endAt: string;
};

export type AvailabilityFilters = {
  startAt: string;
  endAt: string;
  vehicleType: "" | VehicleType;
  brand: string;
  model: string;
  minDailyPrice: string;
  maxDailyPrice: string;
};

export const DEFAULT_AVAILABILITY_FILTERS: AvailabilityFilters = {
  startAt: "",
  endAt: "",
  vehicleType: "",
  brand: "",
  model: "",
  minDailyPrice: "",
  maxDailyPrice: "",
};

export const DEFAULT_RESERVATION_FILTERS: ReservationFilters = {
  clientId: "",
  vehicleId: "",
  vehicleType: "",
  status: "",
  startAt: "",
  endAt: "",
};