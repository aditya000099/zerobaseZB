FROM node:18 AS builder

WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci
COPY client ./client
RUN cd client && npm run build

FROM node:18
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server .
COPY --from=builder /app/client/build ./client/build

EXPOSE 3000
CMD ["node", "server.js"]