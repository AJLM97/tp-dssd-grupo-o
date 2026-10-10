"use client";

import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { Input, SectionCard, Select } from "@/components/ui/form-controls";
import {
  formatCurrency,
  VEHICLE_STATE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/rentar-mocks";
import type {
  Client,
  ClientForm,
  UiSection,
  Vehicle,
  VehicleForm,
  VehicleState,
  VehicleType,
} from "@/lib/rentar-types";

type AdminDashboardProps = {
  section: UiSection;
  vehicles: Vehicle[];
  clients: Client[];
  vehicleForm: VehicleForm;
  vehicleEditingId: number | null;
  setVehicleForm: Dispatch<SetStateAction<VehicleForm>>;
  onVehicleSubmit: FormEventHandler<HTMLFormElement>;
  onClearVehicleForm: () => void;
  onStartVehicleEdition: (vehicle: Vehicle) => void;
  onVehicleDelete: (id: number) => void;
  clientForm: ClientForm;
  clientEditingId: number | null;
  setClientForm: Dispatch<SetStateAction<ClientForm>>;
  onClientSubmit: FormEventHandler<HTMLFormElement>;
  onClearClientForm: () => void;
  onStartClientEdition: (client: Client) => void;
  onClientDelete: (id: number) => void;
};

export function AdminDashboard({
  section,
  vehicles,
  clients,
  vehicleForm,
  vehicleEditingId,
  setVehicleForm,
  onVehicleSubmit,
  onClearVehicleForm,
  onStartVehicleEdition,
  onVehicleDelete,
  clientForm,
  clientEditingId,
  setClientForm,
  onClientSubmit,
  onClearClientForm,
  onStartClientEdition,
  onClientDelete,
}: AdminDashboardProps) {
  return (
    <>
      {section === "VEHICULOS" ? (
        <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
          <SectionCard
            title="Pantalla de ABM de Vehiculos"
            description="Listado, formularios y baja logica para administrar la flota."
          >
            <form className="grid gap-3" onSubmit={onVehicleSubmit}>
              <Input label="Patente *" value={vehicleForm.licensePlate} disabled={vehicleEditingId !== null} onChange={(event) => setVehicleForm((current) => ({ ...current, licensePlate: event.target.value }))} />
              <Input label="Marca *" value={vehicleForm.brand} onChange={(event) => setVehicleForm((current) => ({ ...current, brand: event.target.value }))} />
              <Input label="Modelo *" value={vehicleForm.model} onChange={(event) => setVehicleForm((current) => ({ ...current, model: event.target.value }))} />
              <Input label="Anio *" type="number" value={vehicleForm.year} onChange={(event) => setVehicleForm((current) => ({ ...current, year: event.target.value }))} />
              <Input label="Color" value={vehicleForm.color} onChange={(event) => setVehicleForm((current) => ({ ...current, color: event.target.value }))} />
              <Select label="Tipo *" value={vehicleForm.type} onChange={(event) => setVehicleForm((current) => ({ ...current, type: event.target.value as VehicleType }))}>
                {VEHICLE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
              <Input label="Precio diario *" type="number" value={vehicleForm.dailyPrice} onChange={(event) => setVehicleForm((current) => ({ ...current, dailyPrice: event.target.value }))} />
              <Select label="Estado" value={vehicleForm.state} onChange={(event) => setVehicleForm((current) => ({ ...current, state: event.target.value as VehicleState }))}>
                {VEHICLE_STATE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={vehicleForm.active} onChange={(event) => setVehicleForm((current) => ({ ...current, active: event.target.checked }))} />
                Activo
              </label>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  {vehicleEditingId ? "Guardar cambios" : "Anadir vehiculo"}
                </button>
                <button type="button" onClick={onClearVehicleForm} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
                  Eliminar carga
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Listado de vehiculos" description="Consulta y baja logica de la flota activa/inactiva.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="border-b border-zinc-200 text-zinc-600"><th className="py-2">Patente</th><th>Marca/Modelo</th><th>Tipo</th><th>Precio</th><th>Estado</th><th>Activo</th><th /></tr></thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-zinc-100">
                      <td className="py-2 font-medium">{vehicle.licensePlate}</td>
                      <td>{`${vehicle.brand} ${vehicle.model}`}</td>
                      <td>{vehicle.type}</td>
                      <td>{formatCurrency(vehicle.dailyPrice)}</td>
                      <td>{vehicle.state}</td>
                      <td>{vehicle.active ? "Si" : "No"}</td>
                      <td><div className="flex gap-2">
                        <button type="button" onClick={() => onStartVehicleEdition(vehicle)} className="rounded bg-zinc-900 px-2 py-1 text-xs text-white">Editar</button>
                        <button type="button" onClick={() => onVehicleDelete(vehicle.id)} className="rounded border border-zinc-300 px-2 py-1 text-xs">{vehicle.active ? "Baja logica" : "Reactivar"}</button>
                      </div></td>
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
            <form className="grid gap-3" onSubmit={onClientSubmit}>
              <Input label="Documento *" value={clientForm.document} onChange={(event) => setClientForm((current) => ({ ...current, document: event.target.value }))} />
              <Input label="Nombre *" value={clientForm.firstName} onChange={(event) => setClientForm((current) => ({ ...current, firstName: event.target.value }))} />
              <Input label="Apellido *" value={clientForm.lastName} onChange={(event) => setClientForm((current) => ({ ...current, lastName: event.target.value }))} />
              <Input label="Email *" type="email" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Telefono" value={clientForm.phone} onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))} />
              <Input label="Fecha de nacimiento" type="date" value={clientForm.birthDate} onChange={(event) => setClientForm((current) => ({ ...current, birthDate: event.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={clientForm.active} onChange={(event) => setClientForm((current) => ({ ...current, active: event.target.checked }))} />
                Activo
              </label>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  {clientEditingId ? "Guardar cambios" : "Anadir cliente"}
                </button>
                <button type="button" onClick={onClearClientForm} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
                  Eliminar carga
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Listado de clientes" description="Consulta y baja logica de clientes de Rentar.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="border-b border-zinc-200 text-zinc-600"><th className="py-2">Documento</th><th>Cliente</th><th>Email</th><th>Activo</th><th /></tr></thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-zinc-100">
                      <td className="py-2 font-medium">{client.document}</td>
                      <td>{`${client.firstName} ${client.lastName}`}</td>
                      <td>{client.email}</td>
                      <td>{client.active ? "Si" : "No"}</td>
                      <td><div className="flex gap-2">
                        <button type="button" onClick={() => onStartClientEdition(client)} className="rounded bg-zinc-900 px-2 py-1 text-xs text-white">Editar</button>
                        <button type="button" onClick={() => onClientDelete(client.id)} className="rounded border border-zinc-300 px-2 py-1 text-xs">{client.active ? "Baja logica" : "Reactivar"}</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </>
  );
}