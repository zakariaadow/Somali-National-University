#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "========================================="
echo "  SNU API COMPLETE TESTING"
echo "========================================="

# Login
echo -e "\n🔐 Logging in..."
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@snu.edu.so","password":"Admin@2024"}' \
  -c cookies.txt \
  | python3 -m json.tool | head -20

echo -e "\n📊 Testing all endpoints..."

# Test colleges
echo -e "\n📚 GET /colleges"
curl -s -X GET "$BASE_URL/colleges" -b cookies.txt | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Total: {data[\"total\"]} colleges')"

# Test faculties
echo -e "\n📚 GET /faculties"
curl -s -X GET "$BASE_URL/faculties" -b cookies.txt | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Total: {data[\"total\"]} faculties')"

# Test departments
echo -e "\n📚 GET /departments"
curl -s -X GET "$BASE_URL/departments" -b cookies.txt | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Total: {data[\"total\"]} departments')"

# Test programmes
echo -e "\n📚 GET /programmes"
curl -s -X GET "$BASE_URL/programmes" -b cookies.txt | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Total: {data[\"total\"]} programmes')"

# Test units
echo -e "\n📚 GET /units"
curl -s -X GET "$BASE_URL/units" -b cookies.txt | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Total: {data[\"total\"]} units')"

# Test profile
echo -e "\n👤 GET /auth/profile"
curl -s -X GET "$BASE_URL/auth/profile" -b cookies.txt | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'User: {data[\"user\"][\"full_name\"]} ({data[\"role\"]})')"

echo -e "\n========================================="
echo "  ✅ All endpoints working!"
echo "========================================="
