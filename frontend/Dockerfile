FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

# Set environment variables for production build
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
