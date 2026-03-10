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

# Install ALL dependencies from official whatsapp-web.js documentation for no-GUI systems
# Reference: https://wwebjs.dev/guide/#installation-on-no-gui-systems
RUN apt-get update && apt-get install -y \
  ffmpeg \
  gconf-service \
  libgbm-dev \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3-tools \
  lsb-release \
  xdg-utils \
  libdrm2 \
  libgbm1 \
  libatspi2.0-0 \
  libxshmfence1 \
  libxkbcommon0 \
  libxcb-dri3-0 \
  libu2f-udev \
  && rm -rf /var/lib/apt/lists/*

# Set Chrome path
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# Create directory for puppeteer cache
RUN mkdir -p /app/.wwebjs_auth && chmod 777 /app/.wwebjs_auth

# Expose port if needed (optional, e.g. for express server)
# EXPOSE 3000

# Start the bot with cleanup script
CMD ["/app/start.sh"]
