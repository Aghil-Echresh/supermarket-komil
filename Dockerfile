# Use a slim Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy app source
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
