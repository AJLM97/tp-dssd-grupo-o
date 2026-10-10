"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input, SectionCard, Select } from "@/components/ui/form-controls";
import {
  formatCurrency,
  formatDateTime,
  hasRentalStarted,
  reservationStatusLabel,
  RESERVATION_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/rentar-mocks";
import type { AppRole, Client, Reservation, Vehicle } from "@/lib/rentar-types";
import { getEffectiveReservationStatus } from "./dashboard-utils";
import type { ReservationFilters } from "./dashboard-types";

type ReservationsPanelProps = {
  role: AppRole;
  currentClientId: number;
  clients: Client[];
  vehicles: Vehicle[];
  reservations: Reservation[];
  filters: ReservationFilters;
  setFilters: Dispatch<SetStateAction<ReservationFilters>>;
  onCancelReservation: (reservationId: number) => void;
};

export function ReservationsPanel({
  role,
  currentClientId,
  clients,
  vehicles,
  reservations,
  filters,
  setFilters,
  onCancelReservation,
}: ReservationsPanelProps) {
  return (
    <div className="grid gap-5">
      <SectionCard title="Pantalla de consulta de reservas activas" description="Vista unificada para cliente/admin con filtros opcionales y boton de cancelacion.">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Select label="Cliente" value={filters.clientId} onChange={(event) => setFilters((current) => ({ ...current, clientId: event.target.value }))}>
            <option value="">Todos</option>{clients.map((client) => <option key={client.id} value={client.id}>{`${client.firstName} ${client.lastName}`}</option>)}
          </Select>
          <Select label="Vehiculo" value={filters.vehicleId} onChange={(event) => setFilters((current) => ({ ...current, vehicleId: event.target.value }))}>
            <option value="">Todos</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{`${vehicle.licensePlate} - ${vehicle.brand}`}</option>)}
          </Select>
          <Select label="Tipo" value={filters.vehicleType} onChange={(event) => setFilters((current) => ({ ...current, vehicleType: event.target.value as "" | typeof VEHICLE_TYPE_OPTIONS[number] }))}>
            <option value="">Todos</option>{VEHICLE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Select label="Estado" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ReservationFilters["status"] }))}>
            <option value="">Todos</option>{RESERVATION_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Input label="Desde" type="datetime-local" value={filters.startAt} onChange={(event) => setFilters((current) => ({ ...current, startAt: event.target.value }))} />
          <Input label="Hasta" type="datetime-local" value={filters.endAt} onChange={(event) => setFilters((current) => ({ ...current, endAt: event.target.value }))} />
        </div>
      </SectionCard>

      <SectionCard title="Listado de reservas" description="Cliente ve solo sus reservas. Admin ve todas.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-zinc-200 text-zinc-600"><th className="py-2">Cliente</th><th>Vehiculo</th><th>Patente</th><th>Inicio</th><th>Fin</th><th>Precio diario</th><th>Importe total</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {reservations.map((reservation) => {
                const client = clients.find((item) => item.id === reservation.clientId);
                const vehicle = vehicles.find((item) => item.id === reservation.vehicleId);
                const status = getEffectiveReservationStatus(reservation);
                const canCancel = role === "CLIENTE" && reservation.clientId === currentClientId && reservation.status === "CONFIRMADA" && !hasRentalStarted(reservation.startAt);
                return (
                  <tr key={reservation.id} className="border-b border-zinc-100">
                    <td className="py-2">{client ? `${client.firstName} ${client.lastName}` : "-"}</td><td>{vehicle ? `${vehicle.brand} ${vehicle.model}` : "-"}</td><td>{vehicle?.licensePlate ?? "-"}</td><td>{formatDateTime(reservation.startAt)}</td><td>{formatDateTime(reservation.endAt)}</td><td>{formatCurrency(reservation.dailyPrice)}</td><td>{formatCurrency(reservation.totalAmount)}</td><td>{reservationStatusLabel(status)}</td>
                    <td>{canCancel ? <button type="button" onClick={() => onCancelReservation(reservation.id)} className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Cancelar reserva</button> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}