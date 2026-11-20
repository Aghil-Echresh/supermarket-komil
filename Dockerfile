# Use a slim Node image
FROM node:20-bookworm-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
