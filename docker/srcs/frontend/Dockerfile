
# Base image - small Linux distro with Node preinstalled
FROM node:20-alpine

# Define IP and set is as environment variable inside the container
ARG IP
ENV IP=${IP}

# Set working directory inside the container
# All following commands run from here
WORKDIR /app

# Copy package files before the rest of the code
# if dependencies didnt change it wont run npm install which saves a lot of time
COPY package*.json ./

# Install all dependencies and openssl for cert generation
RUN apk add --no-cache openssl \
	&& npm install

# Copy the rest of your code into the container
COPY . .

# Create directory for certs and generate self-signed certificate with SAN for localhost and custom IP
RUN mkdir -p /app/certs \
  && printf "[req]\ndistinguished_name=req\nreq_extensions = v3_req\n[req_distinguished_name]\n[v3_req]\nsubjectAltName=DNS:localhost,DNS:${IP},IP:127.0.0.1\n" > /app/certs/openssl.cnf \
  && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /app/certs/key.pem \
    -out /app/certs/cert.pem \
    -subj "/CN=localhost" \
    -extensions v3_req -config /app/certs/openssl.cnf

# Generate Prisma client for Linux
RUN npx prisma generate

# Tell Docker this container listens on port 3000
EXPOSE 3000

# Regenerate Prisma after bind mounts are applied, then run migrations and start dev.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]