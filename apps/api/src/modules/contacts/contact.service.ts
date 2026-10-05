import { contactRepository } from './contact.repository';
import { CreateContactInput, UpdateContactInput, ContactFiltersInput } from '@tracker/validation';
import { NotFoundError } from '../../middleware/error-handler';

export const contactService = {
  async getContacts(userId: string, filters: Partial<ContactFiltersInput> = {}) {
    return contactRepository.findMany(userId, filters);
  },

  async getContactById(userId: string, id: string) {
    const contact = await contactRepository.findById(userId, id);
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }
    return contact;
  },

  async createContact(userId: string, input: CreateContactInput) {
    return contactRepository.create(userId, input);
  },

  async updateContact(userId: string, id: string, input: UpdateContactInput) {
    const updated = await contactRepository.update(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Contact not found');
    }
    return updated;
  },

  async deleteContact(userId: string, id: string) {
    const deleted = await contactRepository.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError('Contact not found');
    }
    return deleted;
  },
};
