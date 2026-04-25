# Base image - small Linux distro with Node preinstalled
FROM node:20-alpine

# Set working directory inside the container
# All following commands run from here
WORKDIR /app

# Copy package files before the rest of the code
# if dependencies didnt change it wont run npm install which saves a lot of time
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your code into the container
COPY . .

# Generate Prisma client for Linux
RUN npx prisma generate

# Tell Docker this container listens on port 3000
EXPOSE 3000

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]