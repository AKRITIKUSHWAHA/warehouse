import { CustomersRepository, customersRepository } from './customers.repository.js';
import { CustomerFilterParams, CreateCustomerInput, UpdateCustomerInput } from './customers.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';

export class CustomersService {
  constructor(private readonly repo: CustomersRepository = customersRepository) {}

  async listCustomers(filters: CustomerFilterParams) {
    return this.repo.findMany(filters);
  }

  async getCustomerById(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer');
    }
    return customer;
  }

  async createCustomer(input: CreateCustomerInput) {
    let customerNumber = input.customerNumber?.trim();
    if (!customerNumber) {
      customerNumber = await this.repo.getNextCustomerNumber();
    } else {
      const existing = await this.repo.findById(customerNumber);
      if (existing) {
        customerNumber = await this.repo.getNextCustomerNumber();
      }
    }
    const createdDate = input.createdDate || new Date().toISOString().split('T')[0];

    return this.repo.create({
      ...input,
      customerNumber,
      createdDate,
    });
  }

  async updateCustomer(id: string, input: UpdateCustomerInput) {
    await this.getCustomerById(id);
    return this.repo.update(id, input);
  }

  async deleteCustomer(id: string) {
    await this.getCustomerById(id);
    return this.repo.delete(id);
  }
}

export const customersService = new CustomersService();
