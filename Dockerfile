FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "--max-old-space-size=4096", "server/index.js"]
