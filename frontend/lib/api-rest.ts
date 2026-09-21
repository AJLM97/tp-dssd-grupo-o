const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function fetchVehiculos() {
  const res = await fetch(`${API_URL}/vehiculos`);
  if (!res.ok) throw new Error("Error al obtener vehículos");
  return res.json();
}

export async function saveVehiculo(data: any, isEditing: boolean, id?: number) {
  const url = isEditing ? `${API_URL}/vehiculos/${id}` : `${API_URL}/vehiculos`;
  const method = isEditing ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al guardar vehículo");
  }
  return res.json();
}

export async function deleteVehiculoApi(id: number) {
  const res = await fetch(`${API_URL}/vehiculos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al dar de baja el vehículo");
  return res.json();
}

export async function fetchClientes() {
  const res = await fetch(`${API_URL}/clientes`);
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
}

export async function saveCliente(data: any, isEditing: boolean, id?: number) {
  const url = isEditing ? `${API_URL}/clientes/${id}` : `${API_URL}/clientes`;
  const method = isEditing ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al guardar cliente");
  }
  return res.json();
}

export async function deleteClienteApi(id: number) {
  const res = await fetch(`${API_URL}/clientes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al dar de baja el cliente");
  return res.json();
}

export async function postReserva(data: { clienteId: number; vehiculoId: number; fechaInicio: string; fechaFin: string }) {
  const res = await fetch(`${API_URL}/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al crear la reserva");
  }
  return res.json();
}

export async function putCancelarReserva(id: number) {
  const res = await fetch(`${API_URL}/reservas/${id}/cancelar`, { method: "PUT" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al cancelar la reserva");
  }
  return res.json();
}