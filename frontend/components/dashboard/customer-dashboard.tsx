"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input, SectionCard, Select } from "@/components/ui/form-controls";
import {
  calculateDays,
  formatCurrency,
  formatDateTime,
  normalizeDate,
  reservationStatusLabel,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/rentar-mocks";
import type { Client, Reservation, UiSection, Vehicle, VehicleType } from "@/lib/rentar-types";
import { DEFAULT_AVAILABILITY_FILTERS, type AvailabilityFilters } from "./dashboard-types";

type CustomerDashboardProps = {
  section: UiSection;
  availabilityFilters: AvailabilityFilters;
  setAvailabilityFilters: Dispatch<SetStateAction<AvailabilityFilters>>;
  availableVehicles: Vehicle[];
  vehicles: Vehicle[];
  currentClient: Client | null;
  selectedVehicleId: number | null;
  setSelectedVehicleId: Dispatch<SetStateAction<number | null>>;
  reservationStartAt: string;
  setReservationStartAt: Dispatch<SetStateAction<string>>;
  reservationEndAt: string;
  setReservationEndAt: Dispatch<SetStateAction<string>>;
  reservationPreview: { days: number; dailyPrice: number; total: number } | null;
  onCreateReservation: () => void;
  historyRows: Reservation[];
};

export function CustomerDashboard({
  section,
  availabilityFilters,
  setAvailabilityFilters,
  availableVehicles,
  vehicles,
  currentClient,
  selectedVehicleId,
  setSelectedVehicleId,
  reservationStartAt,
  setReservationStartAt,
  reservationEndAt,
  setReservationEndAt,
  reservationPreview,
  onCreateReservation,
  historyRows,
}: CustomerDashboardProps) {
  return (
    <>
      {section === "DISPONIBILIDAD" ? (
        <div className="grid gap-5">
          <SectionCard title="Pantalla de consulta de disponibilidad" description="Filtros y selectores de fecha/hora. Inicio y fin son obligatorios para buscar disponibilidad real del periodo.">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Input label="Inicio *" type="datetime-local" value={availabilityFilters.startAt} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, startAt: event.target.value }))} />
              <Input label="Fin *" type="datetime-local" value={availabilityFilters.endAt} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, endAt: event.target.value }))} />
              <Select label="Tipo" value={availabilityFilters.vehicleType} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, vehicleType: event.target.value as "" | VehicleType }))}>
                <option value="">Todos</option>
                {VEHICLE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
              <Input label="Marca" value={availabilityFilters.brand} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, brand: event.target.value }))} />
              <Input label="Modelo" value={availabilityFilters.model} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, model: event.target.value }))} />
              <Input label="Precio minimo" type="number" value={availabilityFilters.minDailyPrice} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, minDailyPrice: event.target.value }))} />
              <Input label="Precio maximo" type="number" value={availabilityFilters.maxDailyPrice} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, maxDailyPrice: event.target.value }))} />
              <div className="flex items-end">
                <button type="button" onClick={() => setAvailabilityFilters(DEFAULT_AVAILABILITY_FILTERS)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">Eliminar filtros</button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Listado de disponibles" description="Solo vehiculos activos y libres durante todo el periodo.">
            {!availabilityFilters.startAt || !availabilityFilters.endAt ? <p className="text-sm text-zinc-600">Ingresa fecha/hora de inicio y fin para buscar.</p> : null}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="border-b border-zinc-200 text-zinc-600"><th className="py-2">Patente</th><th>Marca/Modelo</th><th>Ano</th><th>Color</th><th>Tipo</th><th>Precio diario</th></tr></thead>
                <tbody>
                  {availableVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-zinc-100">
                      <td className="py-2 font-medium">{vehicle.licensePlate}</td><td>{`${vehicle.brand} ${vehicle.model}`}</td><td>{vehicle.year}</td><td>{vehicle.color || "-"}</td><td>{vehicle.type}</td><td>{formatCurrency(vehicle.dailyPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {section === "ALTA_RESERVA" ? (
        <SectionCard title="Flujo de creacion de reserva" description="Incluye confirmacion y calculo de importe total con reglas de negocio.">
          <div className="grid gap-3 md:grid-cols-2">
            <Select label="Vehiculo *" value={selectedVehicleId ? String(selectedVehicleId) : ""} onChange={(event) => setSelectedVehicleId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Seleccionar vehiculo</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{`${vehicle.licensePlate} - ${vehicle.brand} ${vehicle.model} (${vehicle.active ? "Activo" : "Inactivo"})`}</option>)}
            </Select>
            <Input label="Inicio *" type="datetime-local" value={reservationStartAt} onChange={(event) => setReservationStartAt(event.target.value)} />
            <Input label="Fin *" type="datetime-local" value={reservationEndAt} onChange={(event) => setReservationEndAt(event.target.value)} />
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 md:col-span-2">
              <p>Cliente actual: {currentClient ? `${currentClient.firstName} ${currentClient.lastName}` : "No seleccionado"}</p>
              <p>Estado cliente: {currentClient?.active ? "Activo" : "Inactivo"}</p>
              {reservationPreview ? <p className="font-semibold text-zinc-900">Vista previa: {reservationPreview.days} dias x {formatCurrency(reservationPreview.dailyPrice)} = {formatCurrency(reservationPreview.total)}</p> : <p>Completa vehiculo + fechas para calcular importe.</p>}
            </div>
            <div><button type="button" onClick={onCreateReservation} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Confirmar reserva</button></div>
          </div>
        </SectionCard>
      ) : null}

      {section === "HISTORIAL" ? (
        <SectionCard title="Historial de alquileres" description="Incluye reservas canceladas y alquileres finalizados del cliente actual.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b border-zinc-200 text-zinc-600"><th className="py-2">Vehiculo</th><th>Patente</th><th>Inicio</th><th>Fin</th><th>Dias</th><th>Importe total</th><th>Estado</th></tr></thead>
              <tbody>
                {historyRows.map((reservation) => {
                  const vehicle = vehicles.find((item) => item.id === reservation.vehicleId);
                  const start = normalizeDate(reservation.startAt);
                  const end = normalizeDate(reservation.endAt);
                  const days = start && end ? calculateDays(start, end) : 0;
                  return (
                    <tr key={reservation.id} className="border-b border-zinc-100">
                      <td className="py-2">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "-"}</td><td>{vehicle?.licensePlate ?? "-"}</td><td>{formatDateTime(reservation.startAt)}</td><td>{formatDateTime(reservation.endAt)}</td><td>{days}</td><td>{formatCurrency(reservation.totalAmount)}</td><td>{reservationStatusLabel(reservation.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}