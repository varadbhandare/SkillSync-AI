# SkillSync AI - Production Dockerfile
# Multi-platform production container (Node LTS)

FROM node:20-alpine AS base

# Install curl for container health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY skillsync-ai-backend/skillsync-ai-backend/package*.json ./skillsync-ai-backend/skillsync-ai-backend/

# Install only production dependencies
WORKDIR /app/skillsync-ai-backend/skillsync-ai-backend
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source files
WORKDIR /app
COPY skillsync-ai-backend/skillsync-ai-backend ./skillsync-ai-backend/skillsync-ai-backend
COPY skillsync-ai-frontend/skillsync-ai-frontend ./skillsync-ai-frontend/skillsync-ai-frontend
COPY SkillSync_AI_Architecture_and_Algorithms_Manual.pdf ./

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5000
ENV TRUST_PROXY=true

# Security: run as non-root node user
USER node

WORKDIR /app/skillsync-ai-backend/skillsync-ai-backend

EXPOSE 5000

# Container healthcheck against /api/status endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:${PORT:-5000}/api/status || exit 1

CMD ["npm", "start"]
