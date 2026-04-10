import express from 'express';
import multer from 'multer';
import {
  getContacts,
  createContact,
  bulkUploadContacts,
  getContactDetails,
  getContactConversations,
  updateContact,
  deleteContact,
} from '../controllers/contactController';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * GET /api/client/contacts
 * Get all contacts
 */
router.get('/', getContacts);

/**
 * POST /api/client/contacts
 * Create new contact
 */
router.post('/', createContact);

/**
 * POST /api/client/contacts/bulk
 * Bulk upload CSV
 */
router.post('/bulk', upload.single('file'), bulkUploadContacts);

/**
 * GET /api/client/contacts/:id
 * Get contact details
 */
router.get('/:id', getContactDetails);

/**
 * GET /api/client/contacts/:id/conversations
 * Get conversations with contact
 */
router.get('/:id/conversations', getContactConversations);

/**
 * PUT /api/client/contacts/:id
 * Update contact
 */
router.put('/:id', updateContact);

/**
 * DELETE /api/client/contacts/:id
 * Delete contact
 */
router.delete('/:id', deleteContact);

module.exports = router;
