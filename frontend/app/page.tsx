"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Select } from "@/components/ui/form-controls";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { ReservationsPanel } from "@/components/dashboard/reservations-panel";
import {
  DEFAULT_AVAILABILITY_FILTERS,
  DEFAULT_RESERVATION_FILTERS,
  type AvailabilityFilters,
  type ReservationFilters,
} from "@/components/dashboard/dashboard-types";
import { getEffectiveReservationStatus } from "@/components/dashboard/dashboard-utils";
import { client as apolloClient } from "@/lib/apollo-client";
import {
  QUERY_VEHICULOS_DISPONIBLES,
  QUERY_RESERVAS,
  QUERY_HISTORIAL_CLIENTE,
} from "@/lib/graphql";
import {
  createEmptyClient,
  createEmptyVehicle,
  normalizeDate,
  overlaps,
  calculateDays,
} from "@/lib/rentar-mocks";
import {
  fetchVehiculos,
  saveVehiculo,
  deleteVehiculoApi,
  fetchClientes,
  saveCliente,
  deleteClienteApi,
  postReserva,
  putCancelarReserva,
} from "@/lib/api-rest";
import type {
  AppRole,
  Client,
  ClientForm,
  Reservation,
  UiSection,
  Vehicle,
  VehicleForm,
} from "@/lib/rentar-types";

const SECTION_LABELS: Record<UiSection, string> = {
  VEHICULOS: "Flota",
  CLIENTES: "Clientes",
  DISPONIBILIDAD: "Disponibilidad",
  ALTA_RESERVA: "Nueva reserva",
  RESERVAS: "Reservas",
  HISTORIAL: "Mi historial",
};

export default function Home() {
  const [role, setRole] = useState<AppRole>("CLIENTE");
  const [section, setSection] = useState<UiSection>("DISPONIBILIDAD");

  useEffect(() => {
    localStorage.setItem("activeUserId", role === "ADMIN" ? "1" : "2");
  }, [role]);

  const reloadData = async () => {
    try {
      const [vehData, cliData] = await Promise.all([
        fetchVehiculos(),
        fetchClientes(),
      ]);

      const mappedVehicles = vehData.map((v: any) => ({
        id: v.id,
        licensePlate: v.patente || v.licensePlate,
        brand: v.marca || v.brand,
        model: v.modelo || v.model,
        year: v.anio || v.year,
        color: v.color || "",
        type: v.tipo || v.type,
        dailyPrice: Number(v.precioDiario || v.dailyPrice),
        state: v.estado || v.state,
        active: v.activo !== undefined ? v.activo : v.active,
      }));

      const mappedClients = cliData.map((c: any) => ({
        id: c.id,
        document: c.documento || c.document,
        firstName: c.nombre || c.firstName,
        lastName: c.apellido || c.lastName,
        email: c.email,
        phone: c.telefono || c.phone || "",
        birthDate: c.fechaNacimiento || c.birthDate || "",
        active: c.activo !== undefined ? c.activo : c.active,
      }));

      setVehicles(mappedVehicles);
      setClients(mappedClients);

      if (mappedClients.length > 0 && currentClientId === 0) {
        setCurrentClientId(mappedClients[0].id);
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error.message);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(createEmptyVehicle());
  const [vehicleEditingId, setVehicleEditingId] = useState<number | null>(null);

  const [clientForm, setClientForm] = useState<ClientForm>(createEmptyClient());
  const [clientEditingId, setClientEditingId] = useState<number | null>(null);

  const [availabilityFilters, setAvailabilityFilters] = useState<AvailabilityFilters>(DEFAULT_AVAILABILITY_FILTERS);
  const [reservationFilters, setReservationFilters] = useState<ReservationFilters>(DEFAULT_RESERVATION_FILTERS);

  const [currentClientId, setCurrentClientId] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [reservationStartAt, setReservationStartAt] = useState("");
  const [reservationEndAt, setReservationEndAt] = useState("");
  const [feedback, setFeedback] = useState("");

  const currentClient = useMemo(() => clients.find((client) => client.id === currentClientId) ?? null, [clients, currentClientId]);

  const filteredReservations = useMemo(() => {
    const startFilter = normalizeDate(reservationFilters.startAt);
    const endFilter = normalizeDate(reservationFilters.endAt);

    return reservations.filter((reservation) => {
      const vehicle = vehicles.find((item) => item.id === reservation.vehicleId);

      if (role === "CLIENTE" && reservation.clientId !== currentClientId) {
        return false;
      }

      if (reservationFilters.clientId && reservation.clientId !== Number(reservationFilters.clientId)) {
        return false;
      }

      if (reservationFilters.vehicleId && reservation.vehicleId !== Number(reservationFilters.vehicleId)) {
        return false;
      }

      if (reservationFilters.vehicleType && vehicle?.type !== reservationFilters.vehicleType) {
        return false;
      }

      if (reservationFilters.status && getEffectiveReservationStatus(reservation) !== reservationFilters.status) {
        return false;
      }

      if (startFilter && endFilter && !overlaps(reservation.startAt, reservation.endAt, startFilter, endFilter)) {
        return false;
      }

      return true;
    });
  }, [currentClientId, reservationFilters, reservations, role, vehicles]);

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function cargarDisponibilidad() {
      if (!availabilityFilters.startAt || !availabilityFilters.endAt) {
        setAvailableVehicles([]);
        return;
      }

      try {
        const response = await apolloClient.query({
          query: QUERY_VEHICULOS_DISPONIBLES,
          variables: {
            filtros: {
              fechaInicio: new Date(availabilityFilters.startAt).toISOString(),
              fechaFin: new Date(availabilityFilters.endAt).toISOString(),
              tipo: availabilityFilters.vehicleType || undefined,
              marca: availabilityFilters.brand || undefined,
              modelo: availabilityFilters.model || undefined,
              precioDiarioMin: availabilityFilters.minDailyPrice ? Number(availabilityFilters.minDailyPrice) : undefined,
              precioDiarioMax: availabilityFilters.maxDailyPrice ? Number(availabilityFilters.maxDailyPrice) : undefined,
            },
          },
          fetchPolicy: "network-only",
        });

        const data = response.data as { vehiculosDisponibles: any[] };

        const mapped = data.vehiculosDisponibles.map((v: any) => ({
          id: v.id,
          licensePlate: v.patente,
          brand: v.marca,
          model: v.modelo,
          year: v.anio,
          color: v.color || "",
          type: v.tipo,
          dailyPrice: Number(v.precioDiario),
          state: v.estado,
          active: v.activo,
        }));

        setAvailableVehicles(mapped);
      } catch (err: any) {
        console.error("Error al consultar disponibilidad vía GraphQL:", err.message);
      }
    }

    cargarDisponibilidad();
  }, [availabilityFilters]);

  useEffect(() => {
    async function cargarReservasGraphQL() {
      if (section !== "RESERVAS") return;

      try {
        const response = await apolloClient.query({
          query: QUERY_RESERVAS,
          variables: {
            filtros: {
              clienteId: reservationFilters.clientId ? Number(reservationFilters.clientId) : undefined,
              vehiculoId: reservationFilters.vehicleId ? Number(reservationFilters.vehicleId) : undefined,
              tipoVehiculo: reservationFilters.vehicleType || undefined,
              estado: reservationFilters.status || undefined,
              fechaInicio: reservationFilters.startAt ? new Date(reservationFilters.startAt).toISOString() : undefined,
              fechaFin: reservationFilters.endAt ? new Date(reservationFilters.endAt).toISOString() : undefined,
            },
          },
          fetchPolicy: "network-only",
        });

        const data = response.data as { reservas: any[] };

        const mappedReservations = data.reservas.map((r: any) => ({
          id: r.id,
          clientId: r.cliente?.id,
          vehicleId: r.vehiculo?.id,
          startAt: r.fechaInicio,
          endAt: r.fechaFin,
          dailyPrice: Number(r.precioDiario),
          totalAmount: Number(r.importeTotal),
          status: r.estado,
        }));

        setReservations(mappedReservations);
      } catch (err: any) {
        console.error("Error al cargar reservas vía GraphQL:", err.message);
      }
    }

    cargarReservasGraphQL();
  }, [section, reservationFilters, role]);

  const reservationPreview = useMemo(() => {
    const vehicle = vehicles.find((item) => item.id === selectedVehicleId);
    const startAt = normalizeDate(reservationStartAt);
    const endAt = normalizeDate(reservationEndAt);

    if (!vehicle || !startAt || !endAt || endAt <= startAt) {
      return null;
    }

    const days = calculateDays(startAt, endAt);
    return {
      days,
      dailyPrice: vehicle.dailyPrice,
      total: days * vehicle.dailyPrice,
    };
  }, [reservationEndAt, reservationStartAt, selectedVehicleId, vehicles]);

  const activeSections: UiSection[] =
    role === "ADMIN"
      ? ["VEHICULOS", "CLIENTES", "RESERVAS"]
      : ["DISPONIBILIDAD", "ALTA_RESERVA", "RESERVAS", "HISTORIAL"];

  function clearVehicleForm() {
    setVehicleForm(createEmptyVehicle());
    setVehicleEditingId(null);
  }

  function clearClientForm() {
    setClientForm(createEmptyClient());
    setClientEditingId(null);
  }

  async function handleVehicleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    if (!vehicleForm.licensePlate || !vehicleForm.brand || !vehicleForm.model || !vehicleForm.year || !vehicleForm.dailyPrice) {
      setFeedback("Completa los campos obligatorios de vehiculo.");
      return;
    }

    try {
      const payload = {
        patente: vehicleForm.licensePlate.trim().toUpperCase(),
        marca: vehicleForm.brand.trim(),
        modelo: vehicleForm.model.trim(),
        anio: Number(vehicleForm.year),
        color: vehicleForm.color.trim(),
        tipo: vehicleForm.type,
        precioDiario: Number(vehicleForm.dailyPrice),
        estado: vehicleForm.state,
        activo: vehicleForm.active,
      };

      await saveVehiculo(payload, vehicleEditingId !== null, vehicleEditingId ?? undefined);
      await reloadData();
      clearVehicleForm();
      setFeedback(vehicleEditingId ? "Vehículo actualizado en el backend." : "Vehículo añadido correctamente.");
    } catch (err: any) {
      setFeedback(err.message);
    }
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    if (!clientForm.document || !clientForm.firstName || !clientForm.lastName || !clientForm.email) {
      setFeedback("Completa los campos obligatorios de cliente.");
      return;
    }

    try {
      const payload = {
        documento: clientForm.document.trim(),
        nombre: clientForm.firstName.trim(),
        apellido: clientForm.lastName.trim(),
        email: clientForm.email.trim().toLowerCase(),
        telefono: clientForm.phone.trim(),
        fechaNacimiento: clientForm.birthDate,
        activo: clientForm.active,
      };

      await saveCliente(payload, clientEditingId !== null, clientEditingId ?? undefined);
      await reloadData();
      clearClientForm();
      setFeedback(clientEditingId ? "Cliente actualizado en el backend." : "Cliente añadido correctamente.");
    } catch (err: any) {
      setFeedback(err.message);
    }
  }

  async function handleVehicleDelete(id: number) {
    try {
      await deleteVehiculoApi(id);
      await reloadData();
      setFeedback("Baja lógica de vehículo realizada.");
    } catch (err: any) {
      setFeedback(err.message);
    }
  }

  async function handleClientDelete(id: number) {
    try {
      await deleteClienteApi(id);
      await reloadData();
      setFeedback("Baja lógica de cliente realizada.");
    } catch (err: any) {
      setFeedback(err.message);
    }
  }

  function handleRoleChange(newRole: AppRole) {
    setRole(newRole);
    const userId = newRole === "ADMIN" ? "1" : "2";
    localStorage.setItem("activeUserId", userId);

    if (newRole === "ADMIN") {
      setSection("VEHICULOS");
    } else {
      setSection("DISPONIBILIDAD");
    }
  }

  function startVehicleEdition(vehicle: Vehicle) {
    setVehicleEditingId(vehicle.id);
    setVehicleForm({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: String(vehicle.year),
      color: vehicle.color,
      type: vehicle.type,
      dailyPrice: String(vehicle.dailyPrice),
      state: vehicle.state,
      active: vehicle.active,
    });
    setSection("VEHICULOS");
  }

  function startClientEdition(client: Client) {
    setClientEditingId(client.id);
    setClientForm({
      document: client.document,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      birthDate: client.birthDate,
      active: client.active,
    });
    setSection("CLIENTES");
  }

  async function handleCreateReservation() {
    setFeedback("");

    if (!currentClient || !selectedVehicleId || !reservationStartAt || !reservationEndAt) {
      setFeedback("Completa cliente, vehículo y rango de fechas.");
      return;
    }

    try {
      await postReserva({
        clienteId: currentClient.id,
        vehiculoId: selectedVehicleId,
        fechaInicio: new Date(reservationStartAt).toISOString(),
        fechaFin: new Date(reservationEndAt).toISOString(),
      });

      await reloadData();
      setSelectedVehicleId(null);
      setReservationStartAt("");
      setReservationEndAt("");
      setFeedback("Reserva confirmada e ingresada en el backend.");
    } catch (err: any) {
      setFeedback(err.message);
    }
  }

  async function handleCancelReservation(reservationId: number) {
    setFeedback("");

    try {
      await putCancelarReserva(reservationId);
      await reloadData();
      setFeedback("Reserva cancelada en el backend.");
    } catch (err: any) {
      setFeedback(err.message);
    }
  }

  useEffect(() => {
    async function cargarHistorial() {
      if (section !== "HISTORIAL") return;

      try {
        const response = await apolloClient.query({
          query: QUERY_HISTORIAL_CLIENTE,
          fetchPolicy: "network-only",
        });

        const data = response.data as { historialCliente: any[] };

        setHistoryRows(data.historialCliente);
      } catch (err: any) {
        console.error("Error al consultar historial vía GraphQL:", err.message);
      }
    }

    cargarHistorial();
  }, [section]);

  return (
    <main className="rentar-app min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="rentar-dashboard-header rounded-xl bg-zinc-800 px-5 py-4 text-white shadow-lg">
          <div className="dashboard-title-row">
            <div>
              <BrandMark />
              <p className="dashboard-caption">MOVILIDAD, A TU MANERA</p>
            </div>
            <Link className="dashboard-account-link" href="/login">Acceso <span aria-hidden="true">↗</span></Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Select
              label="Rol"
              labelClassName="text-zinc-50"
              selectClassName="border-zinc-200 bg-zinc-100 text-zinc-800"
              value={role}
              onChange={(event) => handleRoleChange(event.target.value as AppRole)}
            >
              <option value="CLIENTE">CLIENTE</option>
              <option value="ADMIN">ADMIN</option>
            </Select>

            <Select
              label="Cliente de prueba"
              labelClassName="text-zinc-50"
              selectClassName="border-zinc-200 bg-zinc-100 text-zinc-800"
              value={String(currentClientId)}
              onChange={(event) => setCurrentClientId(Number(event.target.value))}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{`${client.firstName} ${client.lastName} (${client.active ? "Activo" : "Inactivo"})`}</option>
              ))}
            </Select>

            <div className="rounded-md border border-zinc-500 bg-zinc-700 px-3 py-2 text-sm">
              <p className="font-medium">Reglas clave activas</p>
              <p className="text-zinc-100">Patente unica/inmutable, baja logica, cliente inactivo no reserva, cancelacion antes del inicio.</p>
            </div>
          </div>
        </header>

        <nav className="rentar-section-nav flex flex-wrap gap-2" aria-label="Secciones del panel">
          {activeSections.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={`rentar-nav-button rounded-md px-3 py-2 text-sm font-medium ${section === item ? "bg-emerald-600 text-white" : "bg-white text-zinc-700 hover:bg-zinc-200"}`}
            >
              {SECTION_LABELS[item]}
            </button>
          ))}
        </nav>

        {feedback ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{feedback}</div> : null}

        {section === "RESERVAS" ? (
          <ReservationsPanel
            role={role}
            currentClientId={currentClientId}
            clients={clients}
            vehicles={vehicles}
            reservations={filteredReservations}
            filters={reservationFilters}
            setFilters={setReservationFilters}
            onCancelReservation={handleCancelReservation}
          />
        ) : role === "ADMIN" ? (
          <AdminDashboard
            section={section}
            vehicles={vehicles}
            clients={clients}
            vehicleForm={vehicleForm}
            vehicleEditingId={vehicleEditingId}
            setVehicleForm={setVehicleForm}
            onVehicleSubmit={handleVehicleSubmit}
            onClearVehicleForm={clearVehicleForm}
            onStartVehicleEdition={startVehicleEdition}
            onVehicleDelete={handleVehicleDelete}
            clientForm={clientForm}
            clientEditingId={clientEditingId}
            setClientForm={setClientForm}
            onClientSubmit={handleClientSubmit}
            onClearClientForm={clearClientForm}
            onStartClientEdition={startClientEdition}
            onClientDelete={handleClientDelete}
          />
        ) : (
          <CustomerDashboard
            section={section}
            availabilityFilters={availabilityFilters}
            setAvailabilityFilters={setAvailabilityFilters}
            availableVehicles={availableVehicles}
            vehicles={vehicles}
            currentClient={currentClient}
            selectedVehicleId={selectedVehicleId}
            setSelectedVehicleId={setSelectedVehicleId}
            reservationStartAt={reservationStartAt}
            setReservationStartAt={setReservationStartAt}
            reservationEndAt={reservationEndAt}
            setReservationEndAt={setReservationEndAt}
            reservationPreview={reservationPreview}
            onCreateReservation={handleCreateReservation}
            historyRows={historyRows}
          />
        )}
      </div>
    </main>
  );
}
