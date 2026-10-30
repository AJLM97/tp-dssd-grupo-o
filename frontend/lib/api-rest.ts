const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function fetchVehiculos() {
  const res = await fetch(`${API_URL}/vehiculos`);
  if (!res.ok) throw new Error("Error al obtener vehículos");
  return res.json();
}

export async function saveVehiculo(data: any, isEditing: boolean, id?: number, accessToken?: string) {
  const url = isEditing ? `${API_URL}/vehiculos/${id}` : `${API_URL}/vehiculos`;
  const method = isEditing ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al guardar vehículo");
  }
  return res.json();
}

export async function crearVehiculo(
  datos: {
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
    tipo: 'SEDAN' | 'SUV' | 'PICKUP' | 'COUPE' | 'HATCHBACK';
    precioDiario: number;
  },
  token: string,
) {
  const respuesta = await fetch(`${API_URL}/vehiculos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...datos,
      anio: Number(datos.anio),
      precioDiario: Number(datos.precioDiario),
    }),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      Array.isArray(resultado.message)
        ? resultado.message.join(', ')
        : resultado.message || 'No se pudo crear el vehículo',
    );
  }

  return resultado;
}

export async function deleteVehiculoApi(id: number, accessToken: string) {
  const res = await fetch(`${API_URL}/vehiculos/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Error al dar de baja el vehículo");
  return res.json();
}

export async function fetchClientes() {
  const res = await fetch(`${API_URL}/clientes`);
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
}

export async function saveCliente(data: any, isEditing: boolean, id?: number, accessToken?: string) {
  const url = isEditing ? `${API_URL}/clientes/${id}` : `${API_URL}/clientes`;
  const method = isEditing ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al guardar cliente");
  }
  return res.json();
}

type DatosFormularioCliente = {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  fechaNacimiento: string;
};

export async function crearCliente(datosFormulario: DatosFormularioCliente) {
  const respuesta = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documento: datosFormulario.documento,
      nombre: datosFormulario.nombre,
      apellido: datosFormulario.apellido,
      email: datosFormulario.email,
      password: datosFormulario.password,
      telefono: datosFormulario.telefono,
      fechaNacimiento: datosFormulario.fechaNacimiento,
    }),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.message || 'No se pudo crear el cliente');
  }

  return resultado;
}

type RespuestaLogin = {
  access_token: string;
  user: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: "CLIENTE" | "ADMIN";
  };
};

export async function iniciarSesion(email: string, password: string) {
  const respuesta = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.message || 'No se pudo iniciar sesión');
  }

  return {
    access_token: resultado.access_token,
    user: resultado.user,
  } as RespuestaLogin;
}

export async function deleteClienteApi(id: number, accessToken: string) {
  const res = await fetch(`${API_URL}/clientes/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Error al dar de baja el cliente");
  return res.json();
}

type DatosReserva = {
  clienteId: number | string;
  vehiculoId: number | string;
  fechaInicio: string;
  fechaFin: string;
};

export async function postReserva({
  clienteId,
  vehiculoId,
  fechaInicio,
  fechaFin,
}: DatosReserva) {
  const respuesta = await fetch(`${API_URL}/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clienteId: Number(clienteId),
      vehiculoId: Number(vehiculoId),
      fechaInicio: new Date(fechaInicio).toISOString().slice(0, 19),
      fechaFin: new Date(fechaFin).toISOString().slice(0, 19),
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      Array.isArray(datos.message)
        ? datos.message.join(", ")
        : datos.message || "No se pudo crear la reserva",
    );
  }

  return datos;
}

export async function putCancelarReserva(id: number) {
  const res = await fetch(`${API_URL}/reservas/${id}/cancelar`, { method: "PUT" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al cancelar la reserva");
  }
  return res.json();
}