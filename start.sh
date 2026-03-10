#!/bin/bash

# Cleanup Chrome lock files
echo "🧹 Cleaning up Chrome lock files..."
find /app/.wwebjs_auth -type f -name "SingletonLock" -delete 2>/dev/null || true
find /app/.wwebjs_auth -type f -name ".lock" -delete 2>/dev/null || true
find /app/.wwebjs_auth -type f -name "lockfile" -delete 2>/dev/null || true

# Check if session exists but might be corrupt
if [ -d "/app/.wwebjs_auth/session-client" ]; then
  SESSION_AGE=$(find /app/.wwebjs_auth/session-client -type f -printf '%T@\n' | sort -n | tail -1)
  CURRENT_TIME=$(date +%s)
  AGE_DIFF=$((CURRENT_TIME - ${SESSION_AGE%.*}))
  
  # If session older than 7 days, might be corrupt
  if [ $AGE_DIFF -gt 604800 ]; then
    echo "⚠️  Warning: Session data is older than 7 days, might cause login issues"
    echo "💡 If stuck at 'Logging in', stop the container and run:"
    echo "   sudo rm -rf ./.wwebjs_auth"
  fi
fi

# Start the bot
echo "🚀 Starting WhatsApp Bot..."
node index.js
