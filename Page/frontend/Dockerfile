FROM node:20-slim

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy lock and package files
COPY bazar/package.json bazar/pnpm-lock.yaml* bazar/pnpm-workspace.yaml* ./bazar/

# Install dependencies in bazar workspace
WORKDIR /app/bazar
RUN pnpm install

# Copy project files
WORKDIR /app
COPY . .

# Set working directory to Next.js app directory
WORKDIR /app/bazar

EXPOSE 3000
