export type VehicleType = "SEDAN" | "SUV" | "PICKUP" | "COUPE" | "HATCHBACK";

export type VehicleState = "DISPONIBLE" | "RESERVADO" | "EN_ALQUILER";

export type ReservationStatus = "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

export type AppRole = "ADMIN" | "CLIENTE";

export type UiSection = "VEHICULOS" | "CLIENTES" | "DISPONIBILIDAD" | "ALTA_RESERVA" | "RESERVAS" | "HISTORIAL";

export type Vehicle = {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  dailyPrice: number;
  state: VehicleState;
  active: boolean;
};

export type Client = {
  id: number;
  document: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  active: boolean;
};

export type Reservation = {
  id: number;
  clientId: number;
  vehicleId: number;
  startAt: string;
  endAt: string;
  dailyPrice: number;
  totalAmount: number;
  status: ReservationStatus;
};

export type VehicleForm = {
  licensePlate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  type: VehicleType;
  dailyPrice: string;
  state: VehicleState;
  active: boolean;
};

export type ClientForm = {
  document: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  active: boolean;
};
