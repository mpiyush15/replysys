import express from 'express';
import {
  syncTemplates,
  getTemplates,
  createTemplate,
  deleteTemplate
} from '../controllers/templateController';

const router = express.Router();

/**
 * GET /api/client/templates/sync
 * Sync templates from Meta
 */
router.get('/sync', syncTemplates);

/**
 * GET /api/client/templates
 * List templates
 */
router.get('/', getTemplates);

/**
 * POST /api/client/templates
 * Create new template
 * Body: {
 *   name: string (template name),
 *   category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | 'SERVICE_UPDATE',
 *   language: string (default: 'en_US'),
 *   bodyText: string (required, template body with {{1}}, {{2}} for variables),
 *   headerText?: string,
 *   footerText?: string,
 *   buttons?: [ { type, text, url?, phoneNumber? } ],
 *   variables?: [ { name, defaultValue, exampleValue } ],
 *   phoneNumberId: string
 * }
 */
router.post('/', createTemplate);

/**
 * DELETE /api/client/templates/:templateId
 * Delete template
 */
router.delete('/:templateId', deleteTemplate);

module.exports = router;
