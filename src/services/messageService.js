const messageRepository = require('../repositories/messageRepository');
const { BadRequestError } = require('../utils/errors');

class MessageService {
  async createMessage(messageData) {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!messageData.name || !messageData.phone || !messageData.propertyId) {
      throw new BadRequestError('Name, phone and propertyId are required');
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์ (เบอร์ไทย)
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(messageData.phone)) {
      throw new BadRequestError('Invalid phone number format');
    }

    try {
      const result = await messageRepository.createMessage(messageData);
      return result;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessagesByPropertyId(propertyId) {
    if (!propertyId) {
      throw new BadRequestError('PropertyId is required');
    }

    return messageRepository.getMessagesByPropertyId(propertyId);
  }

  async getAllMessages(page = 1, limit = 20) {
    return messageRepository.getAllMessages(page, limit);
  }

  async updateMessageStatus(id, status) {
    if (!id || !status) {
      throw new BadRequestError('Message ID and status are required');
    }

    const validStatuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('Invalid status. Must be one of: NEW, READ, REPLIED, ARCHIVED');
    }

    return messageRepository.updateMessageStatus(id, status);
  }

  async getMessagesByUserId(userId, page = 1, limit = 20) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    return messageRepository.getMessagesByUserId(userId, page, limit);
  }
}

module.exports = new MessageService();
