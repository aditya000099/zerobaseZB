FROM node:18 AS builder

# Build React dashboard
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client .
RUN npm run build