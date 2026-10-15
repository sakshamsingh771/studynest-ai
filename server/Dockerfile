FROM node:20-alpine

WORKDIR /app

# Install deps first, separately from copying source — Docker caches this layer,
# so `docker compose build` skips the (slow) npm install on every code change.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN mkdir -p uploads

EXPOSE 5000
CMD ["node", "src/server.js"]
