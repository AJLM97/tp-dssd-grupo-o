"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
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
  crearVehiculo,
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
import { OwnReservationsPanel } from "./own-reservations-panel";

const SECTION_LABELS: Record<UiSection, string> = {
  VEHICULOS: "Flota",
  CLIENTES: "Clientes",
  DISPONIBILIDAD: "Disponibilidad",
  ALTA_RESERVA: "Nueva reserva",
  RESERVAS: "Reservas",
  HISTORIAL: "Mi historial",
};

function normalizarId(id: unknown): number {
  let resultado: number;

  if (typeof id === "number" || typeof id === "string") {
    resultado = Number(id);
  } else if (
    id !== null &&
    typeof id === "object" &&
    "low" in id &&
    "high" in id
  ) {
    const valor = id as { low: number; high: number };
    resultado = valor.high * 0x100000000 + (valor.low >>> 0);
  } else {
    throw new Error("El backend devolvió un ID con formato inválido.");
  }

  if (!Number.isSafeInteger(resultado) || resultado <= 0) {
    throw new Error("El backend devolvió un ID inválido.");
  }

  return resultado;
}

export default function DashboardWorkspace({ role }: { role: AppRole }) {
  const isLoggingOut = useRef(false);
  const [section, setSection] = useState<UiSection>(role === "ADMIN" ? "VEHICULOS" : "DISPONIBILIDAD");

  useEffect(() => {
    if (isLoggingOut.current) return;

    const sesionGuardada = localStorage.getItem("rentar-session");
    if (!sesionGuardada) return;

    const sesion = JSON.parse(sesionGuardada) as { user: { id: number } };
    localStorage.setItem("activeUserId", String(sesion.user.id));
  }, [role]);

  const reloadData = async () => {
    try {
      const [vehData, cliData] = await Promise.all([
        fetchVehiculos(),
        fetchClientes(),
      ]);

      const mappedVehicles = vehData.map((v: any) => ({
        id: normalizarId(v.id),
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
        id: normalizarId(c.id),
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

      if (role === "CLIENTE" && reservation.clientId !== currentClientId) {
        return false;
      }

      if (reservationFilters.clientId && reservation.clientId !== Number(reservationFilters.clientId)) {
        return false;
      }

      if (reservationFilters.vehicleId && reservation.vehicleId !== Number(reservationFilters.vehicleId)) {
        return false;
      }

      if (
        reservationFilters.vehicleType &&
        reservation.vehicleType !== reservationFilters.vehicleType
      ) {
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
        const sesionGuardada = localStorage.getItem("rentar-session");
        const sesion = sesionGuardada
          ? (JSON.parse(sesionGuardada) as { user?: { id?: number } })
          : null;

        const clienteId =
          role === "CLIENTE"
            ? sesion?.user?.id
            : reservationFilters.clientId
              ? Number(reservationFilters.clientId)
              : undefined;

        if (role === "CLIENTE" && !clienteId) {
          throw new Error("La sesión no contiene un ID de cliente válido.");
        }

        const response = await apolloClient.query({
          query: QUERY_RESERVAS,
          variables: {
            filtros: {
              clienteId:
                role === "CLIENTE"
                  ? clienteId
                  : reservationFilters.clientId
                    ? Number(reservationFilters.clientId)
                    : undefined,
              vehiculoId: reservationFilters.vehicleId ? Number(reservationFilters.vehicleId) : undefined,
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
          vehicleType: r.vehiculo?.tipo,
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

      const sesionGuardada = localStorage.getItem("rentar-session");
      const sesion = sesionGuardada
        ? (JSON.parse(sesionGuardada) as { access_token?: string })
        : null;
      const accessToken = sesion?.access_token;

      if (!accessToken) {
        setFeedback("No se encontró el token de sesión. Iniciá sesión nuevamente.");
        return;
      }

      if (vehicleEditingId !== null) {
        await saveVehiculo(payload, true, vehicleEditingId, accessToken);
      } else {
        await crearVehiculo(
          {
            patente: payload.patente,
            marca: payload.marca,
            modelo: payload.modelo,
            anio: payload.anio,
            color: payload.color,
            tipo: payload.tipo,
            precioDiario: payload.precioDiario,
          },
          accessToken,
        );
      }
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
      const sesionGuardada = localStorage.getItem("rentar-session");
      const sesion = sesionGuardada
        ? (JSON.parse(sesionGuardada) as { access_token?: string })
        : null;
      const accessToken = sesion?.access_token;

      if (!accessToken) {
        setFeedback("No se encontró el token de sesión. Iniciá sesión nuevamente.");
        return;
      }

      const payload = {
        documento: clientForm.document.trim(),
        nombre: clientForm.firstName.trim(),
        apellido: clientForm.lastName.trim(),
        email: clientForm.email.trim().toLowerCase(),
        ...(clientEditingId === null
          ? { password: clientForm.password }
          : {}),
        telefono: clientForm.phone.trim(),
        fechaNacimiento: clientForm.birthDate,
        activo: clientForm.active,
      };

      await saveCliente(
        payload,
        clientEditingId !== null,
        clientEditingId ?? undefined,
        accessToken,
      );
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
      password: "",
      active: client.active,
    });
    setSection("CLIENTES");
  }

  async function handleCreateReservation() {
    setFeedback("");

    const sesionGuardada = localStorage.getItem("rentar-session");
    const sesion = sesionGuardada
      ? (JSON.parse(sesionGuardada) as { user?: { id?: number } })
      : null;

    const clienteId = role === "CLIENTE" ? sesion?.user?.id : currentClient?.id;

    const vehiculoSeleccionado = vehicles.find(
      (vehiculo) => vehiculo.id === selectedVehicleId,
    );

    if (
      clienteId === undefined ||
      clienteId <= 0 ||
      !vehiculoSeleccionado ||
      vehiculoSeleccionado.dailyPrice <= 0 ||
      !reservationStartAt ||
      !reservationEndAt
    ) {
      setFeedback("Completa cliente, vehículo con precio válido y rango de fechas.");
      return;
    }

    try {
      await postReserva({
        clienteId,
        vehiculoId: vehiculoSeleccionado.id,
        precioDiario: vehiculoSeleccionado.dailyPrice,
        fechaInicio: reservationStartAt,
        fechaFin: reservationEndAt,
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
      setReservations((actuales) =>
        actuales.filter((reserva) => reserva.id !== reservationId),
      );
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

        setHistoryRows(
          data.historialCliente.map((reserva: any) => ({
            id: normalizarId(reserva.id),
            vehicleId: reserva.vehiculo?.id ? normalizarId(reserva.vehiculo.id) : 0,
            startAt: reserva.fechaInicio,
            endAt: reserva.fechaFin,
            dailyPrice: Number(reserva.precioDiario ?? 0),
            totalAmount: Number(reserva.importeTotal),
            status: reserva.estado,
          })),
        );
      } catch (err: any) {
        console.error("Error al consultar historial vía GraphQL:", err.message);
      }
    }

    cargarHistorial();
  }, [section]);

  function handleLogout() {
    isLoggingOut.current = true;
    localStorage.removeItem("activeUserId");
    localStorage.removeItem("rentar-session");
  }

  return (
    <main className="rentar-app min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="rentar-dashboard-header rounded-xl bg-zinc-800 px-5 py-4 text-white shadow-lg">
          <div className="dashboard-title-row">
            <div>
              <BrandMark />
              <p className="dashboard-caption">MOVILIDAD, A TU MANERA</p>
            </div>
            <Link className="dashboard-account-link" href="/login" onClick={handleLogout}>
              Cerrar sesión <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-md border border-zinc-500 bg-zinc-700 px-3 py-2 text-sm">
              <p className="font-medium">{role === "ADMIN" ? "Administración de flota" : "Tu próximo alquiler"}</p>
              <p className="text-zinc-100">{role === "ADMIN" ? "Gestioná vehículos, clientes y reservas desde tu espacio." : "Consultá disponibilidad y gestioná tus reservas."}</p>
            </div>
          </div>
        </header>

        <nav className="rentar-section-nav flex flex-wrap gap-2" aria-label={`Secciones de ${role === "ADMIN" ? "administración" : "cliente"}`}>
          {activeSections.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={`cursor-pointer rentar-nav-button rounded-md px-3 py-2 text-sm font-medium ${section === item ? "bg-emerald-600 text-white" : "bg-white text-zinc-700 hover:bg-zinc-200"}`}
            >
              {SECTION_LABELS[item]}
            </button>
          ))}
        </nav>

        {feedback ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{feedback}</div> : null}

        {section === "RESERVAS" ? (
          role === "ADMIN" ? (
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
          ) : (
            <OwnReservationsPanel
              reservations={reservations}
              vehicles={vehicles}
              onCancelReservation={handleCancelReservation}
            />
          )
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
