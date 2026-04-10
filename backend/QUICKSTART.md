# 🚀 Quick Start Guide

## Installation

```bash
cd backend
npm install
```

## Environment Setup

```bash
# Copy example env
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=your-secret-key
```

## Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## Test Endpoints

### 1. Create Admin Account

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@replysys.com",
    "password": "Admin@123",
    "name": "Admin",
    "role": "superadmin"
  }'
```

### 2. Login to Get Token

```bash
RESPONSE=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@replysys.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Your token: $TOKEN"
```

### 3. Access Admin Route

```bash
curl -X GET http://localhost:3001/api/superadmin/clients \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Create Client Account

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@company.com",
    "password": "Client@123",
    "name": "Company Client",
    "role": "client",
    "accountId": "company-456"
  }'
```

### 5. Test Data Isolation

```bash
# Login as client and get token
CLIENT_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@company.com",
    "password": "Client@123"
  }' | jq -r '.token')

# Try accessing with correct accountId ✅
curl -X GET "http://localhost:3001/api/client/dashboard?accountId=company-456" \
  -H "Authorization: Bearer $CLIENT_TOKEN"

# Try accessing with wrong accountId ❌ (should be blocked)
curl -X GET "http://localhost:3001/api/client/dashboard?accountId=other-company" \
  -H "Authorization: Bearer $CLIENT_TOKEN"
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts                 ← Server entry point
│   ├── models/                  ← Database models
│   ├── middlewares/             ← Auth & isolation
│   ├── routes/                  ← API endpoints
│   └── types/                   ← TypeScript types
├── dist/                        ← Compiled JavaScript
├── ARCHITECTURE.md              ← Detailed docs
└── package.json
```

## Build for Production

```bash
npm run build
npm start
```

## Debugging

### Check MongoDB Connection

```bash
npm run dev
# Should see: "✅ MongoDB connected successfully"
```

### Verify JWT Token

```bash
# Token should have format: "eyJ..."
echo $TOKEN | cut -d'.' -f1,2 | while IFS='.' read -r header payload; do
  echo "Header: $(echo "$header" | base64 -d)"
  echo "Payload: $(echo "$payload" | base64 -d)"
done
```

### Common Errors

| Error | Solution |
|-------|----------|
| `MONGODB_URI is not defined` | Add MONGODB_URI to .env |
| `No token provided` | Include `Authorization: Bearer {token}` header |
| `Superadmin access only` | Use admin account (role: superadmin) |
| `Data isolation` | Ensure accountId in URL matches user's accountId |

## Next: Extract WhatsApp Code

Once this is working:
1. Extract OAuth from old repo
2. Extract WhatsApp service
3. Extract webhook handlers
4. Add Socket.io for real-time

See ARCHITECTURE.md for detailed roadmap.

---

Ready to extract the old repo code? 🚀
