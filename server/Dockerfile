# Build backend
FROM node:18
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server .
COPY --from=builder /app/client/build ./client/build

EXPOSE ${PORT}
CMD ["node", "server.js"]