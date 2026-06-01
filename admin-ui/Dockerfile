# Stage 1: Build the React Application
FROM node:20-alpine as builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the application (injects API URL if provided via build arguments)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_PATIENT_URL
ENV VITE_PATIENT_URL=$VITE_PATIENT_URL
RUN npm run build

# Stage 2: Serve the application with NGINX
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
