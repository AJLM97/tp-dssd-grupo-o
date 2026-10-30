import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';

export interface CustomerData {
  id: number | string;
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  activo: boolean;
  rol: number | string;
}

interface CustomerServiceGrpc {
  createCustomer(data: any): Observable<{ customer: CustomerData }>;
  updateCustomer(data: any): Observable<{ customer: CustomerData }>;
  deleteCustomer(data: { id: number }): Observable<{ customer: CustomerData }>;
  getCustomers(data: { soloActivos: boolean }): Observable<{ customers: CustomerData[] }>;
  getCustomerById(data: { id: number }): Observable<{ customer: CustomerData }>;
  validateCustomer(data: { id: number }): Observable<any>;
}

@Injectable()
export class ClientesService implements OnModuleInit {
  private customerGrpcService: CustomerServiceGrpc;

  constructor(@Inject('CUSTOMER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.customerGrpcService = this.client.getService<CustomerServiceGrpc>('CustomerService');
  }

  async crear(data: any) {
    const response = await lastValueFrom(this.customerGrpcService.createCustomer(data));
    return this.normalizarCliente(response.customer);
  }

  async obtenerTodos() {
    const res = await lastValueFrom(this.customerGrpcService.getCustomers({ soloActivos: false }));
    return (res.customers || []).map((customer) => this.normalizarCliente(customer));
  }

  async obtenerPorId(id: number) {
    const response = await lastValueFrom(this.customerGrpcService.getCustomerById({ id }));
    return this.normalizarCliente(response.customer);
  }

  async actualizar(id: number, data: any) {
    const response = await lastValueFrom(this.customerGrpcService.updateCustomer({ id, ...data }));
    return this.normalizarCliente(response.customer);
  }

  async bajaLogica(id: number) {
    const response = await lastValueFrom(this.customerGrpcService.deleteCustomer({ id }));
    return this.normalizarCliente(response.customer);
  }

  async validar(id: number) {
    return await lastValueFrom(this.customerGrpcService.validateCustomer({ id }));
  }

  private normalizarCliente(customer: CustomerData): CustomerData {
    return {
      ...customer,
      rol:
        typeof customer.rol === 'string'
          ? customer.rol.replace(/^ROLE_/, '')
          : customer.rol,
    };
  }
}