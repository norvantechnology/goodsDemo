#!/bin/bash
# GoodsDemo ERP - Start Script

echo "🚀 Starting GoodsDemo ERP..."
echo ""

# Check MongoDB
if ! pgrep -x mongod > /dev/null; then
  echo "Starting MongoDB..."
  sudo systemctl start mongod 2>/dev/null || mongod --fork --logpath /tmp/mongod.log 2>/dev/null || echo "⚠️  Please ensure MongoDB is running"
fi

echo "📦 Starting Backend (port 5000)..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!

sleep 3

echo "🌐 Starting Frontend (port 3000)..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ GoodsDemo ERP is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

wait $BACKEND_PID $FRONTEND_PID
