# Base image - small Linux distro with Node preinstalled
FROM node:20-alpine

# Set working directory inside the container
# All following commands run from here
WORKDIR /app

# Copy package files before the rest of the code
# if dependecies didnt change it wont run npm install which save alot of time
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your code into the container
COPY . .

# Tell Docker this container listens on port 3000
EXPOSE 3000

# Command that runs when the container starts
CMD ["npm", "run", "dev"]