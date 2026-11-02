export type VehicleType = "SEDAN" | "SUV" | "PICKUP" | "COUPE" | "HATCHBACK";

export type VehicleState = "DISPONIBLE" | "RESERVADO" | "EN_ALQUILER";

export type VehicleVerification = "PENDIENTE" | "VALIDADO" | "ROBADO";

export type ReservationStatus = "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

export type MaintenanceStatus = "PENDIENTE" | "REALIZADO" | "NO_REALIZADO";

export type AppRole = "ADMIN" | "CLIENTE";

export type UiSection = "VEHICULOS" | "CLIENTES" | "DISPONIBILIDAD" | "ALTA_RESERVA" | "RESERVAS" | "HISTORIAL" | "MIS_VEHICULOS";

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
  verification?: VehicleVerification | number | null;
};

export type Client = {
  id: number;
  document: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
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
  maintenanceStatus?: MaintenanceStatus;
  vehicleType?: VehicleType;
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
  password: string;
  active: boolean;
};
