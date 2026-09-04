FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN rm -rf node_modules && npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
