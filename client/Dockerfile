# Stage 1: build the static React bundle
FROM node:20-alpine AS build
WORKDIR /app

# VITE_API_URL is baked into the JS bundle at build time (Vite reads env vars
# at build, not runtime). Default to a relative "/api" — see nginx.conf, which
# proxies that path to the server container. This is also what avoids CORS
# entirely in production: browser, API, and static files all appear same-origin.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: serve the built bundle with Nginx — the final image has no Node.js
# in it at all, just static files + a tiny web server.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
