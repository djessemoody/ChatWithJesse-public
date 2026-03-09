# Stage 1: Build the React frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Express backend
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Copy server build and production dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY server/src/persona ./server/dist/persona

# Copy built frontend
COPY --from=client-build /app/client/dist ./client/dist

# Run as non-root user for security
RUN chown -R node:node /app
USER node

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server/dist/index.js"]
