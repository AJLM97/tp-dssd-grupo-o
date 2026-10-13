import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';

interface CustomerServiceGrpc {
  createCustomer(data: any): Observable<any>;
  updateCustomer(data: any): Observable<any>;
  deleteCustomer(data: { id: number }): Observable<any>;
  getCustomers(data: { solo_activos: boolean }): Observable<any>;
  getCustomerById(data: { id: number }): Observable<any>;
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
    return await lastValueFrom(this.customerGrpcService.createCustomer(data));
  }

  async obtenerTodos() {
    const res = await lastValueFrom(this.customerGrpcService.getCustomers({ solo_activos: false }));
    return res.customers || [];
  }

  async obtenerPorId(id: number) {
    return await lastValueFrom(this.customerGrpcService.getCustomerById({ id }));
  }

  async actualizar(id: number, data: any) {
    return await lastValueFrom(this.customerGrpcService.updateCustomer({ id, ...data }));
  }

  async bajaLogica(id: number) {
    return await lastValueFrom(this.customerGrpcService.deleteCustomer({ id }));
  }
}