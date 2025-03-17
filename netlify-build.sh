#!/bin/bash

# Install dependencies with bun
echo "Installing dependencies with bun..."
bun install

# Build the project
echo "Building the project..."
bun run build

echo "Build completed successfully!" 