"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  INITIAL_CLIENTS,
  INITIAL_RESERVATIONS,
  INITIAL_VEHICLES,
  RESERVATION_STATUS_OPTIONS,
  VEHICLE_STATE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  buildNextId,
  calculateDays,
  createEmptyClient,
  createEmptyVehicle,
  formatCurrency,
  formatDateTime,
  hasRentalStarted,
  isVehicleAvailable,
  normalizeDate,
  overlaps,
  reservationStatusLabel,
} from "@/lib/rentar-mocks";
import type {
  AppRole,
  Client,
  ClientForm,
  Reservation,
  ReservationStatus,
  UiSection,
  Vehicle,
  VehicleForm,
  VehicleState,
  VehicleType,
} from "@/lib/rentar-types";

type ReservationFilters = {
  clientId: string;
  vehicleId: string;
  vehicleType: "" | VehicleType;
  status: "" | ReservationStatus;
  startAt: string;
  endAt: string;
};

type AvailabilityFilters = {
  startAt: string;
  endAt: string;
  vehicleType: "" | VehicleType;
  brand: string;
  model: string;
  minDailyPrice: string;
  maxDailyPrice: string;
};

const DEFAULT_AVAILABILITY_FILTERS: AvailabilityFilters = {
  startAt: "",
  endAt: "",
  vehicleType: "",
  brand: "",
  model: "",
  minDailyPrice: "",
  maxDailyPrice: "",
};

const DEFAULT_RESERVATION_FILTERS: ReservationFilters = {
  clientId: "",
  vehicleId: "",
  vehicleType: "",
  status: "",
  startAt: "",
  endAt: "",
};

const SECTION_LABELS: Record<UiSection, string> = {
  VEHICULOS: "Dashboard Admin: Pantalla de ABM de Vehiculos",
  CLIENTES: "Dashboard Admin: Pantalla de ABM de Clientes",
  DISPONIBILIDAD: "Cliente: Pantalla de consulta de disponibilidad",
  ALTA_RESERVA: "Cliente: Flujo de creacion de reserva",
  RESERVAS: "Cliente/Admin: Pantalla de consulta de reservas activas",
  HISTORIAL: "Cliente: Pantalla de historial de alquileres",
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  labelClassName = "text-zinc-700",
  inputClassName = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${labelClassName}`}>
      <span>{label}</span>
      <input
        {...props}
        className={`rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-100 placeholder:text-zinc-500 focus:border-emerald-600 focus:ring ${inputClassName}`}
      />
    </label>
  );
}

function Select({
  label,
  children,
  labelClassName = "text-zinc-700",
  selectClassName = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
  labelClassName?: string;
  selectClassName?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${labelClassName}`}>
      <span>{label}</span>
      <select
        {...props}
        className={`rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-100 focus:border-emerald-600 focus:ring ${selectClassName}`}
      >
        {children}
      </select>
    </label>
  );
}

function getEffectiveReservationStatus(reservation: Reservation): ReservationStatus {
  if (reservation.status !== "CONFIRMADA") {
    return reservation.status;
  }

  const endAt = normalizeDate(reservation.endAt);
  if (endAt && endAt.getTime() < Date.now()) {
    return "FINALIZADA";
  }

  return reservation.status;
}

export default function Home() {
  const [role, setRole] = useState<AppRole>("CLIENTE");
  const [section, setSection] = useState<UiSection>("DISPONIBILIDAD");
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(createEmptyVehicle());
  const [vehicleEditingId, setVehicleEditingId] = useState<number | null>(null);

  const [clientForm, setClientForm] = useState<ClientForm>(createEmptyClient());
  const [clientEditingId, setClientEditingId] = useState<number | null>(null);

  const [availabilityFilters, setAvailabilityFilters] = useState<AvailabilityFilters>(DEFAULT_AVAILABILITY_FILTERS);
  const [reservationFilters, setReservationFilters] = useState<ReservationFilters>(DEFAULT_RESERVATION_FILTERS);

  const [currentClientId, setCurrentClientId] = useState<number>(INITIAL_CLIENTS[0]?.id ?? 0);
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

  const availableVehicles = useMemo(() => {
    const startAt = normalizeDate(availabilityFilters.startAt);
    const endAt = normalizeDate(availabilityFilters.endAt);

    if (!startAt || !endAt || endAt <= startAt) {
      return [];
    }

    return vehicles.filter((vehicle) => {
      if (!vehicle.active) {
        return false;
      }

      if (
        availabilityFilters.vehicleType &&
        vehicle.type !== availabilityFilters.vehicleType
      ) {
        return false;
      }

      if (
        availabilityFilters.brand &&
        !vehicle.brand.toLowerCase().includes(availabilityFilters.brand.toLowerCase())
      ) {
        return false;
      }

      if (
        availabilityFilters.model &&
        !vehicle.model.toLowerCase().includes(availabilityFilters.model.toLowerCase())
      ) {
        return false;
      }

      if (availabilityFilters.minDailyPrice && vehicle.dailyPrice < Number(availabilityFilters.minDailyPrice)) {
        return false;
      }

      if (availabilityFilters.maxDailyPrice && vehicle.dailyPrice > Number(availabilityFilters.maxDailyPrice)) {
        return false;
      }

      return isVehicleAvailable(vehicle.id, startAt, endAt, reservations);
    });
  }, [availabilityFilters, reservations, vehicles]);

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

  function handleVehicleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    if (!vehicleForm.licensePlate || !vehicleForm.brand || !vehicleForm.model || !vehicleForm.year || !vehicleForm.dailyPrice) {
      setFeedback("Completa los campos obligatorios de vehiculo.");
      return;
    }

    if (vehicleEditingId === null) {
      const duplicated = vehicles.some(
        (item) => item.licensePlate.toLowerCase() === vehicleForm.licensePlate.trim().toLowerCase(),
      );

      if (duplicated) {
        setFeedback("La patente ya existe. Debe ser unica.");
        return;
      }

      const nextVehicle: Vehicle = {
        id: buildNextId(vehicles),
        licensePlate: vehicleForm.licensePlate.trim().toUpperCase(),
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        year: Number(vehicleForm.year),
        color: vehicleForm.color.trim(),
        type: vehicleForm.type,
        dailyPrice: Number(vehicleForm.dailyPrice),
        state: "DISPONIBLE",
        active: true,
      };

      setVehicles((current) => [...current, nextVehicle]);
      clearVehicleForm();
      setFeedback("Vehiculo anadido con estado inicial DISPONIBLE.");
      return;
    }

    setVehicles((current) =>
      current.map((item) => {
        if (item.id !== vehicleEditingId) {
          return item;
        }

        return {
          ...item,
          brand: vehicleForm.brand.trim(),
          model: vehicleForm.model.trim(),
          year: Number(vehicleForm.year),
          color: vehicleForm.color.trim(),
          type: vehicleForm.type,
          dailyPrice: Number(vehicleForm.dailyPrice),
          state: vehicleForm.state,
          active: vehicleForm.active,
        };
      }),
    );

    clearVehicleForm();
    setFeedback("Vehiculo actualizado. La patente no se puede modificar.");
  }

  function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    if (!clientForm.document || !clientForm.firstName || !clientForm.lastName || !clientForm.email) {
      setFeedback("Completa los campos obligatorios de cliente.");
      return;
    }

    if (clientEditingId === null) {
      const duplicatedDocument = clients.some((item) => item.document === clientForm.document.trim());
      if (duplicatedDocument) {
        setFeedback("El documento ya existe.");
        return;
      }

      const duplicatedEmail = clients.some((item) => item.email.toLowerCase() === clientForm.email.trim().toLowerCase());
      if (duplicatedEmail) {
        setFeedback("El email ya existe.");
        return;
      }

      const nextClient: Client = {
        id: buildNextId(clients),
        document: clientForm.document.trim(),
        firstName: clientForm.firstName.trim(),
        lastName: clientForm.lastName.trim(),
        email: clientForm.email.trim().toLowerCase(),
        phone: clientForm.phone.trim(),
        birthDate: clientForm.birthDate,
        active: clientForm.active,
      };

      setClients((current) => [...current, nextClient]);
      clearClientForm();
      setFeedback("Cliente anadido correctamente.");
      return;
    }

    setClients((current) =>
      current.map((item) => {
        if (item.id !== clientEditingId) {
          return item;
        }

        return {
          ...item,
          document: clientForm.document.trim(),
          firstName: clientForm.firstName.trim(),
          lastName: clientForm.lastName.trim(),
          email: clientForm.email.trim().toLowerCase(),
          phone: clientForm.phone.trim(),
          birthDate: clientForm.birthDate,
          active: clientForm.active,
        };
      }),
    );

    clearClientForm();
    setFeedback("Cliente actualizado.");
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

  function handleCreateReservation() {
    setFeedback("");

    if (!currentClient) {
      setFeedback("Selecciona un cliente valido.");
      return;
    }

    if (!currentClient.active) {
      setFeedback("El cliente esta inactivo. No puede reservar.");
      return;
    }

    const vehicle = vehicles.find((item) => item.id === selectedVehicleId);
    if (!vehicle) {
      setFeedback("Selecciona un vehiculo.");
      return;
    }

    if (!vehicle.active) {
      setFeedback("El vehiculo esta inactivo. No puede reservarse.");
      return;
    }

    const startAt = normalizeDate(reservationStartAt);
    const endAt = normalizeDate(reservationEndAt);

    if (!startAt || !endAt) {
      setFeedback("Debes ingresar fecha y hora de inicio y fin.");
      return;
    }

    if (startAt.getTime() <= Date.now()) {
      setFeedback("La fecha de inicio debe ser futura.");
      return;
    }

    if (endAt <= startAt) {
      setFeedback("La fecha de finalizacion debe ser posterior al inicio.");
      return;
    }

    if (!isVehicleAvailable(vehicle.id, startAt, endAt, reservations)) {
      setFeedback("El vehiculo no esta disponible durante todo el periodo.");
      return;
    }

    const days = calculateDays(startAt, endAt);
    const totalAmount = days * vehicle.dailyPrice;

    const nextReservation: Reservation = {
      id: buildNextId(reservations),
      clientId: currentClient.id,
      vehicleId: vehicle.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      dailyPrice: vehicle.dailyPrice,
      totalAmount,
      status: "CONFIRMADA",
    };

    setReservations((current) => [...current, nextReservation]);
    setVehicles((current) => current.map((item) => (item.id === vehicle.id ? { ...item, state: "RESERVADO" } : item)));
    setSelectedVehicleId(null);
    setReservationStartAt("");
    setReservationEndAt("");
    setFeedback(`Reserva confirmada. Importe total: ${formatCurrency(totalAmount)}.`);
  }

  function handleCancelReservation(reservationId: number) {
    setFeedback("");

    const target = reservations.find((item) => item.id === reservationId);
    if (!target) {
      setFeedback("No se encontro la reserva.");
      return;
    }

    if (hasRentalStarted(target.startAt)) {
      setFeedback("No podes cancelar: el periodo de alquiler ya comenzo.");
      return;
    }

    setReservations((current) => current.map((item) => (item.id === reservationId ? { ...item, status: "CANCELADA" } : item)));

    setVehicles((current) =>
      current.map((vehicle) => {
        if (vehicle.id !== target.vehicleId) {
          return vehicle;
        }

        const hasActiveFuture = reservations.some((reservation) => {
          if (reservation.id === reservationId || reservation.vehicleId !== vehicle.id) {
            return false;
          }

          return reservation.status === "CONFIRMADA";
        });

        return {
          ...vehicle,
          state: hasActiveFuture ? "RESERVADO" : "DISPONIBLE",
        };
      }),
    );

    setFeedback("Reserva cancelada. El historial de alquileres conserva el registro en estado CANCELADA.");
  }

  const historyRows = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.clientId === currentClientId)
      .map((reservation) => ({
        ...reservation,
        status: getEffectiveReservationStatus(reservation),
      }))
      .filter((reservation) => reservation.status === "FINALIZADA" || reservation.status === "CANCELADA");
  }, [currentClientId, reservations]);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="rounded-xl bg-zinc-800 px-5 py-4 text-white shadow-lg">
          <h1 className="text-2xl font-semibold">Rentar-Hito 1</h1>
          <p className="text-sm text-zinc-100">
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Select
              label="Rol"
              labelClassName="text-zinc-50"
              selectClassName="border-zinc-200 bg-zinc-100 text-zinc-800"
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
            >
              <option value="CLIENTE">CLIENTE</option>
              <option value="ADMIN">ADMIN</option>
            </Select>

            <Select
              label="Cliente actual (simulacion)"
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

        <nav className="flex flex-wrap gap-2">
          {activeSections.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                section === item ? "bg-emerald-600 text-white" : "bg-white text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {SECTION_LABELS[item]}
            </button>
          ))}
        </nav>

        {feedback ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{feedback}</div> : null}

        {section === "VEHICULOS" ? (
          <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
            <SectionCard
              title="Pantalla de ABM de Vehiculos"
              description="Listado, formularios y baja logica para administrar la flota."
            >
              <form className="grid gap-3" onSubmit={handleVehicleSubmit}>
                <Input
                  label="Patente *"
                  value={vehicleForm.licensePlate}
                  disabled={vehicleEditingId !== null}
                  onChange={(event) => setVehicleForm((current) => ({ ...current, licensePlate: event.target.value }))}
                />
                <Input label="Marca *" value={vehicleForm.brand} onChange={(event) => setVehicleForm((current) => ({ ...current, brand: event.target.value }))} />
                <Input label="Modelo *" value={vehicleForm.model} onChange={(event) => setVehicleForm((current) => ({ ...current, model: event.target.value }))} />
                <Input label="Anio *" type="number" value={vehicleForm.year} onChange={(event) => setVehicleForm((current) => ({ ...current, year: event.target.value }))} />
                <Input label="Color" value={vehicleForm.color} onChange={(event) => setVehicleForm((current) => ({ ...current, color: event.target.value }))} />
                <Select label="Tipo *" value={vehicleForm.type} onChange={(event) => setVehicleForm((current) => ({ ...current, type: event.target.value as VehicleType }))}>
                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
                <Input label="Precio diario *" type="number" value={vehicleForm.dailyPrice} onChange={(event) => setVehicleForm((current) => ({ ...current, dailyPrice: event.target.value }))} />
                <Select label="Estado" value={vehicleForm.state} onChange={(event) => setVehicleForm((current) => ({ ...current, state: event.target.value as VehicleState }))}>
                  {VEHICLE_STATE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={vehicleForm.active}
                    onChange={(event) => setVehicleForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Activo
                </label>

                <div className="flex gap-2">
                  <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    {vehicleEditingId ? "Guardar cambios" : "Anadir vehiculo"}
                  </button>
                  <button type="button" onClick={clearVehicleForm} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
                    Eliminar carga
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Listado de vehiculos" description="Consulta y baja logica de la flota activa/inactiva.">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-600">
                      <th className="py-2">Patente</th>
                      <th>Marca/Modelo</th>
                      <th>Tipo</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Activo</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b border-zinc-100">
                        <td className="py-2 font-medium">{vehicle.licensePlate}</td>
                        <td>{`${vehicle.brand} ${vehicle.model}`}</td>
                        <td>{vehicle.type}</td>
                        <td>{formatCurrency(vehicle.dailyPrice)}</td>
                        <td>{vehicle.state}</td>
                        <td>{vehicle.active ? "Si" : "No"}</td>
                        <td>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startVehicleEdition(vehicle)} className="rounded bg-zinc-900 px-2 py-1 text-xs text-white">
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setVehicles((current) =>
                                  current.map((item) => (item.id === vehicle.id ? { ...item, active: !item.active } : item)),
                                )
                              }
                              className="rounded border border-zinc-300 px-2 py-1 text-xs"
                            >
                              {vehicle.active ? "Baja logica" : "Reactivar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {section === "CLIENTES" ? (
          <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
            <SectionCard title="Pantalla de ABM de Clientes" description="Listado, formularios y baja logica con documento y email unicos.">
              <form className="grid gap-3" onSubmit={handleClientSubmit}>
                <Input label="Documento *" value={clientForm.document} onChange={(event) => setClientForm((current) => ({ ...current, document: event.target.value }))} />
                <Input label="Nombre *" value={clientForm.firstName} onChange={(event) => setClientForm((current) => ({ ...current, firstName: event.target.value }))} />
                <Input label="Apellido *" value={clientForm.lastName} onChange={(event) => setClientForm((current) => ({ ...current, lastName: event.target.value }))} />
                <Input label="Email *" type="email" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} />
                <Input label="Telefono" value={clientForm.phone} onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))} />
                <Input label="Fecha de nacimiento" type="date" value={clientForm.birthDate} onChange={(event) => setClientForm((current) => ({ ...current, birthDate: event.target.value }))} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={clientForm.active}
                    onChange={(event) => setClientForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Activo
                </label>

                <div className="flex gap-2">
                  <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    {clientEditingId ? "Guardar cambios" : "Anadir cliente"}
                  </button>
                  <button type="button" onClick={clearClientForm} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
                    Eliminar carga
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Listado de clientes" description="Consulta y baja logica de clientes de Rentar.">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-600">
                      <th className="py-2">Documento</th>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Activo</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b border-zinc-100">
                        <td className="py-2 font-medium">{client.document}</td>
                        <td>{`${client.firstName} ${client.lastName}`}</td>
                        <td>{client.email}</td>
                        <td>{client.active ? "Si" : "No"}</td>
                        <td>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startClientEdition(client)} className="rounded bg-zinc-900 px-2 py-1 text-xs text-white">
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setClients((current) =>
                                  current.map((item) => (item.id === client.id ? { ...item, active: !item.active } : item)),
                                )
                              }
                              className="rounded border border-zinc-300 px-2 py-1 text-xs"
                            >
                              {client.active ? "Baja logica" : "Reactivar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {section === "DISPONIBILIDAD" ? (
          <div className="grid gap-5">
            <SectionCard
              title="Pantalla de consulta de disponibilidad"
              description="Filtros y selectores de fecha/hora. Inicio y fin son obligatorios para buscar disponibilidad real del periodo."
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Inicio *"
                  type="datetime-local"
                  value={availabilityFilters.startAt}
                  onChange={(event) => setAvailabilityFilters((current) => ({ ...current, startAt: event.target.value }))}
                />
                <Input
                  label="Fin *"
                  type="datetime-local"
                  value={availabilityFilters.endAt}
                  onChange={(event) => setAvailabilityFilters((current) => ({ ...current, endAt: event.target.value }))}
                />
                <Select
                  label="Tipo"
                  value={availabilityFilters.vehicleType}
                  onChange={(event) => setAvailabilityFilters((current) => ({ ...current, vehicleType: event.target.value as "" | VehicleType }))}
                >
                  <option value="">Todos</option>
                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
                <Input label="Marca" value={availabilityFilters.brand} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, brand: event.target.value }))} />
                <Input label="Modelo" value={availabilityFilters.model} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, model: event.target.value }))} />
                <Input label="Precio minimo" type="number" value={availabilityFilters.minDailyPrice} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, minDailyPrice: event.target.value }))} />
                <Input label="Precio maximo" type="number" value={availabilityFilters.maxDailyPrice} onChange={(event) => setAvailabilityFilters((current) => ({ ...current, maxDailyPrice: event.target.value }))} />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setAvailabilityFilters(DEFAULT_AVAILABILITY_FILTERS)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                  >
                    Eliminar filtros
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Listado de disponibles" description="Solo vehiculos activos y libres durante todo el periodo.">
              {!availabilityFilters.startAt || !availabilityFilters.endAt ? (
                <p className="text-sm text-zinc-600">Ingresa fecha/hora de inicio y fin para buscar.</p>
              ) : null}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-600">
                      <th className="py-2">Patente</th>
                      <th>Marca/Modelo</th>
                      <th>Ano</th>
                      <th>Color</th>
                      <th>Tipo</th>
                      <th>Precio diario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b border-zinc-100">
                        <td className="py-2 font-medium">{vehicle.licensePlate}</td>
                        <td>{`${vehicle.brand} ${vehicle.model}`}</td>
                        <td>{vehicle.year}</td>
                        <td>{vehicle.color || "-"}</td>
                        <td>{vehicle.type}</td>
                        <td>{formatCurrency(vehicle.dailyPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {section === "ALTA_RESERVA" ? (
          <SectionCard
            title="Flujo de creacion de reserva"
            description="Incluye confirmacion y calculo de importe total con reglas de negocio."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Vehiculo *"
                value={selectedVehicleId ? String(selectedVehicleId) : ""}
                onChange={(event) => setSelectedVehicleId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Seleccionar vehiculo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{`${vehicle.licensePlate} - ${vehicle.brand} ${vehicle.model} (${vehicle.active ? "Activo" : "Inactivo"})`}</option>
                ))}
              </Select>

              <Input label="Inicio *" type="datetime-local" value={reservationStartAt} onChange={(event) => setReservationStartAt(event.target.value)} />
              <Input label="Fin *" type="datetime-local" value={reservationEndAt} onChange={(event) => setReservationEndAt(event.target.value)} />

              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 md:col-span-2">
                <p>Cliente actual: {currentClient ? `${currentClient.firstName} ${currentClient.lastName}` : "No seleccionado"}</p>
                <p>Estado cliente: {currentClient?.active ? "Activo" : "Inactivo"}</p>
                {reservationPreview ? (
                  <p className="font-semibold text-zinc-900">
                    Vista previa: {reservationPreview.days} dias x {formatCurrency(reservationPreview.dailyPrice)} = {formatCurrency(reservationPreview.total)}
                  </p>
                ) : (
                  <p>Completa vehiculo + fechas para calcular importe.</p>
                )}
              </div>

              <div>
                <button type="button" onClick={handleCreateReservation} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  Confirmar reserva
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {section === "RESERVAS" ? (
          <div className="grid gap-5">
            <SectionCard title="Pantalla de consulta de reservas activas" description="Vista unificada para cliente/admin con filtros opcionales y boton de cancelacion.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Select label="Cliente" value={reservationFilters.clientId} onChange={(event) => setReservationFilters((current) => ({ ...current, clientId: event.target.value }))}>
                  <option value="">Todos</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{`${client.firstName} ${client.lastName}`}</option>
                  ))}
                </Select>
                <Select label="Vehiculo" value={reservationFilters.vehicleId} onChange={(event) => setReservationFilters((current) => ({ ...current, vehicleId: event.target.value }))}>
                  <option value="">Todos</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{`${vehicle.licensePlate} - ${vehicle.brand}`}</option>
                  ))}
                </Select>
                <Select
                  label="Tipo"
                  value={reservationFilters.vehicleType}
                  onChange={(event) => setReservationFilters((current) => ({ ...current, vehicleType: event.target.value as "" | VehicleType }))}
                >
                  <option value="">Todos</option>
                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
                <Select
                  label="Estado"
                  value={reservationFilters.status}
                  onChange={(event) => setReservationFilters((current) => ({ ...current, status: event.target.value as "" | ReservationStatus }))}
                >
                  <option value="">Todos</option>
                  {RESERVATION_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
                <Input label="Desde" type="datetime-local" value={reservationFilters.startAt} onChange={(event) => setReservationFilters((current) => ({ ...current, startAt: event.target.value }))} />
                <Input label="Hasta" type="datetime-local" value={reservationFilters.endAt} onChange={(event) => setReservationFilters((current) => ({ ...current, endAt: event.target.value }))} />
              </div>
            </SectionCard>

            <SectionCard title="Listado de reservas" description="Cliente ve solo sus reservas. Admin ve todas.">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-600">
                      <th className="py-2">Cliente</th>
                      <th>Vehiculo</th>
                      <th>Patente</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Precio diario</th>
                      <th>Importe total</th>
                      <th>Estado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((reservation) => {
                      const client = clients.find((item) => item.id === reservation.clientId);
                      const vehicle = vehicles.find((item) => item.id === reservation.vehicleId);
                      const status = getEffectiveReservationStatus(reservation);
                      const canCancel =
                        role === "CLIENTE" &&
                        reservation.clientId === currentClientId &&
                        reservation.status === "CONFIRMADA" &&
                        !hasRentalStarted(reservation.startAt);

                      return (
                        <tr key={reservation.id} className="border-b border-zinc-100">
                          <td className="py-2">{client ? `${client.firstName} ${client.lastName}` : "-"}</td>
                          <td>{vehicle ? `${vehicle.brand} ${vehicle.model}` : "-"}</td>
                          <td>{vehicle?.licensePlate ?? "-"}</td>
                          <td>{formatDateTime(reservation.startAt)}</td>
                          <td>{formatDateTime(reservation.endAt)}</td>
                          <td>{formatCurrency(reservation.dailyPrice)}</td>
                          <td>{formatCurrency(reservation.totalAmount)}</td>
                          <td>{reservationStatusLabel(status)}</td>
                          <td>
                            {canCancel ? (
                              <button
                                type="button"
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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
            </SectionCard>
          </div>
        ) : null}

        {section === "HISTORIAL" ? (
          <SectionCard
            title="Historial de alquileres"
            description="Incluye reservas canceladas y alquileres finalizados del cliente actual."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-600">
                    <th className="py-2">Vehiculo</th>
                    <th>Patente</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Dias</th>
                    <th>Importe total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((reservation) => {
                    const vehicle = vehicles.find((item) => item.id === reservation.vehicleId);
                    const start = normalizeDate(reservation.startAt);
                    const end = normalizeDate(reservation.endAt);
                    const days = start && end ? calculateDays(start, end) : 0;

                    return (
                      <tr key={reservation.id} className="border-b border-zinc-100">
                        <td className="py-2">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "-"}</td>
                        <td>{vehicle?.licensePlate ?? "-"}</td>
                        <td>{formatDateTime(reservation.startAt)}</td>
                        <td>{formatDateTime(reservation.endAt)}</td>
                        <td>{days}</td>
                        <td>{formatCurrency(reservation.totalAmount)}</td>
                        <td>{reservationStatusLabel(reservation.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </main>
  );
}
