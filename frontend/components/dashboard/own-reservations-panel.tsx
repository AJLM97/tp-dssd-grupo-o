"use client";

import { SectionCard } from "@/components/ui/form-controls";
import {
    formatCurrency,
    formatDateTime,
    hasRentalStarted,
    maintenanceStatusLabel,
    reservationStatusLabel,
} from "@/lib/rentar-mocks";
import type { Reservation, Vehicle } from "@/lib/rentar-types";
import { getEffectiveReservationStatus } from "./dashboard-utils";

type OwnReservationsPanelProps = {
    reservations: Reservation[];
    vehicles: Vehicle[];
    onCancelReservation: (reservationId: number) => void;
};

export function OwnReservationsPanel({
    reservations,
    vehicles,
    onCancelReservation,
}: OwnReservationsPanelProps) {
    const reservasVigentes = reservations.filter(
        (reservation) => reservation.status !== "CANCELADA",
    );
    return (
        <SectionCard
            title="Mis reservas"
            description="Consultá tus reservas y revisá sus detalles."
        >
            {reservasVigentes.length === 0 ? (
                <p className="text-sm text-zinc-600">
                    Todavía no tenés reservas para mostrar.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-zinc-200 text-zinc-600">
                                <th className="py-2">Vehículo</th>
                                <th>Patente</th>
                                <th>Inicio</th>
                                <th>Fin</th>
                                <th>Precio diario</th>
                                <th>Importe total</th>
                                <th>Estado</th>
                                <th>Mantenimiento</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {reservasVigentes.map((reservation) => {
                                const vehicle = vehicles.find(
                                    (item) => item.id === reservation.vehicleId,
                                );
                                const status = getEffectiveReservationStatus(reservation);
                                const canCancel =
                                    reservation.status === "CONFIRMADA" &&
                                    !hasRentalStarted(reservation.startAt);

                                return (
                                    <tr
                                        key={reservation.id}
                                        className="border-b border-zinc-100"
                                    >
                                        <td className="py-2">
                                            {vehicle
                                                ? `${vehicle.brand} ${vehicle.model}`
                                                : "-"}
                                        </td>
                                        <td>{vehicle?.licensePlate ?? "-"}</td>
                                        <td>{formatDateTime(reservation.startAt)}</td>
                                        <td>{formatDateTime(reservation.endAt)}</td>
                                        <td>{formatCurrency(reservation.dailyPrice)}</td>
                                        <td>{formatCurrency(reservation.totalAmount)}</td>
                                        <td>{reservationStatusLabel(status)}</td>
                                        <td>{maintenanceStatusLabel(reservation.maintenanceStatus)}</td>
                                        <td>
                                            {canCancel ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onCancelReservation(reservation.id)
                                                    }
                                                    className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 cursor-pointer"
                                                >
                                                    Cancelar reserva
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </SectionCard>
    );
}