const contactRepository = require('../repositories/contactRepository');
const { BadRequestError } = require('../utils/errors');

class ContactService {
  async createContact(contactData) {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!contactData.name || !contactData.phone || !contactData.propertyId) {
      throw new BadRequestError('Name, phone and propertyId are required');
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์ (เบอร์ไทย)
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(contactData.phone)) {
      throw new BadRequestError('Invalid phone number format');
    }

    try {
      const result = await contactRepository.createContact(contactData);
      return result;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  async getContactsByPropertyId(propertyId) {
    if (!propertyId) {
      throw new BadRequestError('PropertyId is required');
    }

    return contactRepository.getContactsByPropertyId(propertyId);
  }

  async getAllContacts(page = 1, limit = 20) {
    return contactRepository.getAllContacts(page, limit);
  }
}

module.exports = new ContactService();
