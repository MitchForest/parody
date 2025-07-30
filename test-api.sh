#!/bin/bash

echo "Testing Portfolio Roaster API..."
echo "================================"

curl -X POST http://localhost:3002/api/roast \
  -H "Content-Type: application/json" \
  -d '{"url": "https://zakirgowani.dev"}' \
  --silent --show-error | jq '.'