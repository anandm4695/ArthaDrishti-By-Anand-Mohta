#!/bin/bash

# ==============================================================================
# ArthaDrishti by Anand Mohta - Automated Restoration Script
# ==============================================================================

set -e

echo "🚀 [1/5] Starting ArthaDrishti Environment Restoration..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v20+ or v24+) from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detected: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm detected: $NPM_VERSION"

# Restore .env if missing but .env.backup exists
echo "🔍 [2/5] Checking environment configuration (.env)..."
if [ ! -f .env ]; then
    if [ -f .env.backup ]; then
        echo "📄 Copying .env.backup to .env..."
        cp .env.backup .env
        echo "✅ .env successfully restored from .env.backup!"
    else
        echo "⚠️  Warning: Neither .env nor .env.backup was found. Please make sure .env is configured."
    fi
else
    echo "✅ .env file is present."
fi

# Clean & Install dependencies
echo "📦 [3/5] Installing project dependencies via npm..."
npm install

# TypeScript check
echo "🔍 [4/5] Running TypeScript compiler verification..."
npx tsc --noEmit
echo "✅ TypeScript check passed with 0 errors!"

# Build check
echo "🏗️ [5/5] Testing production build..."
npm run build
echo "✅ Production build succeeded!"

echo "=============================================================================="
echo "🎉 RESTORATION COMPLETE! Everything is 100% ready."
echo "👉 Run 'npm run dev' to launch the application."
echo "=============================================================================="
