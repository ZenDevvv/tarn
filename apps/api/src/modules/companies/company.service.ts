import { companyRepository } from './company.repository';
import { CreateCompanyInput, UpdateCompanyInput, CompanyFiltersInput } from '@tracker/validation';
import { NotFoundError } from '../../middleware/error-handler';

export const companyService = {
  async getCompanies(userId: string, filters: Partial<CompanyFiltersInput> = {}) {
    return companyRepository.findMany(userId, filters);
  },

  async getCompanyById(userId: string, id: string) {
    const company = await companyRepository.findById(userId, id);
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    return company;
  },

  async createCompany(userId: string, input: CreateCompanyInput) {
    return companyRepository.create(userId, input);
  },

  async updateCompany(userId: string, id: string, input: UpdateCompanyInput) {
    const updated = await companyRepository.update(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Company not found');
    }
    return updated;
  },

  async deleteCompany(userId: string, id: string) {
    const deleted = await companyRepository.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError('Company not found');
    }
    return deleted;
  },
};

