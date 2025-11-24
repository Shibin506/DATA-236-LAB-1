#!/bin/bash

echo "🚀 Starting Airbnb Application..."

# Start backend
echo "📦 Starting Backend..."
cd Backend
node src/server.js > /tmp/airbnb-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend..."
cd ../Frontend
npm run dev > /tmp/airbnb-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Application started!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/airbnb-backend.log"
echo "   Frontend: tail -f /tmp/airbnb-frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
