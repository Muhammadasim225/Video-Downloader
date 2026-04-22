FROM node:18-bookworm

# Install ffmpeg, python3, and pip (required for yt-dlp and its dependencies)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip curl && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp and impersonation dependencies (curl-cffi) via pip
RUN pip3 install --no-cache-dir "yt-dlp[default,curl-cffi]" --break-system-packages

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]