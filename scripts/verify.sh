#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
pnpm install

echo "Running lint..."
pnpm lint

echo "Running build..."
pnpm build

echo "Running tests..."
pnpm test

echo "All checks passed."
