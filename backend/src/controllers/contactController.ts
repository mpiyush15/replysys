import { Request, Response } from 'express';
import Contact from '../models/Contact';
import fs from 'fs';

// Simple CSV parser
function parseCSV(content: string) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing (doesn't handle quoted commas well, but works for most cases)
    const values = line.split(',').map((v) => v.trim());
    const record: any = {};

    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });

    records.push(record);
  }

  return records;
}

/**
 * GET /api/client/contacts
 * Get all contacts for account
 */
export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const contacts = await Contact.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: contacts,
    });
  } catch (error: any) {
    console.error('❌ Get contacts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/client/contacts
 * Create a new contact
 */
export const createContact = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { name, phone, phoneNumber, email, tags, notes } = req.body;
    const phoneField = phone || phoneNumber; // Support both field names

    // Debug logging
    console.log('📝 Creating contact:', { userId, name, phoneField });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found. Make sure you are logged in.',
      });
    }

    if (!name || !phoneField) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required',
      });
    }

    // Check if contact already exists
    const existing = await Contact.findOne({ userId, phone: phoneField });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists',
      });
    }

    const contact = await Contact.create({
      userId,
      name,
      phone: phoneField,
      email: email || null,
      tags: tags || [],
      notes: notes || null,
      isAutoSaved: false,
    });

    return res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error('❌ Create contact error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/client/contacts/bulk
 * Bulk upload contacts from CSV
 * Format: name,phone,email,tags,notes
 */
export const bulkUploadContacts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Read CSV file
    const fileContent = fs.readFileSync(file.path, 'utf-8');
    const records = parseCSV(fileContent);

    const contacts = [];
    const errors = [];

    for (const record of records) {
      try {
        const { name, phone, phoneNumber, email, tags, notes } = record;
        const phoneField = phone || phoneNumber;

        if (!name || !phoneField) {
          errors.push(`Skipped row: Missing name or phone number`);
          continue;
        }

        // Check if already exists
        const existing = await Contact.findOne({ userId, phone: phoneField });
        if (existing) {
          errors.push(`Skipped: ${phoneField} already exists`);
          continue;
        }

        const contact = await Contact.create({
          userId,
          name: name.trim(),
          phone: phoneField.trim(),
          email: email?.trim() || null,
          tags: tags ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
          notes: notes?.trim() || null,
          isAutoSaved: false,
        });

        contacts.push(contact);
      } catch (err: any) {
        errors.push(`Error processing row: ${err.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    return res.json({
      success: true,
      count: contacts.length,
      data: contacts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('❌ Bulk upload error:', error);
    const file = (req as any).file;
    if (file) {
      fs.unlinkSync(file.path);
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/client/contacts/:id
 * Get contact details
 */
export const getContactDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const contact = await Contact.findOne({
      _id: id,
      userId,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    return res.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error('❌ Get contact details error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/client/contacts/:id/conversations
 * Get conversations with a contact
 */
export const getContactConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const contact = await Contact.findOne({
      _id: id,
      userId,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // TODO: Query Message collection for messages with this contact's phone number
    // For now, return empty array
    const conversations: any[] = [];

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error('❌ Get conversations error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/client/contacts/:id
 * Update contact
 */
export const updateContact = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, email, tags, notes } = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        email,
        tags,
        notes,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    return res.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error('❌ Update contact error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/client/contacts/:id
 * Delete contact
 */
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await Contact.deleteOne({
      _id: id,
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    return res.json({
      success: true,
      message: 'Contact deleted',
    });
  } catch (error: any) {
    console.error('❌ Delete contact error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Auto-save contact from message
 * (called internally when a message is received)
 */
export const autoSaveContact = async (userId: string, phoneNumber: string, displayName?: string) => {
  try {
    const existing = await Contact.findOne({ userId, phone: phoneNumber });
    
    if (!existing && displayName) {
      console.log(`📞 Auto-saving contact: ${displayName} (${phoneNumber})`);
      
      const contact = await Contact.create({
        userId,
        name: displayName || phoneNumber,
        phone: phoneNumber,
        isAutoSaved: true,
        messageCount: 1,
        lastMessageAt: new Date(),
      });
      
      return contact;
    } else if (existing) {
      // Update message count and last message time
      existing.messageCount = (existing.messageCount || 0) + 1;
      existing.lastMessageAt = new Date();
      await existing.save();
      return existing;
    }
  } catch (error: any) {
    console.error('❌ Auto-save contact error:', error.message);
  }
};
