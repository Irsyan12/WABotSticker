# Dockerfile for WhatsApp Sticker Bot
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Install ffmpeg (for Debian/Ubuntu based images)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Expose port if needed (optional, e.g. for express server)
# EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]
