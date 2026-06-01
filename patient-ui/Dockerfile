# Stage 1: Build the React Application
FROM node:20-alpine as builder
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application (injects API URL if provided via build arguments)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve the application with NGINX
FROM nginx:alpine

# Copy the build output from Stage 1 to NGINX's serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom NGINX configuration to support React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
