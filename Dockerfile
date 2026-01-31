# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:22-alpine AS deps


# Install libc6-compat for Alpine compatibility with some npm packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:22-alpine AS builder

ARG NEXT_PUBLIC_BOT_NAME
ARG NEXT_PUBLIC_BOT_HEAD

ENV NEXT_PUBLIC_BOT_NAME=$NEXT_PUBLIC_BOT_NAME
ENV NEXT_PUBLIC_BOT_HEAD=$NEXT_PUBLIC_BOT_HEAD

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm run build

# ==========================================
# Stage 3: Runner (Production)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy our custom server.js (overwrites Next.js standalone server.js)
COPY --from=builder /app/server.js ./server.js

# Install ws package for WebSocket proxy (needed at runtime)
# We can use npm here since it's just one package and we don't need pnpm in the final image
RUN npm install ws --omit=dev

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname for container networking
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Clawdbot WebSocket URL - configure this to your Clawdbot instance
# Use container name if in same docker network, or host.docker.internal for host access
ENV CLAWDBOT_URL="ws://host.docker.internal:18789"

# Start the application
CMD ["node", "server.js"]
