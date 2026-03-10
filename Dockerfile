# Dockerfile for WhatsApp Sticker Bot
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Make start script executable
RUN chmod +x /app/start.sh

# Install Chrome and dependencies
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
  && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Install ffmpeg and other dependencies
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
  fonts-liberation \
  libu2f-udev \
  libcups2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcb-dri3-0 \
  && rm -rf /var/lib/apt/lists/*

# Set Chrome path
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# Create directory for puppeteer cache
RUN mkdir -p /app/.wwebjs_auth && chmod 777 /app/.wwebjs_auth

# Expose port if needed (optional, e.g. for express server)
# EXPOSE 3000

# Start the bot with cleanup script
CMD ["/app/start.sh"]
