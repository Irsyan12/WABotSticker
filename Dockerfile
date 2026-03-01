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
RUN apt-get update && apt-get install -y \
  ffmpeg \
  libnspr4 \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatspi2.0-0 \
  libdrm2 \
  libpango-1.0-0 \
  libxshmfence1 \
  libxfixes3 \
  libxext6 \
  libx11-6 \
  libnss3-tools \
  libxss1 \
  libxtst6 \
  libappindicator3-1 \
  libindicator3-7 \
  fonts-liberation \
  libu2f-udev \
  && rm -rf /var/lib/apt/lists/*

# Expose port if needed (optional, e.g. for express server)
# EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]
