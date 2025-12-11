FROM node:20-alpine

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy dependency files first
COPY package*.json ./
RUN npm install

# Copy the entire project
COPY . .

# (IMPORTANT) Run build:schema + prisma generate
RUN npm run gen

# Install ts-node to run TypeScript directly
RUN npm install -g ts-node

EXPOSE 5000

# PM2 ecosystem
RUN echo '{\
  "apps": [{\
    "name": "app",\
    "script": "src/app.ts",\
    "interpreter": "ts-node",\
    "instances": 1,\
    "autorestart": true,\
    "max_restarts": 10\
  }]\
}' > ecosystem.config.json

CMD ["pm2-runtime", "ecosystem.config.json"]
