import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyWebhook, handleWebhook } from '../controllers/webhookController';

const router = express.Router();

/**
 * Middleware: Capture raw body BEFORE JSON parsing
 * Must run BEFORE express.json()
 */
const captureRawBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let rawData = '';
  
  req.on('data', chunk => {
    rawData += chunk;
  });
  
  req.on('end', () => {
    (req as any).rawBody = rawData;
    next();
  });
};

/**
 * Middleware: Validate X-Hub-Signature-256
 * Ensures webhook comes from Meta (not spoofed)
 */
const validateWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.warn('⚠️ No X-Hub-Signature-256 header - skipping validation (GET requests skip this)');
    return next();
  }

  try {
    const rawBody = (req as any).rawBody;
    
    if (!rawBody || typeof rawBody !== 'string') {
      console.error('❌ Raw body not available or invalid type:', typeof rawBody);
      return res.status(400).json({
        success: false,
        message: 'Invalid request body'
      });
    }

    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret) {
      console.error('❌ META_APP_SECRET not set - cannot validate webhook');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Calculate HMAC SHA256
    const hash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expected = `sha256=${hash}`;

    if (signature === expected) {
      console.log('✅ Webhook signature validated');
      return next();
    } else {
      console.error('❌ Webhook signature INVALID');
      console.error('   Expected:', expected);
      console.error('   Received:', signature);
      return res.status(403).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
  } catch (error: any) {
    console.error('❌ Error validating signature:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Signature validation error'
    });
  }
};

// Capture raw body BEFORE JSON parsing
router.use(captureRawBody);
router.use(express.json());

/**
 * GET /api/webhooks/whatsapp
 * Webhook Verification (called by Meta during setup)
 * No signature needed for GET
 */
router.get('/whatsapp', verifyWebhook);

/**
 * POST /api/webhooks/whatsapp
 * Webhook Handler (receives messages, status updates, OAuth WABA ID)
 * Signature validation required for POST
 */
router.post('/whatsapp', validateWebhookSignature, handleWebhook);

module.exports = router;
