#!/bin/bash

# Development server startup script
echo "Starting VaultNote development environment..."

cd "$(dirname "$0")"

# Try PHP server first (production-like setup)
echo "Attempting to start PHP server on port 8000..."
php -S localhost:8000 -t . api/index.php > php-server.log 2>&1 &
PHP_PID=$!

# Wait a moment for PHP server to start
sleep 2

# Check if PHP server started successfully
if curl -s http://127.0.0.1:8000/api/vaults > /dev/null 2>&1; then
    echo "✅ PHP server started successfully on port 8000"
    SERVER_PID=$PHP_PID
    SERVER_TYPE="PHP"
else
    echo "❌ Failed to start PHP server, falling back to CJS mock server..."
    kill $PHP_PID 2>/dev/null

    # Start CJS mock server for API in background
    echo "Starting CJS mock server on port 8000..."
    node mock-server.cjs > mock-server.log 2>&1 &
    MOCK_PID=$!

    # Wait a moment for mock server to start
    sleep 2

    # Check if mock server started successfully
    if curl -s http://127.0.0.1:8000/api/vaults > /dev/null; then
        echo "✅ CJS mock server started successfully on port 8000"
        SERVER_PID=$MOCK_PID
        SERVER_TYPE="CJS mock"
    else
        echo "❌ Failed to start CJS mock server"
        kill $MOCK_PID 2>/dev/null
        exit 1
    fi
fi

# Start Vite development server
echo "Starting Vite development server..."
npm run dev

# Cleanup function to kill server when Vite stops
cleanup() {
    echo "Stopping $SERVER_TYPE server..."
    kill $SERVER_PID 2>/dev/null
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for Vite process
wait
