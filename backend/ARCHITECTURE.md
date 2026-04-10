# 🏗️ ReplySystem Platform Architecture

## Overview

Complete three-tier SaaS platform for WhatsApp/SMS messaging with role-based access control and data isolation.

### User Tiers

```
┌─────────────────────────────────────────┐
│ SUPERADMIN (admin@replysys.com)         │
│ ✓ Full platform access                  │
│ ✓ Manage all clients                    │
│ ✓ View all data                         │
│ ✓ Billing management                    │
└─────────────────────────────────────────┘
           ⬇️
┌─────────────────────────────────────────┐
│ CLIENTS (e.g., company@example.com)     │
│ ✓ Self-service platform                 │
│ ✓ Access only own data (data isolation) │
│ ✓ Send messages                         │
│ ✓ View conversations                    │
└─────────────────────────────────────────┘
           ⬇️
┌─────────────────────────────────────────┐
│ END USERS (SMS recipients)              │
│ ✓ Receive messages                      │
│ ✓ Reply to messages                     │
└─────────────────────────────────────────┘
```

## Architecture Flow

### Authentication Flow

```
1. User logs in with email + password
2. Backend creates JWT token with role + accountId
3. Token contains:
   - id: User ID
   - email: User email
   - role: 'superadmin' | 'client'
   - accountId: (only for clients)

4. Client sends Authorization header: "Bearer {token}"
5. verifyJWT middleware validates token
```

### Request Protection

```
SUPERADMIN ROUTES:
  /api/superadmin/* 
  ↓
  verifyJWT middleware (checks token exists)
  ↓
  requireSuperadmin middleware (checks role === 'superadmin')
  ↓
  Route handler (has full access to all data)

CLIENT ROUTES:
  /api/client/*
  ↓
  verifyJWT middleware (checks token exists)
  ↓
  requireClient middleware (checks role === 'client', sets req.accountId)
  ↓
  isolateByAccount middleware (ensures query/body accountId matches user.accountId)
  ↓
  Route handler (can only access own data)
```

## Data Isolation Strategy

**Key Principle:** Clients can ONLY access data where `accountId` matches their own `accountId`.

### Example

```
CLIENT A LOGS IN:
- email: company-a@example.com
- role: client
- accountId: "company-a"

GET /api/client/messages?accountId=company-a
✅ ALLOWED - isolateByAccount validates accountId matches

GET /api/client/messages?accountId=company-b
❌ BLOCKED - 403 Forbidden - Data isolation prevented

---

SUPERADMIN LOGS IN:
- email: admin@replysys.com
- role: superadmin

GET /api/superadmin/revenue
✅ ALLOWED - Can view all revenue

GET /api/superadmin/clients
✅ ALLOWED - Can view all clients
```

## File Structure

```
backend/src/
├── index.ts                    # Main server entry point
├── types/
│   └── express.d.ts           # Express Request type extensions
├── models/
│   ├── User.ts                # User authentication model (role field)
│   ├── Account.js             # WhatsApp account info
│   ├── PhoneNumber.js         # Connected phone numbers
│   ├── Message.js             # SMS/chat messages
│   ├── Conversation.js        # Chat threads
│   ├── Contact.js             # Client's contact list
│   ├── Client.js              # Client accounts
│   ├── Plan.js                # Billing plans
│   └── Invoice.js             # Billing records
├── middlewares/
│   ├── requireSuperadmin.js   # Protect admin routes
│   ├── requireClient.js       # Protect client routes + attach accountId
│   └── isolateByAccount.js    # Enforce data isolation
└── routes/
    ├── auth.ts                # Login/Register (returns JWT)
    ├── superadminRoutes.js    # Admin endpoints (30+)
    └── clientRoutes.js        # Client endpoints (30+)
```

## Middleware Details

### `verifyJWT` (Global)

```javascript
// In index.ts - runs on all /api/superadmin/* and /api/client/* routes
Checks Authorization header for valid JWT token
Sets req.user = decoded token payload
Returns 401 if token invalid or missing
```

### `requireSuperadmin` (Superadmin Routes Only)

```javascript
// In superadminRoutes.js
Checks req.user.role === 'superadmin'
Returns 403 if not superadmin
Allows: Full data access
```

### `requireClient` (Client Routes Only)

```javascript
// In clientRoutes.js
Checks req.user.role === 'client'
Sets req.accountId = req.user.accountId
Returns 403 if not client
Allows: Limited data access
```

### `isolateByAccount` (Client Routes Only)

```javascript
// In clientRoutes.js (after requireClient)
Validates:
  - req.query.accountId === req.user.accountId
  - req.body.accountId === req.user.accountId
Returns 403 if mismatch detected
Prevents: Client accessing other clients' data
```

## Endpoint Examples

### Superadmin Endpoints

```
GET  /api/superadmin/clients           → List all clients
POST /api/superadmin/clients           → Create client
PUT  /api/superadmin/clients/:id       → Edit client
DELETE /api/superadmin/clients/:id     → Delete client
GET  /api/superadmin/billing           → View all invoices
GET  /api/superadmin/revenue           → View platform revenue
GET  /api/superadmin/plans             → List all plans
POST /api/superadmin/plans             → Create plan
POST /api/superadmin/email/broadcast   → Send newsletter
```

### Client Endpoints

```
GET  /api/client/dashboard             → Dashboard stats
GET  /api/client/messages?accountId=X  → List messages
POST /api/client/messages/send         → Send message
POST /api/client/messages/bulk         → Bulk send
GET  /api/client/conversations         → List chats
GET  /api/client/conversations/:id     → Get chat details
POST /api/client/conversations/:id/reply → Reply to chat
GET  /api/client/contacts              → List contacts
POST /api/client/contacts/upload       → Import contacts
DELETE /api/client/contacts/:id        → Delete contact
GET  /api/client/bot                   → Get bot config
POST /api/client/bot                   → Setup auto-replies
GET  /api/client/invoices?accountId=X  → View invoices
GET  /api/client/usage?accountId=X     → View usage stats
```

## Testing

### Create Test Accounts

```bash
# Admin account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@replysys.com",
    "password": "AdminPassword123!",
    "name": "Admin User",
    "role": "superadmin"
  }'

# Client account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@company.com",
    "password": "ClientPassword123!",
    "name": "Client User",
    "role": "client",
    "accountId": "company-123"
  }'
```

### Login & Get Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@replysys.com",
    "password": "AdminPassword123!"
  }'

# Response includes JWT token:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### Access Protected Route

```bash
# Use token in Authorization header
curl -X GET http://localhost:3001/api/superadmin/clients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Or for client route with data isolation:
curl -X GET http://localhost:3001/api/client/messages?accountId=company-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Environment Variables

```env
# .env file
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/replysys
JWT_SECRET=your-secret-key-here
```

## Next Steps

### Phase 2: OAuth Extraction
Extract WhatsApp OAuth from old repo:
- `oauthController.js` → /backend/src/controllers/
- `oauthRoutes.js` → /backend/src/routes/
- Integrates with `/api/superadmin/oauth/*` or `/api/client/oauth/*`

### Phase 3: WhatsApp Service
Extract WhatsApp message service:
- `whatsappService.js` → /backend/src/services/
- Called by `/api/client/messages/send`
- Handles sendMessage, sendBulk, updateStatus

### Phase 4: Webhook Handler
Extract webhook receiver:
- `webhookRoutes.js` → /backend/src/routes/webhooks/
- Mounts at `/api/webhooks/whatsapp` (no auth needed)
- Receives incoming messages from WhatsApp

### Phase 5: Socket.io Integration
Real-time message delivery:
- Extract from old repo: `socketService.js`
- Live chat notifications
- Instant message delivery

## Security Checklist

- ✅ Password hashing with bcryptjs
- ✅ JWT token validation
- ✅ Role-based access control
- ✅ Data isolation by accountId
- ✅ CORS configured
- ✅ Error handling (401/403 responses)
- ⏳ Rate limiting (pending)
- ⏳ Input validation (pending)
- ⏳ HTTPS/TLS (pending production)

---

**Status:** ✅ Architecture skeleton complete. Ready for Phase 2 extraction.
