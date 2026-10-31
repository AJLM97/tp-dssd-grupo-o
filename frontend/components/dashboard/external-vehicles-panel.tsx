"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Input, SectionCard, Select } from "@/components/ui/form-controls";
import {
  fetchMisVehiculosExternos,
  registrarVehiculoExterno,
  type VehiculoExterno,
} from "@/lib/api-rest";
import { formatCurrency, VEHICLE_TYPE_OPTIONS } from "@/lib/rentar-mocks";
import type { VehicleType } from "@/lib/rentar-types";

const FORMULARIO_VACIO = {
  patente: "",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  tipo: "SEDAN" as VehicleType,
  precioDiario: "",
};

const ESTADO_SOLICITUD: Record<VehiculoExterno["estado"], string> = {
  PENDIENTE: "Pendiente",
  INCORPORADO: "Incorporado",
  RECHAZADO: "Rechazado",
};

// Sin resultado todavía: la validación sigue en curso
function resultadoValidacion(resultado?: string) {
  if (resultado === "VALIDADO") return "Validado";
  if (resultado === "RECHAZADO") return "Rechazado";
  return "En curso";
}

type ExternalVehiclesPanelProps = {
  obtenerToken: () => string;
};

export function ExternalVehiclesPanel({ obtenerToken }: ExternalVehiclesPanelProps) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [solicitudes, setSolicitudes] = useState<VehiculoExterno[]>([]);
  const [mensaje, setMensaje] = useState("");
  // Cambiarlo vuelve a pedir las solicitudes (botón Actualizar y después de registrar)
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    async function cargarSolicitudes() {
      try {
        setSolicitudes(await fetchMisVehiculosExternos(obtenerToken()));
      } catch (error) {
        setMensaje((error as Error).message);
      }
    }

    cargarSolicitudes();
  }, [obtenerToken, recarga]);

  async function registrar(event: FormEvent) {
    event.preventDefault();
    try {
      await registrarVehiculoExterno(
        {
          ...formulario,
          anio: Number(formulario.anio),
          precioDiario: Number(formulario.precioDiario),
        },
        obtenerToken(),
      );
      setFormulario(FORMULARIO_VACIO);
      setMensaje("Solicitud registrada. Queda pendiente hasta que terminen las validaciones.");
      setRecarga((actual) => actual + 1);
    } catch (error) {
      setMensaje((error as Error).message);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionCard
        title="Registrar mi vehículo"
        description="Sumá tu vehículo a Rentar. Antes de incorporarlo verificamos que la patente no tenga denuncia de robo y que seas el titular."
      >
        <form onSubmit={registrar} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input label="Patente *" required value={formulario.patente} onChange={(event) => setFormulario((actual) => ({ ...actual, patente: event.target.value }))} />
          <Input label="Marca *" required value={formulario.marca} onChange={(event) => setFormulario((actual) => ({ ...actual, marca: event.target.value }))} />
          <Input label="Modelo *" required value={formulario.modelo} onChange={(event) => setFormulario((actual) => ({ ...actual, modelo: event.target.value }))} />
          <Input label="Año *" type="number" min={1} required value={formulario.anio} onChange={(event) => setFormulario((actual) => ({ ...actual, anio: event.target.value }))} />
          <Input label="Color" value={formulario.color} onChange={(event) => setFormulario((actual) => ({ ...actual, color: event.target.value }))} />
          <Select label="Tipo *" value={formulario.tipo} onChange={(event) => setFormulario((actual) => ({ ...actual, tipo: event.target.value as VehicleType }))}>
            {VEHICLE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Input label="Precio diario *" type="number" min={1} required value={formulario.precioDiario} onChange={(event) => setFormulario((actual) => ({ ...actual, precioDiario: event.target.value }))} />
          <div className="flex items-end">
            <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer">Registrar vehículo</button>
          </div>
        </form>
        {mensaje ? <p className="mt-3 text-sm text-zinc-700">{mensaje}</p> : null}
      </SectionCard>

      <SectionCard title="Mis solicitudes" description="Estado de cada vehículo que registraste y el resultado de cada validación.">
        <div className="mb-3">
          <button type="button" onClick={() => setRecarga((actual) => actual + 1)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium cursor-pointer">Actualizar</button>
        </div>
        {solicitudes.length === 0 ? (
          <p className="text-sm text-zinc-600">Todavía no registraste vehículos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b border-zinc-200 text-zinc-600"><th className="py-2">Patente</th><th>Marca/Modelo</th><th>Año</th><th>Tipo</th><th>Precio diario</th><th>Estado</th><th>Patente sin denuncia</th><th>Titularidad</th></tr></thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="border-b border-zinc-100">
                    <td className="py-2 font-medium">{solicitud.patente}</td><td>{`${solicitud.marca} ${solicitud.modelo}`}</td><td>{solicitud.anio}</td><td>{solicitud.tipo}</td><td>{formatCurrency(solicitud.precioDiario)}</td><td>{ESTADO_SOLICITUD[solicitud.estado]}</td><td>{resultadoValidacion(solicitud.resultadoPatente)}</td><td>{resultadoValidacion(solicitud.resultadoTitularidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
