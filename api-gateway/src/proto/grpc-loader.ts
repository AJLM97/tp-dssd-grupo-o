// Cómo convierte el gateway lo que recibe por gRPC: int64 como número común (no objeto Long) y enums por su nombre ("SEDAN" en vez de 1)
export const GRPC_LOADER = { longs: Number, enums: String };
