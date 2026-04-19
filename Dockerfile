FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production --silent || npm install --silent

# Copy app source
COPY . .

# Initialize the database (if you rely on init_db.js)
RUN node init_db.js || true

EXPOSE 3000

# Run the Node server (Express serves static files and API)
CMD ["node", "server.js"]