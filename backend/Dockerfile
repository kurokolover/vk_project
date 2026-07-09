FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY backend ./backend
COPY config ./config
COPY dist ./dist
EXPOSE 3001
CMD ["node", "backend/index.js"]
