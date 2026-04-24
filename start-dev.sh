#!/bin/bash

# Development server startup script
echo "Starting VaultNote development environment..."

# Start PHP server for API in background
echo "Starting PHP API server on port 8000..."
cd "$(dirname "$0")"
php -S 127.0.0.1:8000 -t api/index.php > php-server.log 2>&1 &
PHP_PID=$!

# Wait a moment for PHP server to start
sleep 2

# Check if PHP server started successfully
if curl -s http://127.0.0.1:8000/api/vaults > /dev/null; then
    echo "✅ PHP API server started successfully on port 8000"
else
    echo "❌ Failed to start PHP API server"
    kill $PHP_PID 2>/dev/null
    exit 1
fi

# Start Vite development server
echo "Starting Vite development server..."
npm run dev

# Cleanup function to kill PHP server when Vite stops
cleanup() {
    echo "Stopping PHP API server..."
    kill $PHP_PID 2>/dev/null
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for Vite process
wait
