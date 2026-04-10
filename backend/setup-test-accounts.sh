#!/bin/bash

# Create admin account for testing
echo "🔧 Creating test admin account..."

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@replysys.com",
    "password": "AdminPassword123!",
    "name": "Admin User",
    "role": "superadmin"
  }' \
  2>/dev/null | jq '.'

echo ""
echo "🔧 Creating test client account..."

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@company.com",
    "password": "ClientPassword123!",
    "name": "Client User",
    "role": "client",
    "accountId": "company-123"
  }' \
  2>/dev/null | jq '.'

echo ""
echo "✅ Test accounts created!"
